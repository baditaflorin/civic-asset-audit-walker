import { assetKindLabels, conditionLabels, conditionWeights } from "../../lib/constants";
import type { AssetKind, AuditReport, Condition } from "../../lib/schema";

export type AuditAggregate = {
  assetKind: AssetKind;
  condition: Condition;
  count: number;
  riskScore: number;
  label: string;
};

export function aggregateReports(reports: AuditReport[]): AuditAggregate[] {
  const counts = new Map<string, AuditAggregate>();

  for (const report of reports) {
    const key = `${report.assetKind}:${report.condition}`;
    const current = counts.get(key);
    if (current) {
      current.count += 1;
      current.riskScore = current.count * conditionWeights[current.condition];
    } else {
      counts.set(key, {
        assetKind: report.assetKind,
        condition: report.condition,
        count: 1,
        riskScore: conditionWeights[report.condition],
        label: `${assetKindLabels[report.assetKind]} · ${conditionLabels[report.condition]}`
      });
    }
  }

  return [...counts.values()].sort((a, b) => b.riskScore - a.riskScore || b.count - a.count);
}

export function reportsNeedingAction(reports: AuditReport[]): number {
  return reports.filter((report) =>
    ["watch", "needs_repair", "unsafe", "missing"].includes(report.condition)
  ).length;
}
