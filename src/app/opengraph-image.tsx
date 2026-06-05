import { ImageResponse } from "next/og";

export const dynamic = "force-static";
export const alt =
  "中国股市编年史 — A long-form chronicle of China's stock market";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const BG = "#F5F0E8";
const INK = "#1A1A1A";
const MUTED = "#6B6B6B";
const RED = "#C41E3A";
const GREEN = "#2D6A4F";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          background: BG,
          display: "flex",
          flexDirection: "column",
          padding: "72px 96px",
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
            fontSize: 22,
            letterSpacing: 4,
            textTransform: "uppercase",
            color: MUTED,
            marginBottom: 32,
          }}
        >
          <span style={{ color: RED, marginRight: 16 }}>§</span>
          History of China Market
        </div>

        <div
          style={{
            display: "flex",
            fontSize: 92,
            fontWeight: 700,
            lineHeight: 1.05,
            letterSpacing: -1,
            marginBottom: 28,
          }}
        >
          A Chronicle of China&apos;s
        </div>
        <div
          style={{
            display: "flex",
            fontSize: 92,
            fontWeight: 700,
            lineHeight: 1.05,
            letterSpacing: -1,
            marginBottom: 56,
          }}
        >
          Stock Market
        </div>

        <div
          style={{
            display: "flex",
            fontSize: 32,
            color: MUTED,
            lineHeight: 1.4,
            maxWidth: 980,
          }}
        >
          Annual returns · Drawdowns · Valuation history · Structural shifts
          across Shanghai, Shenzhen, and Hong Kong.
        </div>

        <div
          style={{
            marginTop: "auto",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-end",
            fontSize: 24,
          }}
        >
          <div style={{ display: "flex", alignItems: "center" }}>
            <div
              style={{
                width: 14,
                height: 14,
                background: RED,
                marginRight: 12,
              }}
            />
            <span style={{ color: MUTED, marginRight: 28 }}>Up</span>
            <div
              style={{
                width: 14,
                height: 14,
                background: GREEN,
                marginRight: 12,
              }}
            />
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
