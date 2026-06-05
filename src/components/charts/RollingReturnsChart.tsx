"use client";

import ReactECharts from "echarts-for-react";
import { useMemo } from "react";
import { useChartData } from "@/hooks/useChartData";
import type { RollingReturn } from "@/types/data";

interface Props {
  indexSlug: string;
}

export default function RollingReturnsChart({ indexSlug }: Props) {
  const { data, loading, error } = useChartData<RollingReturn[]>(indexSlug, "rolling-5y.json");

  const { stats, zeroFrac } = useMemo(() => {
    if (!data || data.length === 0) return { stats: null, zeroFrac: 0.5 };
    const vals = data.map((d) => d.cagr_5y).filter((v) => v != null);
    const pos = vals.filter((v) => v >= 0).length;
    const pct = ((pos / vals.length) * 100).toFixed(0);
    const avg = (vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1);
    const maxVal = Math.max(...vals);
    const minVal = Math.min(...vals);
    // fraction from top (0) to bottom (1) where y=0 falls
    const frac = maxVal > minVal ? maxVal / (maxVal - minVal) : 0.5;
    return {
      stats: { pct, avg, max: maxVal.toFixed(1), min: minVal.toFixed(1) },
      zeroFrac: Math.max(0.01, Math.min(0.99, frac)),
    };
  }, [data]);

  if (loading) return <div style={{ height: 360, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-muted)", fontFamily: "var(--font-mono)", fontSize: 13 }}>加载中…</div>;
  if (error || !data) return <div style={{ height: 360, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-muted)", fontFamily: "var(--font-mono)", fontSize: 13 }}>加载失败：{error}</div>;

  const option = {
    backgroundColor: "transparent",
    grid: { left: 60, right: 20, top: 20, bottom: 64, containLabel: true },
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
      formatter: (params: { name: string; value: number }[]) => {
        const sign = params[0].value >= 0 ? "+" : "";
        return `${params[0].name}<br/>5年年化：${sign}${params[0].value}%`;
      },
    },
    xAxis: {
      type: "category",
      data: data.map((d) => d.date),
      axisLabel: { fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--text-muted)", interval: Math.floor(data.length / 8) },
      axisLine: { lineStyle: { color: "var(--border)" } },
      axisTick: { show: false },
      boundaryGap: false,
    },
    yAxis: {
      type: "value",
      axisLabel: { fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--text-muted)", formatter: (v: number) => `${v}%` },
      splitLine: { lineStyle: { color: "var(--grid)", type: "dashed" } },
      axisLine: { show: false },
      axisTick: { show: false },
    },
    series: [
      {
        type: "line",
        data: data.map((d) => d.cagr_5y),
        symbol: "none",
        lineStyle: { width: 1.5, color: "#888" },
        areaStyle: {
          color: {
            type: "linear", x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0,                color: "rgba(196,30,58,0.35)" },
              { offset: zeroFrac - 0.001, color: "rgba(196,30,58,0.06)" },
              { offset: zeroFrac,         color: "rgba(45,106,79,0.06)" },
              { offset: 1,                color: "rgba(45,106,79,0.35)" },
            ],
          },
        },
      },
      {
        type: "line",
        data: Array(data.length).fill(0),
        symbol: "none",
        lineStyle: { color: "#999", width: 1, type: "solid" },
        areaStyle: undefined,
        silent: true,
        animation: false,
        tooltip: { show: false },
      },
    ],
  };

  return (
    <div>
      {stats && (
        <div style={{ display: "flex", gap: 24, marginBottom: 16, flexWrap: "wrap" }}>
          {[
            { label: "正收益占比", value: `${stats.pct}%` },
            { label: "平均年化", value: `${stats.avg}%` },
            { label: "最高", value: `+${stats.max}%` },
            { label: "最低", value: `${stats.min}%` },
          ].map((item) => (
            <div key={item.label}>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--text-muted)", marginBottom: 2 }}>{item.label}</div>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: 15, fontWeight: 600, color: "var(--text-heading)" }}>{item.value}</div>
            </div>
          ))}
        </div>
      )}
      <ReactECharts option={option} style={{ height: 340 }} notMerge lazyUpdate={false} />
    </div>
  );
}
