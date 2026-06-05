"use client";

import ReactECharts from "echarts-for-react";
import { useMemo } from "react";
import { useChartData } from "@/hooks/useChartData";

interface Props {
  indexSlug: string;
  filename: string;        // "pe.json" | "pb.json"
  fieldKey: "pe" | "pb";
  label: string;           // "PE-TTM" | "PB"
  colorUp?: string;        // fill color
}

type Point = { date: string; pe?: number; pb?: number };

export default function ValuationAreaChart({
  indexSlug, filename, fieldKey, label, colorUp = "#C41E3A",
}: Props) {
  const { data, loading, error } = useChartData<Point[]>(indexSlug, filename);

  const { pts, mean, stdDev, current, percentile } = useMemo(() => {
    if (!data || data.length === 0) return { pts: [], mean: 0, stdDev: 0, current: 0, percentile: 0 };
    const vals = data.map((d) => d[fieldKey] as number).filter((v) => v != null && isFinite(v) && v > 0);
    const mean = vals.reduce((a, b) => a + b, 0) / vals.length;
    const variance = vals.reduce((s, v) => s + (v - mean) ** 2, 0) / vals.length;
    const stdDev = Math.sqrt(variance);
    const current = vals[vals.length - 1];
    const below = vals.filter((v) => v <= current).length;
    const percentile = Math.round((below / vals.length) * 100);
    return { pts: data, mean, stdDev, current, percentile };
  }, [data, fieldKey]);

  if (loading) return <Loader h={340} />;
  if (error || !data) return <Loader h={340} msg={`加载失败：${error}`} />;

  const values = pts.map((d) => d[fieldKey] as number | null);
  const maxVal = Math.max(...(values.filter((v) => v != null) as number[]));
  const minVal = Math.min(...(values.filter((v) => v != null) as number[]));

  // gradient: mean ± 1σ band in lighter color
  const r = parseInt(colorUp.slice(1, 3), 16);
  const g = parseInt(colorUp.slice(3, 5), 16);
  const b = parseInt(colorUp.slice(5, 7), 16);

  const option = {
    backgroundColor: "transparent",
    grid: { left: 55, right: 20, top: 20, bottom: 64, containLabel: true },
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
      formatter: (params: { name: string; value: number }[]) =>
        `${params[0].name}<br/>${label}：${params[0].value?.toFixed(2) ?? "—"}`,
    },
    xAxis: {
      type: "category",
      data: pts.map((d) => d.date),
      axisLabel: { fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--text-muted)", interval: Math.floor(pts.length / 8) },
      axisLine: { lineStyle: { color: "var(--border)" } },
      axisTick: { show: false },
      boundaryGap: false,
    },
    yAxis: {
      type: "value",
      min: Math.max(0, Math.floor(minVal * 0.9)),
      axisLabel: { fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--text-muted)" },
      splitLine: { lineStyle: { color: "var(--grid)", type: "dashed" } },
      axisLine: { show: false },
      axisTick: { show: false },
    },
    series: [
      {
        type: "line",
        data: values,
        symbol: "none",
        lineStyle: { width: 1.5, color: colorUp },
        areaStyle: {
          color: {
            type: "linear", x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: `rgba(${r},${g},${b},0.35)` },
              { offset: 1, color: `rgba(${r},${g},${b},0.04)` },
            ],
          },
        },
        connectNulls: false,
      },
      // mean line
      {
        type: "line",
        data: Array(pts.length).fill(parseFloat(mean.toFixed(2))),
        symbol: "none",
        lineStyle: { color: "#999", width: 1, type: "dashed" },
        silent: true,
        animation: false,
        tooltip: { show: false },
      },
      // mean+1σ line
      {
        type: "line",
        data: Array(pts.length).fill(parseFloat((mean + stdDev).toFixed(2))),
        symbol: "none",
        lineStyle: { color: "#ccc", width: 1, type: "dashed" },
        silent: true,
        animation: false,
        tooltip: { show: false },
      },
      // mean-1σ line
      {
        type: "line",
        data: Array(pts.length).fill(parseFloat(Math.max(0, mean - stdDev).toFixed(2))),
        symbol: "none",
        lineStyle: { color: "#ccc", width: 1, type: "dashed" },
        silent: true,
        animation: false,
        tooltip: { show: false },
      },
    ],
  };

  const pctColor = percentile >= 70 ? "#C41E3A" : percentile <= 30 ? "#2D6A4F" : "var(--text-heading)";

  return (
    <div>
      <div style={{ display: "flex", gap: 24, marginBottom: 16, flexWrap: "wrap" }}>
        {[
          { label: `当前${label}`, value: current.toFixed(2) },
          { label: "历史均值", value: mean.toFixed(2) },
          { label: "历史分位", value: `${percentile}%`, color: pctColor },
          { label: "均值±1σ", value: `${(mean - stdDev).toFixed(1)} ~ ${(mean + stdDev).toFixed(1)}` },
          { label: "历史范围", value: `${minVal.toFixed(1)} ~ ${maxVal.toFixed(1)}` },
        ].map((item) => (
          <div key={item.label}>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--text-muted)", marginBottom: 2 }}>{item.label}</div>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: 15, fontWeight: 600, color: item.color ?? "var(--text-heading)" }}>{item.value}</div>
          </div>
        ))}
      </div>
      <ReactECharts option={option} style={{ height: 300 }} notMerge lazyUpdate={false} />
    </div>
  );
}

function Loader({ h, msg }: { h: number; msg?: string }) {
  return <div style={{ height: h, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-muted)", fontFamily: "var(--font-mono)", fontSize: 13 }}>{msg ?? "加载中…"}</div>;
}
