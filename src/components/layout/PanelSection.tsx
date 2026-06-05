import { ReactNode } from "react";
import DataTrustBlock from "@/components/layout/DataTrustBlock";
import type { PanelDef } from "@/lib/panelRegistry";

interface PanelSectionProps {
  id: string;
  panelId: PanelDef["id"];
  titleCn: string;
  titleEn: string;
  source?: string;
  children: ReactNode;
}

export default function PanelSection({
  id,
  panelId,
  titleCn,
  titleEn,
  source,
  children,
}: PanelSectionProps) {
  return (
    <section
      id={id}
      className="panel-section"
    >
      <div className="panel-section__header">
        <h2 className="panel-section__title">
          {titleCn}
        </h2>
        <p className="panel-section__subtitle">
          {titleEn}
        </p>
      </div>

      <div className="panel-section__body">{children}</div>

      {source && (
        <p className="panel-section__source">
          数据源：{source}
        </p>
      )}

      <DataTrustBlock panelId={panelId} />
    </section>
  );
}
