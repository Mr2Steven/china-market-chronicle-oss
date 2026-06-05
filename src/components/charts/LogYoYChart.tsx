"use client";

import ReactECharts from "echarts-for-react";
import { useMemo } from "react";
import { useChartData } from "@/hooks/useChartData";
import { computeLogYoY } from "@/lib/compute";
import type { DailyPoint } from "@/types/data";

interface Props {
  indexSlug: string;
}

export default function LogYoYChart({ indexSlug }: Props) {
  const { data, loading, error } = useChartData<DailyPoint[]>(indexSlug, "daily.json");

  const { series, zeroFrac } = useMemo(() => {
    if (!data) return { series: [], zeroFrac: 0.5 };
    const pts = computeLogYoY(data);
    const vals = pts.map((d) => d.logYoY);
    const maxVal = vals.length ? Math.max(...vals) : 100;
    const minVal = vals.length ? Math.min(...vals) : -100;
    const frac = maxVal > minVal ? maxVal / (maxVal - minVal) : 0.5;
    return {
      series: pts,
      zeroFrac: Math.max(0.01, Math.min(0.99, frac)),
    };
  }, [data]);

  if (loading) return <div style={{ height: 340, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-muted)", fontFamily: "var(--font-mono)", fontSize: 13 }}>计算中…</div>;
  if (error || !data) return <div style={{ height: 340, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-muted)", fontFamily: "var(--font-mono)", fontSize: 13 }}>加载失败：{error}</div>;

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
        return `${params[0].name}<br/>对数同比：${sign}${params[0].value.toFixed(2)}%`;
      },
    },
    xAxis: {
      type: "category",
      data: series.map((d) => d.date),
      axisLabel: { fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--text-muted)", interval: Math.floor(series.length / 8) },
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
        data: series.map((d) => d.logYoY),
        symbol: "none",
        lineStyle: { width: 1, color: "#888" },
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
        data: Array(series.length).fill(0),
        symbol: "none",
        lineStyle: { color: "#999", width: 1, type: "solid" },
        areaStyle: undefined,
        silent: true,
        animation: false,
        tooltip: { show: false },
      },
    ],
  };

  return <ReactECharts option={option} style={{ height: 340 }} notMerge lazyUpdate={false} />;
}
