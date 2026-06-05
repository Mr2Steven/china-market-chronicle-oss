"use client";

import ReactECharts from "echarts-for-react";
import { useMemo } from "react";
import { useChartData } from "@/hooks/useChartData";
import type { DrawdownData } from "@/types/data";

interface Props { indexSlug: string }

function findClosest(daily: { date: string; drawdown_pct: number }[], target: string) {
  const t = new Date(target).getTime();
  let best = daily[0];
  let bestDiff = Infinity;
  for (const pt of daily) {
    const diff = Math.abs(new Date(pt.date).getTime() - t);
    if (diff < bestDiff) { bestDiff = diff; best = pt; }
  }
  return best;
}

export default function DrawdownChart({ indexSlug }: Props) {
  const { data, loading, error } = useChartData<DrawdownData>(indexSlug, "drawdowns.json");

  const { daily, events } = useMemo(() => {
    if (!data) return { daily: [], events: [] };
    const significant = data.named_events.filter((e) => e.drawdown_pct <= -20);
    return { daily: data.daily_drawdown, events: significant };
  }, [data]);

  if (loading) return <Placeholder h={380} msg="加载中…" />;
  if (error || !data) return <Placeholder h={380} msg={`加载失败：${error}`} />;

  const markPointData = events.map((e) => {
    const pt = findClosest(daily, e.trough_date);
    const idx = daily.findIndex((d) => d.date === pt.date);
    return {
      coord: [idx, pt.drawdown_pct],
      name: e.name,
      value: `${e.name}\n${e.drawdown_pct}%`,
      symbolSize: 6,
      itemStyle: { color: "#555", opacity: 0.85 },
      label: {
        show: true,
        position: "bottom",
        fontFamily: "var(--font-sans)",
        fontSize: 10,
        color: "var(--text-muted)",
        formatter: (p: { name: string }) => p.name,
      },
    };
  });

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
        `${params[0].name}<br/>回撤：${params[0].value.toFixed(1)}%`,
    },
    xAxis: {
      type: "category",
      data: daily.map((d) => d.date),
      axisLabel: { fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--text-muted)", interval: Math.floor(daily.length / 8) },
      axisLine: { lineStyle: { color: "var(--border)" } },
      axisTick: { show: false },
      boundaryGap: false,
    },
    yAxis: {
      type: "value",
      max: 0,
      axisLabel: { fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--text-muted)", formatter: (v: number) => `${v}%` },
      splitLine: { lineStyle: { color: "var(--grid)", type: "dashed" } },
      axisLine: { show: false },
      axisTick: { show: false },
    },
    series: [
      {
        type: "line",
        data: daily.map((d) => d.drawdown_pct),
        symbol: "none",
        lineStyle: { width: 1, color: "#2D6A4F" },
        areaStyle: { color: "rgba(45,106,79,0.25)", origin: 0 },
        markPoint: { data: markPointData, animation: false },
      },
    ],
  };

  const worst = events.length ? events.reduce((a, b) => a.drawdown_pct < b.drawdown_pct ? a : b) : null;

  return (
    <div>
      {worst && (
        <div style={{ display: "flex", gap: 24, marginBottom: 16, flexWrap: "wrap" }}>
          {[
            { label: "最大回撤", value: `${worst.drawdown_pct}%` },
            { label: "发生时间", value: worst.trough_date.substring(0, 7) },
            { label: "重大回撤事件", value: `${events.length} 次 (≤-20%)` },
          ].map((item) => (
            <div key={item.label}>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--text-muted)", marginBottom: 2 }}>{item.label}</div>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: 15, fontWeight: 600, color: "var(--text-heading)" }}>{item.value}</div>
            </div>
          ))}
        </div>
      )}
      <ReactECharts option={option} style={{ height: 360 }} notMerge lazyUpdate={false} />
    </div>
  );
}

function Placeholder({ h, msg }: { h: number; msg: string }) {
  return (
    <div style={{ height: h, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-muted)", fontFamily: "var(--font-mono)", fontSize: 13 }}>
      {msg}
    </div>
  );
}
