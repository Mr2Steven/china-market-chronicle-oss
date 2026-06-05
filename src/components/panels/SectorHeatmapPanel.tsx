"use client";

import { useMemo, useState } from "react";
import { useChartData } from "@/hooks/useChartData";

type PeriodKey = "ret_5d" | "ret_1m" | "ret_3m" | "ret_ytd";

interface SectorItem {
  code: string;
  name: string;
  ret_5d: number | null;
  ret_1m: number | null;
  ret_3m: number | null;
  ret_ytd: number | null;
}

interface SectorHeatmapData {
  updated: string;
  sectors: SectorItem[];
}

const PERIODS: Array<{ key: PeriodKey; label: string }> = [
  { key: "ret_5d", label: "近1周" },
  { key: "ret_1m", label: "近1月" },
  { key: "ret_3m", label: "近3月" },
  { key: "ret_ytd", label: "今年以来" },
];

const RED = [196, 30, 58];
const GREEN = [26, 122, 74];
const NEUTRAL = [246, 247, 248];

function pct(value: number | null | undefined): string {
  if (typeof value !== "number" || Number.isNaN(value)) return "—";
  return `${value >= 0 ? "+" : ""}${(value * 100).toFixed(1)}%`;
}

function mix(a: number[], b: number[], t: number): string {
  const clamped = Math.max(0, Math.min(1, t));
  const rgb = a.map((value, index) => Math.round(value + (b[index] - value) * clamped));
  return `rgb(${rgb[0]}, ${rgb[1]}, ${rgb[2]})`;
}

function colorFor(value: number | null, maxUp: number, maxDown: number): string {
  if (typeof value !== "number" || Number.isNaN(value)) return "rgb(246, 247, 248)";
  if (value > 0) return mix(NEUTRAL, RED, maxUp === 0 ? 0 : value / maxUp);
  if (value < 0) return mix(NEUTRAL, GREEN, maxDown === 0 ? 0 : Math.abs(value) / maxDown);
  return "rgb(246, 247, 248)";
}

function textColor(value: number | null, maxAbs: number): string {
  if (typeof value !== "number" || Number.isNaN(value) || maxAbs === 0) return "var(--text-heading)";
  return Math.abs(value) / maxAbs > 0.62 ? "#fff" : "var(--text-heading)";
}

export default function SectorHeatmapPanel() {
  const { data, loading, error } = useChartData<SectorHeatmapData>("sector_heatmap", "data.json");
  const [period, setPeriod] = useState<PeriodKey>("ret_1m");
  const [selectedCode, setSelectedCode] = useState<string | null>(null);

  const prepared = useMemo(() => {
    if (!data || !data.sectors.length) return null;
    const values = data.sectors
      .map((sector) => sector[period])
      .filter((value): value is number => typeof value === "number" && !Number.isNaN(value));
    const maxUp = Math.max(0, ...values.filter((value) => value > 0));
    const maxDown = Math.max(0, ...values.filter((value) => value < 0).map(Math.abs));
    const maxAbs = Math.max(maxUp, maxDown);
    const selected = data.sectors.find((sector) => sector.code === selectedCode) ?? null;
    return { maxUp, maxDown, maxAbs, selected };
  }, [data, period, selectedCode]);

  if (loading) return <Placeholder h={430} msg="加载中…" />;
  if (error || !data || !prepared) return <Placeholder h={430} msg={`加载失败：${error}`} />;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <style jsx>{`
        .sector-heatmap-grid {
          display: grid;
          grid-template-columns: repeat(6, minmax(96px, 1fr));
          gap: 8px;
          overflow-x: auto;
        }

        @media (max-width: 720px) {
          .sector-heatmap-grid {
            grid-template-columns: repeat(3, minmax(0, 1fr));
            overflow-x: visible;
          }

          .sector-heatmap-cell {
            min-height: 70px !important;
            padding: 9px 7px !important;
          }
        }
      `}</style>

      <div style={{ display: "flex", gap: 0, flexWrap: "wrap", alignItems: "center" }}>
        {PERIODS.map((item, index) => (
          <button
            key={item.key}
            type="button"
            onClick={() => setPeriod(item.key)}
            style={{
              padding: "7px 12px",
              border: "1px solid var(--border)",
              borderLeft: index === 0 ? "1px solid var(--border)" : 0,
              borderRadius: index === 0 ? "6px 0 0 6px" : index === PERIODS.length - 1 ? "0 6px 6px 0" : 0,
              background: period === item.key ? "var(--bg-subtle)" : "transparent",
              color: period === item.key ? "var(--text-heading)" : "var(--text-muted)",
              fontFamily: "var(--font-mono)",
              fontSize: 12,
              cursor: "pointer",
            }}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="sector-heatmap-grid">
        {data.sectors.map((sector) => {
          const value = sector[period];
          const selected = selectedCode === sector.code;
          const color = colorFor(value, prepared.maxUp, prepared.maxDown);
          const fg = textColor(value, prepared.maxAbs);
          return (
            <button
              key={sector.code}
              className="sector-heatmap-cell"
              type="button"
              onClick={() => setSelectedCode(selected ? null : sector.code)}
              title={`${sector.name} ${pct(value)}`}
              style={{
                minHeight: 78,
                padding: "10px 8px",
                border: selected ? "2px solid var(--text-heading)" : "1px solid rgba(0,0,0,0.08)",
                borderRadius: 6,
                background: color,
                color: fg,
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                alignItems: "flex-start",
                textAlign: "left",
                cursor: "pointer",
                boxShadow: selected ? "0 0 0 2px rgba(0,0,0,0.06)" : "none",
              }}
            >
              <span style={{ fontSize: 12, lineHeight: 1.25, fontWeight: 500 }}>{sector.name}</span>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: 16, fontWeight: 700 }}>{pct(value)}</span>
            </button>
          );
        })}
      </div>

      {prepared.selected && (
        <div
          style={{
            border: "1px solid var(--border)",
            borderRadius: 6,
            padding: "10px 12px",
            background: "var(--bg-subtle)",
            display: "flex",
            gap: "10px 18px",
            flexWrap: "wrap",
            alignItems: "center",
          }}
        >
          <strong style={{ fontSize: 13, color: "var(--text-heading)" }}>{prepared.selected.name}</strong>
          {PERIODS.map((item) => (
            <span key={item.key} style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--text-muted)" }}>
              {item.label}: <b style={{ color: (prepared.selected?.[item.key] ?? 0) >= 0 ? "#C41E3A" : "#1A7A4A" }}>{pct(prepared.selected?.[item.key])}</b>
            </span>
          ))}
        </div>
      )}

      <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--text-muted)", lineHeight: 1.6 }}>
        红色越深涨幅越大，绿色越深跌幅越大，灰色接近平盘；颜色按当前所选时间维度的行业涨跌幅相对映射。数据截至 {data.updated}。
      </div>
    </div>
  );
}

function Placeholder({ h, msg }: { h: number; msg: string }) {
  return <div style={{ height: h, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-muted)", fontFamily: "var(--font-mono)", fontSize: 13 }}>{msg}</div>;
}
