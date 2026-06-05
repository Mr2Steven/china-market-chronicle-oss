import {
  getDataFreshnessLevel,
  getUpdateFrequencyLabel,
  normalizeLastUpdated,
} from "@/lib/dataTrust";
import type { PanelDef } from "@/lib/panelRegistry";

interface DataCredibilityProps {
  dataSource: string;
  updateFrequency: PanelDef["updateFrequency"];
  lastUpdated?: string;
}

export default function DataCredibility({
  dataSource,
  updateFrequency,
  lastUpdated,
}: DataCredibilityProps) {
  const normalizedLastUpdated = normalizeLastUpdated(lastUpdated);
  const freshness = getDataFreshnessLevel(normalizedLastUpdated);
  const warningLabel = freshness === "ok" ? "" : "⚠ ";

  return (
    <div className="data-credibility" aria-label="数据可信度">
      <span className="data-credibility__item">数据来源: {dataSource}</span>
      <span className="data-credibility__item">更新频率: {getUpdateFrequencyLabel(updateFrequency)}</span>
      <span className={`data-credibility__item data-credibility__item--${freshness}`}>
        最后更新: {warningLabel}{normalizedLastUpdated ?? "未记录"}
      </span>
    </div>
  );
}
