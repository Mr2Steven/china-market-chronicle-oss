import { ImageResponse } from "next/og";
import {
  getPanelByRoute,
  getPanelParams,
  getSectionById,
} from "@/lib/panelSeo";

export const dynamic = "force-static";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const BG = "#F5F0E8";
const INK = "#1A1A1A";
const MUTED = "#6B6B6B";
const RED = "#C41E3A";
const GREEN = "#2D6A4F";

type ImageProps = {
  params: Promise<{
    section: string;
    panel: string;
  }>;
};

export function generateStaticParams() {
  return getPanelParams();
}

export const alt = "中国股市编年史面板图 — China Market Chronicle panel image";

export default async function Image({ params }: ImageProps) {
  const { section, panel: panelSlug } = await params;
  const panel = getPanelByRoute(section, panelSlug);
  const sectionDef = panel ? getSectionById(panel.section) : undefined;
  const description = panel
    ? `Chart type: ${panel.chartType}. Update frequency: ${panel.updateFrequency}. API: ${panel.apiEndpoint}`
    : "A long-form chronicle of China's stock market.";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          background: BG,
          display: "flex",
          flexDirection: "column",
          padding: "68px 88px",
          fontFamily: "Georgia, 'Times New Roman', serif",
          color: INK,
          position: "relative",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 8,
            background: RED,
          }}
        />

        <div
          style={{
            display: "flex",
            alignItems: "center",
            fontSize: 24,
            letterSpacing: 3,
            textTransform: "uppercase",
            color: MUTED,
            marginBottom: 38,
          }}
        >
          <span style={{ color: RED, marginRight: 16 }}>§</span>
          {sectionDef ? `${sectionDef.index} · ${sectionDef.titleEn}` : "China Market Chronicle"}
        </div>

        <div
          style={{
            display: "flex",
            fontSize: 78,
            fontWeight: 700,
            lineHeight: 1.08,
            marginBottom: 26,
            maxWidth: 980,
          }}
        >
          {panel?.titleEn ?? "China Market Chronicle"}
        </div>

        <div
          style={{
            display: "flex",
            fontSize: 30,
            color: MUTED,
            lineHeight: 1.36,
            maxWidth: 980,
          }}
        >
          {description}
        </div>

        <div
          style={{
            marginTop: "auto",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-end",
            fontSize: 22,
          }}
        >
          <div style={{ display: "flex", alignItems: "center" }}>
            <div style={{ width: 14, height: 14, background: RED, marginRight: 12 }} />
            <span style={{ color: MUTED, marginRight: 28 }}>Up</span>
            <div style={{ width: 14, height: 14, background: GREEN, marginRight: 12 }} />
            <span style={{ color: MUTED }}>Down</span>
          </div>
          <div style={{ color: MUTED, fontFamily: "monospace" }}>
            china-market-chronicle.vercel.app
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
