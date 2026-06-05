"use client";

import ReactECharts from "echarts-for-react";
import { useMemo, useState } from "react";
import { useChartData } from "@/hooks/useChartData";

type IndexCode = "sh000001" | "sh000300";

interface ReturnDecompData {
  years: string[];
  indices: Record<IndexCode, {
    total_return: number[];
    pe_contribution: number[];
    eps_contribution: number[];
  }>;
}

const INDEX_OPTIONS: Array<{ code: IndexCode; label: string }> = [
  { code: "sh000001", label: "上证综指" },
  { code: "sh000300", label: "沪深300" },
];

function pct(value: number | null | undefined): string {
  if (typeof value !== "number" || Number.isNaN(value)) return "—";
  return `${(value * 100).toFixed(1)}%`;
}

export default function ReturnDecompPanel() {
  const { data, loading, error } = useChartData<ReturnDecompData>("return_decomp", "data.json");
  const [activeIndex, setActiveIndex] = useState<IndexCode>("sh000001");

  const option = useMemo(() => {
    if (!data) return null;
    const series = data.indices[activeIndex];

    return {
      backgroundColor: "transparent",
      legend: {
        data: ["PE贡献", "EPS贡献", "总回报"],
        top: 4,
        left: "center",
        textStyle: { fontFamily: "var(--font-mono)", fontSize: 11 },
      },
      grid: { left: 54, right: 24, top: 44, bottom: 36, containLabel: true },
      tooltip: {
        trigger: "axis",
        backgroundColor: "var(--bg-panel)",
        borderColor: "var(--border)",
        borderWidth: 1,
        textStyle: { fontFamily: "var(--font-sans)", fontSize: 13, color: "var(--text)" },
        formatter: (params: { name: string; seriesName: string; value: number }[]) => {
          const year = params[0]?.name ?? "";
          const idx = data.years.indexOf(year);
          return [
            year,
            `PE贡献：${pct(series.pe_contribution[idx])}`,
            `EPS贡献：${pct(series.eps_contribution[idx])}`,
            `总回报：${pct(series.total_return[idx])}`,
          ].join("<br/>");
        },
      },
      xAxis: {
        type: "category",
        data: data.years,
        axisLabel: { fontFamily: "var(--font-mono)", fontSize: 11, color: "#888" },
        axisLine: { lineStyle: { color: "#ddd" } },
        axisTick: { show: false },
      },
      yAxis: {
        type: "value",
        axisLabel: {
          fontFamily: "var(--font-mono)",
          fontSize: 11,
          color: "#888",
          formatter: (value: number) => `${Math.round(value * 100)}%`,
        },
        splitLine: { lineStyle: { color: "#eee", type: "dashed" } },
      },
      series: [
        {
          name: "PE贡献",
          type: "bar",
          stack: "contribution",
          data: series.pe_contribution,
          itemStyle: { color: "#D97706" },
          barMaxWidth: 34,
        },
        {
          name: "EPS贡献",
          type: "bar",
          stack: "contribution",
          data: series.eps_contribution,
          itemStyle: { color: "rgba(59,130,246,0.8)" },
          barMaxWidth: 34,
        },
        {
          name: "总回报",
          type: "line",
          data: series.total_return,
          symbolSize: 6,
          lineStyle: { width: 2, color: "#3F3F46" },
          itemStyle: { color: "#3F3F46" },
          z: 5,
        },
      ],
    };
  }, [activeIndex, data]);

  if (loading) return <Placeholder h={360} msg="加载中…" />;
  if (error || !data || !option) return <Placeholder h={360} msg={`加载失败：${error}`} />;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {INDEX_OPTIONS.map((item) => {
          const active = item.code === activeIndex;
          return (
            <button
              key={item.code}
              type="button"
              onClick={() => setActiveIndex(item.code)}
              style={{
                border: `1px solid ${active ? "var(--accent)" : "var(--border)"}`,
                background: active ? "color-mix(in srgb, var(--accent) 9%, transparent)" : "transparent",
                color: active ? "var(--accent)" : "var(--text-muted)",
                borderRadius: 6,
                padding: "6px 10px",
                fontFamily: "var(--font-mono)",
                fontSize: 12,
                cursor: "pointer",
              }}
            >
              {item.label}
            </button>
          );
        })}
      </div>
      <ReactECharts option={option} style={{ height: 360 }} notMerge lazyUpdate={false} />
      <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--text-muted)", lineHeight: 1.6 }}>
        EPS贡献采用残差法估算：年度价格回报 - PE变化率。拆分结果用于理解方向和量级，不含股息率。
      </div>
    </div>
  );
}

function Placeholder({ h, msg }: { h: number; msg: string }) {
  return <div style={{ height: h, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-muted)", fontFamily: "var(--font-mono)", fontSize: 13 }}>{msg}</div>;
}
