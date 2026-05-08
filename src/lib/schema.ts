import { z } from "zod";

export const assetKindSchema = z.enum([
  "streetlight",
  "bench",
  "trash_bin",
  "bus_stop",
  "crossing",
  "pothole",
  "sign",
  "tree",
  "other"
]);

export const conditionSchema = z.enum(["good", "watch", "needs_repair", "unsafe", "missing"]);

export const locationSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  accuracy: z.number().nonnegative().optional()
});

export const auditReportSchema = z.object({
  schemaVersion: z.literal(1),
  id: z.string().uuid(),
  assetTag: z.string().min(3).max(80),
  tagFamily: z.string().default("tag36h11"),
  tagId: z.number().int().nonnegative().optional(),
  assetKind: assetKindSchema,
  condition: conditionSchema,
  location: locationSchema.optional(),
  notes: z.string().max(500).default(""),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  source: z.enum(["local", "peer", "import"]).default("local")
});

export const peerEnvelopeSchema = z.object({
  type: z.literal("caw.sync.v1"),
  sentAt: z.string().datetime(),
  reports: z.array(auditReportSchema)
});

export type AssetKind = z.infer<typeof assetKindSchema>;
export type Condition = z.infer<typeof conditionSchema>;
export type AuditLocation = z.infer<typeof locationSchema>;
export type AuditReport = z.infer<typeof auditReportSchema>;
export type PeerEnvelope = z.infer<typeof peerEnvelopeSchema>;

export const assetKinds = assetKindSchema.options;
export const conditions = conditionSchema.options;

export function normalizeAssetTag(value: string): string {
  return value
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^A-Za-z0-9:_-]/g, "")
    .toUpperCase();
}

export function tagFromAprilTagId(tagId: number): string {
  return `CAW-36H11-${tagId.toString().padStart(6, "0")}`;
}
