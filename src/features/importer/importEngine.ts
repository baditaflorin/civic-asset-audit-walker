import { buildInfo } from "../../lib/buildInfo";
import {
  assetKindSchema,
  auditReportSchema,
  conditionSchema,
  normalizeAssetTag,
  type AssetKind,
  type AuditLocation,
  type AuditReport,
  type Condition,
  type Inference,
  type ReportConfidence,
  type ReportProvenance
} from "../../lib/schema";

export type ImportIssueSeverity = "info" | "warning" | "error" | "fatal";

export type ImportIssue = {
  severity: ImportIssueSeverity;
  code: string;
  what: string;
  why: string;
  nowWhat: string;
  rowNumber?: number;
};

export type ImportProgress = {
  phase: "reading" | "normalizing" | "parsing" | "inferring" | "done";
  completed: number;
  total: number;
};

export type ImportAnalysis = {
  reports: AuditReport[];
  issues: ImportIssue[];
  stats: {
    inputFormat: "json" | "csv" | "text" | "empty";
    shape: string;
    totalRows: number;
    acceptedRows: number;
    durationMs: number;
    inputBytes: number;
    appVersion: string;
  };
};

export type AnalyzeImportOptions = {
  filename?: string;
  sourceIdentifier?: string;
  signal?: AbortSignal;
  onProgress?: (progress: ImportProgress) => void;
};

type RawRecord = {
  rowNumber: number;
  record: Record<string, unknown>;
  shape: string;
};

type FieldInference<T> = {
  value: T;
  confidence: Inference;
};

const EPOCH = "1970-01-01T00:00:00.000Z";
const analysisCache = new Map<string, ImportAnalysis>();

export async function decodeImportFile(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  const utf8 = new TextDecoder("utf-8", { fatal: false }).decode(bytes);
  const repaired = repairText(utf8);

  if (!utf8.includes("\uFFFD") && repaired === utf8) {
    return repaired;
  }

  try {
    return repairText(new TextDecoder("windows-1252", { fatal: false }).decode(bytes));
  } catch {
    return repaired;
  }
}

export async function analyzeImportText(
  input: string,
  options: AnalyzeImportOptions = {}
): Promise<ImportAnalysis> {
  const started = performance.now();
  const issues: ImportIssue[] = [];
  options.onProgress?.({ phase: "normalizing", completed: 0, total: 1 });

  const normalized = repairText(input);
  const inputBytes = new TextEncoder().encode(input).byteLength;
  const cacheKey = stableHex(`${options.filename ?? ""}|${normalized}`, 24);

  if (analysisCache.has(cacheKey)) {
    return cloneAnalysis(analysisCache.get(cacheKey)!);
  }

  if (normalized !== input && /â[]/.test(input)) {
    issues.push(
      issue(
        "info",
        "encoding_repaired",
        "Text encoding was repaired.",
        "The input contained common mojibake sequences such as smart quotes encoded as â.",
        "Review repaired text if it carries legal or operational meaning."
      )
    );
  }

  if (normalized.trim().length === 0) {
    const analysis = {
      reports: [],
      issues: [
        issue(
          "fatal",
          "empty_input",
          "The file is empty.",
          "There are no rows to import.",
          "Choose a non-empty export, CSV, JSON, or field note."
        )
      ],
      stats: emptyStats(started, inputBytes)
    };
    rememberAnalysis(cacheKey, analysis);
    return cloneAnalysis(analysis);
  }

  options.signal?.throwIfAborted();
  const parsed = parseRecords(normalized, issues, options);
  options.signal?.throwIfAborted();

  const reports: AuditReport[] = [];
  const total = parsed.records.length;

  for (let index = 0; index < parsed.records.length; index += 1) {
    if (index % 250 === 0) {
      options.onProgress?.({ phase: "inferring", completed: index, total });
      await yieldToBrowser();
      options.signal?.throwIfAborted();
    }

    const raw = parsed.records[index];
    const result = inferReport(raw, options);
    if (result.report) {
      reports.push(result.report);
    }
    issues.push(...result.issues);
  }

  const deduped = dedupeReports(reports, issues);
  options.onProgress?.({ phase: "done", completed: deduped.length, total });

  const analysis = {
    reports: canonicalReports(deduped),
    issues: canonicalIssues(issues),
    stats: {
      inputFormat: parsed.inputFormat,
      shape: parsed.shape,
      totalRows: parsed.records.length,
      acceptedRows: deduped.length,
      durationMs: Math.round(performance.now() - started),
      inputBytes,
      appVersion: buildInfo.version
    }
  };
  rememberAnalysis(cacheKey, analysis);
  return cloneAnalysis(analysis);
}

export function canonicalImportExport(reports: AuditReport[]) {
  return JSON.stringify(
    {
      type: "caw.canonical.v2",
      schemaVersion: 2,
      appVersion: buildInfo.version,
      reports: canonicalReports(reports)
    },
    null,
    2
  );
}

function parseRecords(
  text: string,
  issues: ImportIssue[],
  options: AnalyzeImportOptions
): {
  inputFormat: ImportAnalysis["stats"]["inputFormat"];
  shape: string;
  records: RawRecord[];
} {
  options.onProgress?.({ phase: "parsing", completed: 0, total: 1 });
  const trimmed = text.trim();

  if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
    const parsed = parseJsonWithRecovery(trimmed, issues);
    const records = recordsFromJson(parsed.value, issues);
    return {
      inputFormat: "json",
      shape: detectShape(records.map((row) => row.record)),
      records
    };
  }

  if (looksLikeCsv(text)) {
    const rows = parseCsv(text);
    if (rows.length === 0) {
      return {
        inputFormat: "csv",
        shape: "empty-csv",
        records: []
      };
    }
    const [headers, ...data] = rows;
    const normalizedHeaders = headers.map(normalizeHeader);
    const records = data
      .filter((row) => row.some((cell) => cell.trim().length > 0))
      .map((row, index) => ({
        rowNumber: index + 2,
        record: Object.fromEntries(
          normalizedHeaders.map((header, column) => [header, row[column] ?? ""])
        ),
        shape: "csv"
      }));
    return {
      inputFormat: "csv",
      shape: detectShape(records.map((row) => row.record)),
      records
    };
  }

  return {
    inputFormat: "text",
    shape: "field-note",
    records: [{ rowNumber: 1, record: { note: text }, shape: "field-note" }]
  };
}

function parseJsonWithRecovery(text: string, issues: ImportIssue[]): { value: unknown } {
  try {
    return { value: JSON.parse(stripTrailingCommas(text)) };
  } catch {
    const objects = salvageJsonObjects(text);
    if (objects.length === 0) {
      issues.push(
        issue(
          "fatal",
          "invalid_json",
          "The JSON could not be parsed.",
          "The file is not valid JSON and no complete report objects were recoverable.",
          "Export the file again or import CSV/text instead."
        )
      );
      return { value: [] };
    }

    issues.push(
      issue(
        "warning",
        "partial_json",
        "The JSON ended early or was malformed.",
        `${objects.length} complete object${objects.length === 1 ? " was" : "s were"} recovered from the partial file.`,
        "Review recovered rows before relying on the import."
      )
    );
    return { value: objects };
  }
}

function recordsFromJson(value: unknown, issues: ImportIssue[]): RawRecord[] {
  if (typeof value === "object" && value !== null && "reports" in value) {
    const reports = (value as { reports?: unknown }).reports;
    return Array.isArray(reports)
      ? reports.map((record, index) => ({
          rowNumber: index + 1,
          record: toRecord(record),
          shape: "caw-export"
        }))
      : [];
  }

  if (typeof value === "object" && value !== null && "elements" in value) {
    const elements = (value as { elements?: unknown }).elements;
    return Array.isArray(elements)
      ? elements.map((record, index) => ({
          rowNumber: index + 1,
          record: flattenOsmElement(toRecord(record)),
          shape: "osm-overpass"
        }))
      : [];
  }

  if (Array.isArray(value)) {
    return value.map((record, index) => ({
      rowNumber: index + 1,
      record: toRecord(record),
      shape: "json-array"
    }));
  }

  issues.push(
    issue(
      "fatal",
      "unsupported_json_shape",
      "The JSON shape is not recognized.",
      "It is not a Civic Asset export, OSM Overpass response, or row array.",
      "Import a CSV, OSM Overpass JSON, 311 JSON array, or Civic Asset export."
    )
  );
  return [];
}

function inferReport(
  raw: RawRecord,
  options: AnalyzeImportOptions
): { report?: AuditReport; issues: ImportIssue[] } {
  const issues: ImportIssue[] = [];

  const existing = auditReportSchema.safeParse(raw.record);
  if (existing.success) {
    const report = existing.data;
    return {
      report: {
        ...report,
        confidence: report.confidence ?? highConfidence("App-native report schema matched."),
        provenance:
          report.provenance ??
          provenance(raw, {
            sourceType: "caw-export",
            sourceId: report.assetTag,
            sourceLabel: options.sourceIdentifier ?? options.filename
          })
      },
      issues
    };
  }

  const shape = detectShape([raw.record], raw.shape);
  const assetKind = inferAssetKind(raw.record, shape);
  const condition = inferCondition(raw.record, shape);
  const location = inferLocation(raw.record);
  const sourceId = inferSourceId(raw.record, shape);
  const assetTag = inferAssetTag(raw.record, shape, sourceId, location.value);
  const date = inferDate(raw.record);
  const notes = buildNotes(raw.record);
  const warnings: string[] = [];
  const suggestions: string[] = [];

  if (condition.confidence.score < 0.6) {
    issues.push(
      issue(
        "warning",
        "low_condition_confidence",
        "Condition was inferred with low confidence.",
        condition.confidence.reason,
        "Review this report before sharing it.",
        raw.rowNumber
      )
    );
    warnings.push("Condition inferred with low confidence.");
  }

  if (!location.value) {
    issues.push(
      issue(
        "warning",
        "missing_location",
        "No usable location was found.",
        "The row did not include latitude/longitude or a supported geometry field.",
        "Save the report without a map marker or add coordinates later.",
        raw.rowNumber
      )
    );
    warnings.push("Missing location.");
  }

  if (hasDuplicateStatus(raw.record)) {
    issues.push(
      issue(
        "info",
        "duplicate_request",
        "This 311 request is marked as a duplicate.",
        "The source status contains duplicate wording.",
        "Keep it as context, but avoid counting it as a unique asset without review.",
        raw.rowNumber
      )
    );
    warnings.push("Source marked as duplicate.");
  }

  if (hasStaleCheckDate(raw.record)) {
    issues.push(
      issue(
        "warning",
        "stale_check_date",
        "The OSM check date is stale.",
        "The last check date is more than two years old.",
        "Treat condition as a review candidate, not a current observation.",
        raw.rowNumber
      )
    );
    warnings.push("Stale check date.");
  }

  if (!sourceId) {
    issues.push(
      issue(
        "info",
        "generated_source_id",
        "A stable source ID was generated.",
        "The row did not include a recognized asset or request identifier.",
        "Use the generated ID unless a sticker or municipal ID is known.",
        raw.rowNumber
      )
    );
    suggestions.push("Add a sticker or municipal asset ID when available.");
  }

  if (hasSpreadsheetFormulaText(raw.record)) {
    issues.push(
      issue(
        "warning",
        "spreadsheet_formula_text",
        "A note looks like a spreadsheet formula.",
        "Spreadsheet apps may execute cells that begin with =, +, -, or @.",
        "The app treats it as inert text and neutralizes it during CSV export.",
        raw.rowNumber
      )
    );
    warnings.push("Spreadsheet formula-like text preserved as inert notes.");
  }

  if (containsEncodingRepair(raw.record)) {
    issues.push(
      issue(
        "info",
        "encoding_repaired",
        "Text encoding was repaired.",
        "The row contained common mojibake sequences such as smart quotes encoded as â.",
        "Review repaired text if it carries legal or operational meaning.",
        raw.rowNumber
      )
    );
    warnings.push("Encoding repaired.");
  }

  const confidence = combineConfidence(
    assetTag.confidence,
    assetKind.confidence,
    condition.confidence,
    location.confidence
  );
  const prov = provenance(raw, {
    sourceType: shape,
    sourceId: sourceId ?? assetTag.value,
    sourceLabel: options.sourceIdentifier ?? options.filename,
    warnings,
    suggestions
  });

  const report = auditReportSchema.parse({
    schemaVersion: 1,
    id: stableUuid(
      `${shape}|${sourceId ?? ""}|${assetTag.value}|${JSON.stringify(location.value ?? {})}|${notes}`
    ),
    assetTag: assetTag.value,
    tagFamily: "inferred",
    assetKind: assetKind.value,
    condition: condition.value,
    location: location.value,
    notes,
    createdAt: date,
    updatedAt: date,
    source: "import",
    confidence,
    provenance: prov
  });

  return { report, issues };
}

function inferAssetKind(
  record: Record<string, unknown>,
  shape: string
): FieldInference<AssetKind> {
  const haystack = searchable(record);
  const explicit = firstString(record, [
    "assetkind",
    "asset_kind",
    "tip",
    "type",
    "asset",
    "amenity",
    "highway"
  ]);

  if (assetKindSchema.safeParse(explicit).success) {
    return field(explicit as AssetKind, 0.99, "Asset kind matched the app schema.");
  }
  if (hasAny(haystack, ["bench", "bancă", "banca", "benchid", "backrest"])) {
    return field("bench", 0.94, "Bench vocabulary found in source fields.");
  }
  if (hasAny(haystack, ["waste_basket", "trash", "coș", "cos gunoi", "garbage", "bin"])) {
    return field("trash_bin", 0.94, "Waste basket or trash-bin vocabulary found.");
  }
  if (
    hasAny(haystack, ["street light", "streetlight", "street_lamp", "lamp", "stâlp", "stalp"])
  ) {
    return field("streetlight", 0.93, "Street-light vocabulary found.");
  }
  if (hasAny(haystack, ["crossing", "trecere"])) {
    return field("crossing", 0.78, "Crossing vocabulary found.");
  }
  if (hasAny(haystack, ["pothole", "groapă", "groapa"])) {
    return field("pothole", 0.78, "Pothole vocabulary found.");
  }
  if (shape.includes("311")) {
    return field("streetlight", 0.72, "311 shape suggests a streetlight service request.");
  }
  return field("other", 0.3, "No known civic asset vocabulary matched.");
}

function inferCondition(
  record: Record<string, unknown>,
  shape: string
): FieldInference<Condition> {
  const explicit = firstString(record, ["condition", "stare", "status"]);
  if (conditionSchema.safeParse(explicit).success) {
    return field(explicit as Condition, 0.99, "Condition matched the app schema.");
  }

  const haystack = searchable(record);
  if (hasAny(haystack, ["unsafe", "pericol", "danger", "exposed wire"])) {
    return field("unsafe", 0.88, "Unsafe/danger vocabulary found.");
  }
  if (
    hasAny(haystack, [
      "all/out",
      "1/out",
      "dim",
      "broken",
      "rupt",
      "ruptă",
      "lipsă",
      "lipsa",
      "missing",
      "outage",
      "not working",
      "plin"
    ])
  ) {
    return field("needs_repair", 0.86, "Repair/outage vocabulary found.");
  }
  if (hasAny(haystack, ["closed", "complete", "resolved", "good", "ok"])) {
    return field("good", 0.68, "Closed/good status vocabulary found.");
  }
  if (shape.includes("osm")) {
    return field("watch", 0.48, "OSM assets describe existence, not current condition.");
  }
  return field("watch", 0.42, "No condition vocabulary was found; marked for review.");
}

function inferLocation(
  record: Record<string, unknown>
): FieldInference<AuditLocation | undefined> {
  const lat = numberField(record, ["lat", "latitude", "@lat", "::lat"]);
  const lng = numberField(record, ["lng", "lon", "longitude", "@lon", "::lon"]);

  if (lat !== undefined && lng !== undefined) {
    return field({ lat, lng }, 0.98, "Latitude and longitude fields were found.");
  }

  const location = valueFor(record, "location");
  if (typeof location === "object" && location !== null) {
    const nested = location as Record<string, unknown>;
    const nestedLat = numberField(nested, ["latitude", "lat"]);
    const nestedLng = numberField(nested, ["longitude", "lng", "lon"]);
    if (nestedLat !== undefined && nestedLng !== undefined) {
      return field(
        { lat: nestedLat, lng: nestedLng },
        0.96,
        "Nested location coordinates were found."
      );
    }
  }

  const geometry = valueFor(record, "the_geom");
  const geo =
    typeof geometry === "string" ? safeJson<Record<string, unknown>>(geometry) : geometry;
  if (
    typeof geo === "object" &&
    geo !== null &&
    Array.isArray((geo as { coordinates?: unknown }).coordinates)
  ) {
    const [lon, latitude] = (geo as { coordinates: unknown[] }).coordinates;
    const parsedLon = parseNumber(lon);
    const parsedLat = parseNumber(latitude);
    if (parsedLat !== undefined && parsedLon !== undefined) {
      return field(
        { lat: parsedLat, lng: parsedLon },
        0.93,
        "GeoJSON point coordinates were found."
      );
    }
  }

  const coordinateMatch = searchable(record).match(
    /(-?\d{1,2}(?:[.,]\d+))\s*[,; ]\s*(-?\d{1,3}(?:[.,]\d+))/
  );
  if (coordinateMatch) {
    const parsedLat = parseNumber(coordinateMatch[1]);
    const parsedLng = parseNumber(coordinateMatch[2]);
    if (parsedLat !== undefined && parsedLng !== undefined) {
      return field(
        { lat: parsedLat, lng: parsedLng },
        0.78,
        "Coordinates were found inside text."
      );
    }
  }

  return field(undefined, 0, "No supported coordinate fields were found.");
}

function inferAssetTag(
  record: Record<string, unknown>,
  shape: string,
  sourceId: string | undefined,
  location: AuditLocation | undefined
): FieldInference<string> {
  const rawTag = firstString(record, [
    "assettag",
    "asset_tag",
    "tag",
    "id_tag",
    "sticker",
    "eticheta"
  ]);
  if (rawTag) {
    const normalized = normalizeAssetTag(rawTag);
    if (normalized) {
      return field(normalized, 0.98, "Sticker/tag field was found.");
    }
  }

  if (sourceId) {
    return field(
      normalizeAssetTag(sourceId),
      0.88,
      "Stable source identifier was used as asset tag."
    );
  }

  const suffix = location
    ? `${location.lat.toFixed(5)}-${location.lng.toFixed(5)}`
    : stableUuid(searchable(record)).slice(0, 8);
  return field(
    `IMPORT-${normalizeAssetTag(shape)}-${normalizeAssetTag(suffix)}`,
    0.45,
    "Generated from source shape and location."
  );
}

function inferSourceId(record: Record<string, unknown>, shape: string): string | undefined {
  const osmType = firstString(record, ["type", "@type", "::type"]);
  const osmId = firstString(record, ["id", "@id", "::id"]);
  if (shape.includes("osm") && osmId) {
    return `OSM-${normalizeAssetTag(osmType || "NODE")}-${normalizeAssetTag(osmId)}`;
  }

  const benchId = firstString(record, ["benchid", "bench_id"]);
  if (benchId) {
    return `NYC-BENCH-${stripDecimal(benchId)}`;
  }

  const chicago = firstString(record, ["service_request_number"]);
  if (chicago) {
    return `CHI-311-${normalizeAssetTag(chicago)}`;
  }

  const nyc = firstString(record, ["unique_key"]);
  if (nyc) {
    return `NYC-311-${normalizeAssetTag(nyc)}`;
  }

  return firstString(record, ["asset_id", "assetid", "source_id", "id"]);
}

function inferDate(record: Record<string, unknown>): string {
  const raw = firstString(record, [
    "createdat",
    "created_at",
    "created_date",
    "creation_date",
    "installati",
    "updatedat",
    "updated_at"
  ]);
  if (!raw) {
    return EPOCH;
  }

  const date = new Date(raw);
  return Number.isNaN(date.getTime()) ? EPOCH : date.toISOString();
}

function buildNotes(record: Record<string, unknown>): string {
  const keys = [
    "notes",
    "note",
    "observatii",
    "observații",
    "descriptor",
    "descriptor_2",
    "type_of_service_request",
    "complaint_type",
    "status",
    "address",
    "street_address",
    "incident_address",
    "resolution_description"
  ];
  const parts = keys
    .map((key) => firstString(record, [key]))
    .filter((value): value is string => Boolean(value))
    .map((value) => repairText(value).trim())
    .filter(Boolean);
  return [...new Set(parts)].join(" | ").slice(0, 500);
}

function detectShape(records: Array<Record<string, unknown>>, fallback = "unknown"): string {
  const haystack = records.map(searchable).join(" ");
  if (
    hasAny(haystack, ["amenity", "street_lamp", "waste_basket", "backrest"]) ||
    fallback.includes("osm")
  ) {
    return "osm-overpass";
  }
  if (hasAny(haystack, ["service_request_number", "type_of_service_request"])) {
    return "chicago-311";
  }
  if (hasAny(haystack, ["unique_key", "complaint_type", "descriptor"])) {
    return "nyc-311";
  }
  if (hasAny(haystack, ["benchid", "benchtype", "boroname"])) {
    return "nyc-bench-inventory";
  }
  if (hasAny(haystack, ["observatii", "observații", "stare", "tip"])) {
    return "volunteer-spreadsheet";
  }
  return fallback;
}

function repairText(input: string): string {
  return input
    .replace(/^\uFEFF/, "")
    .replace(/\r\n?/g, "\n")
    .replace(/\u00A0/g, " ")
    .replaceAll("â", "'")
    .replaceAll("â", '"')
    .replaceAll("â", '"')
    .replaceAll("â", "-")
    .replaceAll("â", "-")
    .normalize("NFC");
}

function containsEncodingRepair(record: Record<string, unknown>): boolean {
  return Object.values(record).some((value) => typeof value === "string" && /â[]/.test(value));
}

function looksLikeCsv(text: string): boolean {
  const firstLine = text.split("\n").find((line) => line.trim().length > 0) ?? "";
  return [",", ";", "\t", "|"].some(
    (delimiter) => splitCsvLine(firstLine, delimiter).length > 1
  );
}

function parseCsv(text: string): string[][] {
  const delimiter = detectDelimiter(text);
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const next = text[index + 1];

    if (char === '"') {
      if (quoted && next === '"') {
        cell += '"';
        index += 1;
      } else {
        quoted = !quoted;
      }
      continue;
    }

    if (char === delimiter && !quoted) {
      row.push(cell);
      cell = "";
      continue;
    }

    if (char === "\n" && !quoted) {
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
      continue;
    }

    cell += char;
  }

  row.push(cell);
  if (row.some((value) => value.length > 0)) {
    rows.push(row);
  }

  return rows;
}

function detectDelimiter(text: string): string {
  const firstLine = text.split("\n").find((line) => line.trim().length > 0) ?? "";
  return [",", ";", "\t", "|"]
    .map((delimiter) => ({ delimiter, count: splitCsvLine(firstLine, delimiter).length }))
    .sort((a, b) => b.count - a.count)[0].delimiter;
}

function splitCsvLine(line: string, delimiter: string): string[] {
  const cells: string[] = [];
  let cell = "";
  let quoted = false;
  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    if (char === '"') {
      quoted = !quoted;
    } else if (char === delimiter && !quoted) {
      cells.push(cell);
      cell = "";
    } else {
      cell += char;
    }
  }
  cells.push(cell);
  return cells;
}

function stripTrailingCommas(text: string): string {
  return text.replace(/,\s*([}\]])/g, "$1");
}

function salvageJsonObjects(text: string): unknown[] {
  const objects: unknown[] = [];

  for (let candidateStart = 0; candidateStart < text.length; candidateStart += 1) {
    if (text[candidateStart] !== "{") {
      continue;
    }

    let depth = 0;
    let inString = false;
    let escaped = false;

    for (let index = candidateStart; index < text.length; index += 1) {
      const char = text[index];

      if (inString) {
        escaped = char === "\\" && !escaped;
        if (char === '"' && !escaped) {
          inString = false;
        }
        if (char !== "\\") {
          escaped = false;
        }
        continue;
      }

      if (char === '"') {
        inString = true;
        continue;
      }

      if (char === "{") {
        depth += 1;
        continue;
      }

      if (char === "}") {
        depth -= 1;
        if (depth === 0) {
          const candidate = text.slice(candidateStart, index + 1);
          try {
            objects.push(JSON.parse(stripTrailingCommas(candidate)));
          } catch {
            // Ignore partial nested objects; the caller emits the partial_json issue.
          }
          break;
        }
      }
    }
  }

  const seen = new Set<string>();
  return objects.filter((object) => {
    const record = toRecord(object);
    if ("reports" in record) {
      return false;
    }
    const key = JSON.stringify(record);
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return "assetTag" in record || "schemaVersion" in record || Object.keys(record).length > 2;
  });
}

function flattenOsmElement(record: Record<string, unknown>): Record<string, unknown> {
  const tags = toRecord(record.tags);
  return { ...record, ...tags };
}

function toRecord(value: unknown): Record<string, unknown> {
  return typeof value === "object" && value !== null ? (value as Record<string, unknown>) : {};
}

function normalizeHeader(value: string): string {
  return repairText(value)
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_")
    .replace(/[^\p{L}\p{N}_@:.]/gu, "");
}

function searchable(record: Record<string, unknown>): string {
  return Object.entries(record)
    .flatMap(([key, value]) => [key, stringify(value)])
    .join(" ")
    .toLowerCase();
}

function stringify(value: unknown): string {
  if (value === null || value === undefined) {
    return "";
  }
  if (typeof value === "object") {
    return JSON.stringify(value);
  }
  if (typeof value === "string") {
    return value;
  }
  if (typeof value === "number" || typeof value === "boolean" || typeof value === "bigint") {
    return value.toString();
  }
  return "";
}

function hasAny(value: string, needles: string[]): boolean {
  return needles.some((needle) => value.includes(needle.toLowerCase()));
}

function firstString(record: Record<string, unknown>, keys: string[]): string | undefined {
  for (const key of keys) {
    const value = valueFor(record, key);
    const text = stringify(value).trim();
    if (text.length > 0) {
      return repairText(text);
    }
  }
  return undefined;
}

function valueFor(record: Record<string, unknown>, key: string): unknown {
  const normalized = normalizeHeader(key);
  const match = Object.keys(record).find(
    (candidate) => normalizeHeader(candidate) === normalized
  );
  return match ? record[match] : undefined;
}

function numberField(record: Record<string, unknown>, keys: string[]): number | undefined {
  for (const key of keys) {
    const parsed = parseNumber(valueFor(record, key));
    if (parsed !== undefined) {
      return parsed;
    }
  }
  return undefined;
}

function parseNumber(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value !== "string") {
    return undefined;
  }
  const normalized = value.trim().replace(",", ".");
  if (!/^-?\d+(\.\d+)?$/.test(normalized)) {
    return undefined;
  }
  const number = Number(normalized);
  return Number.isFinite(number) ? number : undefined;
}

function stripDecimal(value: string): string {
  return normalizeAssetTag(value.replace(/\.0+$/, ""));
}

function field<T>(value: T, score: number, reason: string): FieldInference<T> {
  return { value, confidence: { score, reason } };
}

function highConfidence(reason: string): ReportConfidence {
  const inference = { score: 0.99, reason };
  return {
    overall: 0.99,
    assetTag: inference,
    assetKind: inference,
    condition: inference,
    location: inference
  };
}

function combineConfidence(
  assetTag: Inference,
  assetKind: Inference,
  condition: Inference,
  location: Inference
): ReportConfidence {
  const weighted =
    assetTag.score * 0.2 +
    assetKind.score * 0.25 +
    condition.score * 0.3 +
    (location.score || 0.25) * 0.25;
  return {
    overall: Number(weighted.toFixed(3)),
    assetTag,
    assetKind,
    condition,
    location
  };
}

function provenance(
  raw: RawRecord,
  input: {
    sourceType: string;
    sourceId?: string;
    sourceLabel?: string;
    warnings?: string[];
    suggestions?: string[];
  }
): ReportProvenance {
  return {
    sourceType: input.sourceType,
    sourceId: input.sourceId,
    sourceLabel: input.sourceLabel,
    rowNumber: raw.rowNumber,
    shape: raw.shape,
    fingerprint: stableUuid(JSON.stringify(raw.record)),
    warnings: input.warnings ?? [],
    suggestions: input.suggestions ?? []
  };
}

function hasDuplicateStatus(record: Record<string, unknown>): boolean {
  return searchable(record).includes("dup");
}

function hasStaleCheckDate(record: Record<string, unknown>): boolean {
  const raw = firstString(record, ["check_date", "checkdate"]);
  if (!raw) {
    return false;
  }
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) {
    return false;
  }
  return Date.now() - date.getTime() > 1000 * 60 * 60 * 24 * 365 * 2;
}

function hasSpreadsheetFormulaText(record: Record<string, unknown>): boolean {
  return Object.values(record).some(
    (value) => typeof value === "string" && /^[=+\-@]/.test(value.trim())
  );
}

function safeJson<T>(value: string): T | undefined {
  try {
    return JSON.parse(value) as T;
  } catch {
    return undefined;
  }
}

function stableUuid(input: string): string {
  const hex = stableHex(input, 32).split("");
  hex[12] = "5";
  hex[16] = ((Number.parseInt(hex[16], 16) & 0x3) | 0x8).toString(16);
  const value = hex.join("");
  return `${value.slice(0, 8)}-${value.slice(8, 12)}-${value.slice(12, 16)}-${value.slice(16, 20)}-${value.slice(20, 32)}`;
}

function stableHex(input: string, length: number): string {
  let hash = 0x811c9dc5;
  let output = "";
  let salt = 0;

  while (output.length < length) {
    const source = `${salt}:${input}`;
    hash = 0x811c9dc5;
    for (let index = 0; index < source.length; index += 1) {
      hash ^= source.charCodeAt(index);
      hash = Math.imul(hash, 0x01000193);
    }
    output += (hash >>> 0).toString(16).padStart(8, "0");
    salt += 1;
  }

  return output.slice(0, length);
}

function rememberAnalysis(cacheKey: string, analysis: ImportAnalysis): void {
  if (analysisCache.size > 10) {
    const oldest = analysisCache.keys().next().value;
    if (oldest) {
      analysisCache.delete(oldest);
    }
  }
  analysisCache.set(cacheKey, cloneAnalysis(analysis));
}

function cloneAnalysis(analysis: ImportAnalysis): ImportAnalysis {
  return JSON.parse(JSON.stringify(analysis)) as ImportAnalysis;
}

function dedupeReports(reports: AuditReport[], issues: ImportIssue[]): AuditReport[] {
  const byTag = new Map<string, AuditReport>();
  for (const report of reports) {
    const existing = byTag.get(report.assetTag);
    if (!existing || (report.confidence?.overall ?? 0) > (existing.confidence?.overall ?? 0)) {
      byTag.set(report.assetTag, report);
    } else {
      issues.push(
        issue(
          "info",
          "duplicate_asset_tag",
          "A duplicate asset tag was skipped.",
          `${report.assetTag} appeared more than once in the import.`,
          "The highest-confidence row was kept.",
          report.provenance?.rowNumber
        )
      );
    }
  }
  return [...byTag.values()];
}

function canonicalReports(reports: AuditReport[]): AuditReport[] {
  return [...reports].sort((a, b) => {
    const tag = a.assetTag.localeCompare(b.assetTag);
    return tag === 0 ? a.id.localeCompare(b.id) : tag;
  });
}

function canonicalIssues(issues: ImportIssue[]): ImportIssue[] {
  return [...issues].sort((a, b) => {
    const row = (a.rowNumber ?? 0) - (b.rowNumber ?? 0);
    return row === 0 ? a.code.localeCompare(b.code) : row;
  });
}

function emptyStats(started: number, inputBytes: number): ImportAnalysis["stats"] {
  return {
    inputFormat: "empty",
    shape: "empty",
    totalRows: 0,
    acceptedRows: 0,
    durationMs: Math.round(performance.now() - started),
    inputBytes,
    appVersion: buildInfo.version
  };
}

function issue(
  severity: ImportIssueSeverity,
  code: string,
  what: string,
  why: string,
  nowWhat: string,
  rowNumber?: number
): ImportIssue {
  return { severity, code, what, why, nowWhat, rowNumber };
}

async function yieldToBrowser(): Promise<void> {
  await new Promise((resolve) => window.setTimeout(resolve, 0));
}
