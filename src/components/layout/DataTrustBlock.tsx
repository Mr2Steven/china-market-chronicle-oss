import { getManifestLastUpdated } from "@/lib/dataTrust";
import { getPanelById, type PanelDef } from "@/lib/panelRegistry";
import DataCredibility from "@/components/ui/DataCredibility";

interface DataTrustBlockProps {
  panel?: PanelDef;
  panelId?: string;
  variant?: "panel" | "seo";
}

export default function DataTrustBlock({
  panel,
  panelId,
  variant = "panel",
}: DataTrustBlockProps) {
  const resolvedPanel = panel ?? (panelId ? getPanelById(panelId) : undefined);
  if (!resolvedPanel) return null;

  return (
    <aside className={`data-trust data-trust--${variant}`} aria-label="数据可信度">
      <DataCredibility
        dataSource={resolvedPanel.dataSources.join(" · ")}
        updateFrequency={resolvedPanel.updateFrequency}
        lastUpdated={getManifestLastUpdated()}
      />
      <dl className="data-trust__facts">
        <div className="data-trust__item data-trust__item--processing">
          <dt>处理说明</dt>
          <dd>{resolvedPanel.dataProcessing}</dd>
        </div>
      </dl>
    </aside>
  );
}
