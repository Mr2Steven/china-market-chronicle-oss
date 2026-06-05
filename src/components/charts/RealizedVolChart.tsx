"use client";

import ReactECharts from "echarts-for-react";
import { useMemo } from "react";
import { useChartData } from "@/hooks/useChartData";
import { computeRollingVolatility } from "@/lib/compute";
import type { DailyPoint } from "@/types/data";

interface Props { indexSlug: string }

const HIGH_VOL_THRESHOLD = 30;

export default function RealizedVolChart({ indexSlug }: Props) {
  const { data, loading, error } = useChartData<DailyPoint[]>(indexSlug, "daily.json");

  const { vol60, gradientFrac, stats } = useMemo(() => {
    if (!data) return { vol60: [], gradientFrac: 0.5, stats: null };
    const pts = computeRollingVolatility(data, 60);
    const vals = pts.map((d) => d.volatility);
    const maxV = Math.max(...vals);
    const minV = Math.min(...vals);
    // fraction from top where threshold falls
    const frac = maxV > minV ? (maxV - HIGH_VOL_THRESHOLD) / (maxV - minV) : 0.3;
    const highCount = vals.filter((v) => v >= HIGH_VOL_THRESHOLD).length;
    return {
      vol60: pts,
      gradientFrac: Math.max(0.01, Math.min(0.99, frac)),
      stats: {
        max: maxV.toFixed(1),
        avg: (vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1),
        highPct: ((highCount / vals.length) * 100).toFixed(0),
      },
    };
  }, [data]);

  if (loading) return <Placeholder h={340} msg="计算中…" />;
  if (error || !data) return <Placeholder h={340} msg={`加载失败：${error}`} />;

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
        `${params[0].name}<br/>已实现波动率：${params[0].value.toFixed(1)}%`,
    },
    xAxis: {
      type: "category",
      data: vol60.map((d) => d.date),
      axisLabel: { fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--text-muted)", interval: Math.floor(vol60.length / 8) },
      axisLine: { lineStyle: { color: "var(--border)" } },
      axisTick: { show: false },
      boundaryGap: false,
    },
    yAxis: {
      type: "value",
      min: 0,
      axisLabel: { fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--text-muted)", formatter: (v: number) => `${v}%` },
      splitLine: { lineStyle: { color: "var(--grid)", type: "dashed" } },
      axisLine: { show: false },
      axisTick: { show: false },
    },
    series: [
      {
        type: "line",
        data: vol60.map((d) => d.volatility),
        symbol: "none",
        lineStyle: { width: 1.5, color: "#C41E3A" },
        areaStyle: {
          color: {
            type: "linear", x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0,                    color: "rgba(196,30,58,0.55)" },
              { offset: gradientFrac - 0.001, color: "rgba(196,30,58,0.35)" },
              { offset: gradientFrac,         color: "rgba(196,30,58,0.12)" },
              { offset: 1,                    color: "rgba(196,30,58,0.04)" },
            ],
          },
        },
      },
      // 30% threshold line
      {
        type: "line",
        data: Array(vol60.length).fill(HIGH_VOL_THRESHOLD),
        symbol: "none",
        lineStyle: { color: "rgba(196,30,58,0.5)", width: 1, type: "dashed" },
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
            { label: "峰值波动率", value: `${stats.max}%` },
            { label: "长期均值", value: `${stats.avg}%` },
            { label: "超过30%占比", value: `${stats.highPct}%` },
          ].map((item) => (
            <div key={item.label}>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--text-muted)", marginBottom: 2 }}>{item.label}</div>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: 15, fontWeight: 600, color: "var(--text-heading)" }}>{item.value}</div>
            </div>
          ))}
          <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--text-muted)", alignSelf: "center" }}>
            — 红虚线 = {HIGH_VOL_THRESHOLD}% 警戒线（60日已实现）
          </div>
        </div>
      )}
      <ReactECharts option={option} style={{ height: 320 }} notMerge lazyUpdate={false} />
    </div>
  );
}

function Placeholder({ h, msg }: { h: number; msg: string }) {
  return <div style={{ height: h, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-muted)", fontFamily: "var(--font-mono)", fontSize: 13 }}>{msg}</div>;
}
