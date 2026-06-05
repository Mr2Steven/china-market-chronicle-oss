"use client";

import { useMemo, useState } from "react";
import { useChartData } from "@/hooks/useChartData";
import { computeAnnualizedMatrix } from "@/lib/compute";
import type { DailyPoint } from "@/types/data";

interface Props { indexSlug: string }

const FONT = "'JetBrains Mono', 'Fira Code', monospace";
const CW = 38; // cell width px
const CH = 22; // cell height px

function cellColors(v: number): { bg: string; fg: string } {
  if (v > 15)  return { bg: "#9B1B30", fg: "#fff" };
  if (v > 10)  return { bg: "#C84B5A", fg: "#fff" };
  if (v > 5)   return { bg: "#E8A0A0", fg: "#444" };
  if (v > 0)   return { bg: "#F5D5D5", fg: "#555" };
  if (v > -5)  return { bg: "#D5E8D5", fg: "#555" };
  if (v > -10) return { bg: "#A0C8A0", fg: "#444" };
  if (v > -20) return { bg: "#5A9B5A", fg: "#fff" };
  return             { bg: "#2D6A4F", fg: "#fff" };
}

export default function AnnualizedMatrixChart({ indexSlug }: Props) {
  const { data, loading, error } = useChartData<DailyPoint[]>(indexSlug, "daily.json");
  const [hover,   setHover]   = useState<{ ri: number; ci: number } | null>(null);
  const [tooltip, setTooltip] = useState<{ by: number; sy: number; v: number; x: number; y: number } | null>(null);

  const { cagrMap, buyYears, sellYears } = useMemo(() => {
    if (!data) return { cagrMap: new Map<string, number>(), buyYears: [] as number[], sellYears: [] as number[] };
    const raw = computeAnnualizedMatrix(data);
    if (raw.length === 0) return { cagrMap: new Map(), buyYears: [], sellYears: [] };

    const cagrMap = new Map<string, number>();
    let minY = Infinity, maxY = -Infinity;
    for (const r of raw) {
      cagrMap.set(`${r.buyYear}-${r.sellYear}`, r.cagr);
      if (r.buyYear  < minY) minY = r.buyYear;
      if (r.sellYear > maxY) maxY = r.sellYear;
    }
    const buyYears: number[]  = [];
    const sellYears: number[] = [];
    for (let y = minY; y <  maxY; y++) buyYears.push(y);
    for (let y = minY + 1; y <= maxY; y++) sellYears.push(y);
    return { cagrMap, buyYears, sellYears };
  }, [data]);

  if (loading) return <Msg>计算中（约350KB日线数据）…</Msg>;
  if (error || !data) return <Msg>加载失败：{error}</Msg>;
  if (cagrMap.size === 0) return <Msg>数据不足，无法计算矩阵</Msg>;

  const hri = hover?.ri ?? -1;
  const hci = hover?.ci ?? -1;

  const LEGEND = [
    { bg: "#9B1B30", label: "> 15%" },
    { bg: "#C84B5A", label: "10–15" },
    { bg: "#E8A0A0", label: "5–10"  },
    { bg: "#F5D5D5", label: "0–5"   },
    { bg: "#D5E8D5", label: "0 ~ −5"  },
    { bg: "#A0C8A0", label: "−5 ~ −10" },
    { bg: "#5A9B5A", label: "−10 ~ −20" },
    { bg: "#2D6A4F", label: "< −20%" },
  ];

  return (
    <div>
      {/* Legend chips */}
      <div style={{ display: "flex", gap: 10, marginBottom: 10, flexWrap: "wrap" }}>
        {LEGEND.map(({ bg, label }) => (
          <span key={label} style={{ display: "flex", alignItems: "center", gap: 4, fontFamily: FONT, fontSize: 10, color: "#888" }}>
            <span style={{ display: "inline-block", width: 11, height: 11, background: bg, borderRadius: 2, flexShrink: 0 }} />
            {label}%
          </span>
        ))}
      </div>

      {/* Table */}
      <div style={{ overflowX: "auto" }} onMouseLeave={() => { setHover(null); setTooltip(null); }}>
        <table style={{ borderCollapse: "collapse", tableLayout: "fixed", userSelect: "none" }}>
          <colgroup>
            <col style={{ width: 36 }} />
            {sellYears.map(sy => <col key={sy} style={{ width: CW }} />)}
          </colgroup>

          {/* Column headers = sell years */}
          <thead>
            <tr>
              <td style={{ position: "sticky", left: 0, zIndex: 3, background: "var(--bg-panel)" }} /> {/* corner */}
              {sellYears.map((sy, ci) => (
                <th key={sy} style={{
                  height: 18,
                  fontFamily: FONT,
                  fontSize: 9,
                  fontWeight: 400,
                  color: ci === hci ? "#C41E3A" : "#aaa",
                  textAlign: "center",
                  padding: 0,
                  border: "none",
                  verticalAlign: "bottom",
                  lineHeight: "18px",
                }}>
                  {sy}
                </th>
              ))}
            </tr>
          </thead>

          {/* Rows = buy years */}
          <tbody>
            {buyYears.map((by, ri) => (
              <tr key={by}>
                {/* Row label = buy year */}
                <td style={{
                  position: "sticky",
                  left: 0,
                  zIndex: 2,
                  background: "var(--bg-panel)",
                  fontFamily: FONT,
                  fontSize: 9,
                  fontWeight: 400,
                  color: ri === hri ? "#C41E3A" : "#aaa",
                  textAlign: "right",
                  paddingRight: 4,
                  height: CH,
                  border: "none",
                  borderRight: "1px solid #e0e0e0",
                  lineHeight: `${CH}px`,
                  whiteSpace: "nowrap",
                  verticalAlign: "middle",
                }}>
                  {by}
                </td>

                {/* Data cells */}
                {sellYears.map((sy, ci) => {
                  const v = sy > by ? (cagrMap.get(`${by}-${sy}`) ?? null) : null;

                  if (v === null) {
                    return (
                      <td key={sy} style={{
                        height: CH,
                        background: "#f2f2f2",
                        border: "1px solid #fff",
                        boxSizing: "border-box",
                      }} />
                    );
                  }

                  const { bg, fg } = cellColors(v);
                  const isThis  = ri === hri && ci === hci;
                  const inCross = ri === hri || ci === hci;

                  return (
                    <td
                      key={sy}
                      onMouseMove={(e) => {
                        setHover({ ri, ci });
                        setTooltip({ by, sy, v, x: e.clientX, y: e.clientY });
                      }}
                      style={{
                        height: CH,
                        background: bg,
                        color: fg,
                        textAlign: "center",
                        fontFamily: FONT,
                        fontSize: 11,
                        fontWeight: 400,
                        lineHeight: `${CH}px`,
                        padding: 0,
                        border: "1px solid #fff",
                        boxSizing: "border-box",
                        boxShadow: isThis  ? "inset 0 0 0 2px rgba(0,0,0,0.55)"
                                 : inCross ? "inset 0 0 0 1px rgba(0,0,0,0.18)"
                                 : "none",
                        cursor: "default",
                        overflow: "hidden",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {v.toFixed(1)}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ marginTop: 6, fontFamily: FONT, fontSize: 10, color: "#bbb" }}>
        Y轴 = 买入年份（年末入场）　X轴 = 卖出年份（年末离场）　对角线 = 持有1年
      </div>

      {/* Floating tooltip */}
      {tooltip && (
        <div style={{
          position: "fixed",
          left: tooltip.x + 14,
          top: tooltip.y + 14,
          background: "#fff",
          border: "1px solid #ddd",
          borderRadius: 4,
          padding: "6px 10px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.13)",
          pointerEvents: "none",
          zIndex: 1000,
          whiteSpace: "nowrap",
          lineHeight: 1.65,
        }}>
          <div style={{ fontFamily: "var(--font-sans)", fontSize: 13, fontWeight: 600, color: "#333", marginBottom: 2 }}>
            {tooltip.by} → {tooltip.sy}（持有 {tooltip.sy - tooltip.by} 年）
          </div>
          <div style={{ fontFamily: "var(--font-sans)", fontSize: 13, color: tooltip.v > 0 ? "#C41E3A" : tooltip.v < 0 ? "#2D6A4F" : "#666" }}>
            年化收益率：{tooltip.v > 0 ? "+" : ""}{tooltip.v.toFixed(1)}%
          </div>
        </div>
      )}
    </div>
  );
}

function Msg({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ height: 400, display: "flex", alignItems: "center", justifyContent: "center", color: "#aaa", fontFamily: FONT, fontSize: 13 }}>
      {children}
    </div>
  );
}
