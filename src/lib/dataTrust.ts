import manifest from "../../public/api/_manifest.json";
import type { PanelDef } from "@/lib/panelRegistry";

export type DataFreshnessLevel = "ok" | "warning" | "danger";

export function getUpdateFrequencyLabel(frequency: PanelDef["updateFrequency"]): string {
  const labels: Record<PanelDef["updateFrequency"], string> = {
    daily: "每日更新",
    weekly: "每周更新",
    monthly: "每月更新",
    yearly: "每年更新",
    static: "静态资料",
  };
  return labels[frequency];
}

export function normalizeLastUpdated(value?: string): string | undefined {
  if (!value) return undefined;

  const dateOnly = value.match(/^\d{4}-\d{2}-\d{2}/)?.[0];
  if (dateOnly) return dateOnly;

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("zh-CN", {
    timeZone: "Asia/Shanghai",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour12: false,
  }).format(date).replace(/\//g, "-");
}

export function getDataFreshnessLevel(lastUpdated?: string): DataFreshnessLevel {
  const normalized = normalizeLastUpdated(lastUpdated);
  if (!normalized) return "warning";

  const timestamp = Date.parse(`${normalized}T00:00:00+08:00`);
  if (Number.isNaN(timestamp)) return "warning";

  const now = Date.now();
  const ageDays = Math.floor((now - timestamp) / (24 * 60 * 60 * 1000));
  if (ageDays > 7) return "danger";
  if (ageDays > 3) return "warning";
  return "ok";
}

export function getManifestLastUpdated(): string | undefined {
  return normalizeLastUpdated(manifest.last_updated);
}
