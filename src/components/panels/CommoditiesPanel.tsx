"use client";

import ReactECharts from "echarts-for-react";
import { useMemo } from "react";
import { useChartData } from "@/hooks/useChartData";

interface CommoditiesData {
  dates: string[];
  copper: number[];
  oil: number[];
  gold: number[];
  sh_close: number[];
}

type SeriesKey = "copper" | "oil" | "gold" | "sh_close";

const SERIES: Array<{ key: SeriesKey; name: string; color: string; unit: string }> = [
  { key: "copper", name: "铜", color: "#B45309", unit: "元/吨" },
  { key: "oil", name: "原油", color: "#6B7280", unit: "美元/桶" },
  { key: "gold", name: "黄金", color: "#D97706", unit: "美元/盎司" },
  { key: "sh_close", name: "上证综指", color: "#C41E3A", unit: "点" },
];

function pct(value: number | null | undefined): string {
  if (typeof value !== "number" || Number.isNaN(value)) return "—";
  return `${value >= 0 ? "+" : ""}${value.toFixed(1)}%`;
}

function formatValue(value: number | null | undefined, unit: string): string {
  if (typeof value !== "number" || Number.isNaN(value)) return "—";
  return `${value.toFixed(value >= 1000 ? 0 : 2)}${unit ? ` ${unit}` : ""}`;
}

export default function CommoditiesPanel() {
  const { data, loading, error } = useChartData<CommoditiesData>("commodities", "data.json");

  const prepared = useMemo(() => {
    if (!data || data.dates.length === 0) return null;
    const baseIndex = Math.max(0, data.dates.findIndex((date) => date >= "2015-01-01"));
    const currentYear = data.dates[data.dates.length - 1].slice(0, 4);
    const ytdIndex = Math.max(0, data.dates.findIndex((date) => date.startsWith(currentYear)));

    const normalized = Object.fromEntries(SERIES.map((item) => {
      const values = data[item.key];
      const base = values[baseIndex];
      return [item.key, values.map((value) => Number(((value / base) * 100).toFixed(2)))];
    })) as Record<SeriesKey, number[]>;

    const kpis = SERIES.map((item) => {
      const values = data[item.key];
      const latest = values[values.length - 1];
      const ytdBase = values[ytdIndex];
      return {
        ...item,
        latest,
        ytd: ((latest / ytdBase) - 1) * 100,
      };
    });

    return { baseIndex, ytdIndex, normalized, kpis };
  }, [data]);

  const option = useMemo(() => {
    if (!data || !prepared) return null;
    const n = data.dates.length;

    return {
      backgroundColor: "transparent",
      legend: {
        data: SERIES.map((item) => item.name),
        top: 4,
        left: "center",
        textStyle: { fontFamily: "var(--font-mono)", fontSize: 11 },
      },
      grid: { left: 54, right: 24, top: 44, bottom: 64, containLabel: true },
      dataZoom: [
        { type: "inside" },
        { type: "slider", bottom: 8, height: 20, borderColor: "#ddd", fillerColor: "rgba(0,0,0,0.05)", textStyle: { fontFamily: "var(--font-mono)", fontSize: 10, color: "#aaa" } },
      ],
      tooltip: {
        trigger: "axis",
        backgroundColor: "var(--bg-panel)",
        borderColor: "var(--border)",
        borderWidth: 1,
        textStyle: { fontFamily: "var(--font-sans)", fontSize: 13, color: "var(--text)" },
        formatter: (params: { name: string }[]) => {
          const date = params[0]?.name ?? "";
          const idx = data.dates.indexOf(date);
          const lines = SERIES.map((item) => {
            const raw = data[item.key][idx];
            const norm = prepared.normalized[item.key][idx] - 100;
            return `${item.name}：${formatValue(raw, item.unit)}（${pct(norm)}）`;
          });
          return [date, ...lines].join("<br/>");
        },
      },
      xAxis: {
        type: "category",
        data: data.dates,
        axisLabel: { fontFamily: "var(--font-mono)", fontSize: 11, color: "#888", interval: Math.floor(n / 8) },
        axisLine: { lineStyle: { color: "#ddd" } },
        axisTick: { show: false },
        boundaryGap: false,
      },
      yAxis: {
        type: "value",
        name: "2015=100",
        nameTextStyle: { fontFamily: "var(--font-mono)", fontSize: 10, color: "#888" },
        axisLabel: { fontFamily: "var(--font-mono)", fontSize: 11, color: "#888" },
        splitLine: { lineStyle: { color: "#eee", type: "dashed" } },
      },
      series: SERIES.map((item) => ({
        name: item.name,
        type: "line",
        data: prepared.normalized[item.key],
        symbol: "none",
        lineStyle: { width: item.key === "sh_close" ? 1.8 : 1.5, color: item.color },
        itemStyle: { color: item.color },
        connectNulls: true,
      })),
    };
  }, [data, prepared]);

  if (loading) return <Placeholder h={380} msg="加载中…" />;
  if (error || !data || !prepared || !option) return <Placeholder h={380} msg={`加载失败：${error}`} />;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "flex", gap: "14px 26px", flexWrap: "wrap", alignItems: "flex-start" }}>
        {prepared.kpis.map((item) => (
          <div key={item.key}>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--text-muted)", marginBottom: 2 }}>{item.name}</div>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: 15, fontWeight: 600, color: item.color }}>{formatValue(item.latest, item.unit)}</div>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: item.ytd >= 0 ? "#C41E3A" : "#2D6A4F", marginTop: 2 }}>
              年初至今 {pct(item.ytd)}
            </div>
          </div>
        ))}
      </div>
      <ReactECharts option={option} style={{ height: 380 }} notMerge lazyUpdate={false} />
      <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--text-muted)", lineHeight: 1.6 }}>
        各序列以 2015-01-05 为基准归一化为 100；铜价为沪铜主连（元/吨），原油为WTI（美元/桶），黄金为现货（美元/盎司）；大宗商品价格按上证交易日向前填充。
      </div>
    </div>
  );
}

function Placeholder({ h, msg }: { h: number; msg: string }) {
  return <div style={{ height: h, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-muted)", fontFamily: "var(--font-mono)", fontSize: 13 }}>{msg}</div>;
}
