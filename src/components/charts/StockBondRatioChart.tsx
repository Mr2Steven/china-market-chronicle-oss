"use client";

import ReactECharts from "echarts-for-react";
import { useMemo } from "react";
import { useChartData } from "@/hooks/useChartData";

type Point = { date: string; pe?: number };

export default function StockBondRatioChart() {
  const { data, loading, error } = useChartData<Point[]>("hs300", "pe.json");

  const { pts, current, mean, percentile } = useMemo(() => {
    if (!data || data.length === 0) return { pts: [], current: 0, mean: 0, percentile: 0 };
    const filtered = data.filter((d) => d.pe != null && isFinite(d.pe!) && d.pe! > 0);
    const vals = filtered.map((d) => parseFloat((100 / d.pe!).toFixed(4)));
    const mean = vals.reduce((a, b) => a + b, 0) / vals.length;
    const current = vals[vals.length - 1];
    const below = vals.filter((v) => v <= current).length;
    const percentile = Math.round((below / vals.length) * 100);
    return { pts: filtered.map((d, i) => ({ date: d.date, ratio: vals[i] })), current, mean, percentile };
  }, [data]);

  if (loading) return <Placeholder h={340} msg="加载中…" />;
  if (error || !data) return <Placeholder h={340} msg={`加载失败：${error}`} />;

  const ratios = (pts as { date: string; ratio: number }[]).map((d) => d.ratio);
  const dates = (pts as { date: string; ratio: number }[]).map((d) => d.date);
  const n = pts.length;

  const pctColor = percentile >= 70 ? "#C41E3A" : percentile <= 30 ? "#2D6A4F" : "#444";

  const option = {
    backgroundColor: "transparent",
    grid: { left: 55, right: 20, top: 20, bottom: 64, containLabel: true },
    dataZoom: [
      { type: "inside" },
      { type: "slider", bottom: 8, height: 20, borderColor: "#ddd", fillerColor: "rgba(0,0,0,0.05)", textStyle: { fontFamily: "var(--font-mono)", fontSize: 10, color: "#aaa" } },
    ],
    tooltip: {
      trigger: "axis",
      backgroundColor: "#fff",
      borderColor: "#ddd",
      borderWidth: 1,
      textStyle: { fontFamily: "var(--font-sans)", fontSize: 13 },
      formatter: (params: { name: string; value: number }[]) =>
        `${params[0].name}<br/>股债比：${params[0].value?.toFixed(3) ?? "—"}`,
    },
    xAxis: {
      type: "category",
      data: dates,
      axisLabel: { fontFamily: "var(--font-mono)", fontSize: 11, color: "#888", interval: Math.floor(n / 8) },
      axisLine: { lineStyle: { color: "#ddd" } },
      axisTick: { show: false },
      boundaryGap: false,
    },
    yAxis: {
      type: "value",
      axisLabel: { fontFamily: "var(--font-mono)", fontSize: 11, color: "#888" },
      splitLine: { lineStyle: { color: "#eee", type: "dashed" } },
      axisLine: { show: false },
      axisTick: { show: false },
    },
    series: [
      {
        type: "line",
        data: ratios,
        symbol: "none",
        lineStyle: { width: 1.5, color: "#C41E3A" },
        areaStyle: {
          color: {
            type: "linear", x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: "rgba(196,30,58,0.30)" },
              { offset: 1, color: "rgba(196,30,58,0.04)" },
            ],
          },
        },
        connectNulls: false,
      },
      // mean line
      {
        type: "line",
        data: Array(n).fill(parseFloat(mean.toFixed(4))),
        symbol: "none",
        lineStyle: { color: "#999", width: 1, type: "dashed" },
        silent: true,
        animation: false,
        tooltip: { show: false },
      },
      // threshold 2.0 — attractive zone
      {
        type: "line",
        data: Array(n).fill(2.0),
        symbol: "none",
        lineStyle: { color: "#2D6A4F", width: 1.2, type: "dashed" },
        silent: true,
        animation: false,
        tooltip: { show: false },
      },
      // threshold 1.0 — overvalued zone
      {
        type: "line",
        data: Array(n).fill(1.0),
        symbol: "none",
        lineStyle: { color: "#C41E3A", width: 1.2, type: "dashed" },
        silent: true,
        animation: false,
        tooltip: { show: false },
      },
    ],
  };

  return (
    <div>
      <div style={{ display: "flex", gap: 24, marginBottom: 16, flexWrap: "wrap" }}>
        {[
          { label: "当前股债比", value: current.toFixed(3) },
          { label: "历史均值", value: mean.toFixed(3) },
          { label: "历史分位", value: `${percentile}%`, color: pctColor },
          { label: "参考线 ≥2.0", value: "低估区间" },
          { label: "参考线 ≤1.0", value: "高估区间" },
        ].map((item) => (
          <div key={item.label}>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--text-muted)", marginBottom: 2 }}>{item.label}</div>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: 15, fontWeight: 600, color: item.color ?? "var(--text-heading)" }}>{item.value}</div>
          </div>
        ))}
      </div>
      <ReactECharts option={option} style={{ height: 300 }} notMerge lazyUpdate={false} />
      <div style={{ marginTop: 8, fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--text-muted)" }}>
        股债收益比 = 100 ÷ PE-TTM（沪深300）。绿色虚线 2.0 = 历史低估信号，红色虚线 1.0 = 历史高估信号。
      </div>
    </div>
  );
}

function Placeholder({ h, msg }: { h: number; msg: string }) {
  return <div style={{ height: h, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-muted)", fontFamily: "var(--font-mono)", fontSize: 13 }}>{msg}</div>;
}
