"use client";

import ReactECharts from "echarts-for-react";
import { useMemo } from "react";
import { useChartData } from "@/hooks/useChartData";
import { computeRollingVolatility } from "@/lib/compute";
import type { DailyPoint } from "@/types/data";

interface Props { indexSlug: string }

export default function VolatilityChart({ indexSlug }: Props) {
  const { data, loading, error } = useChartData<DailyPoint[]>(indexSlug, "daily.json");

  const { vol20, vol60 } = useMemo(() => {
    if (!data) return { vol20: [], vol60: [] };
    return {
      vol20: computeRollingVolatility(data, 20),
      vol60: computeRollingVolatility(data, 60),
    };
  }, [data]);

  if (loading) return <Placeholder h={340} msg="计算中…" />;
  if (error || !data) return <Placeholder h={340} msg={`加载失败：${error}`} />;

  // Align dates: use the shorter series as base (vol60 starts later)
  const dates = vol60.map((d) => d.date);
  const vol20Aligned = (() => {
    const map = new Map(vol20.map((d) => [d.date, d.volatility]));
    return dates.map((dt) => map.get(dt) ?? null);
  })();

  const option = {
    backgroundColor: "transparent",
    grid: { left: 55, right: 20, top: 20, bottom: 80, containLabel: true },
    dataZoom: [
      { type: "inside" },
      { type: "slider", bottom: 32, height: 20, borderColor: "#ddd", fillerColor: "rgba(0,0,0,0.05)", textStyle: { fontFamily: "var(--font-mono)", fontSize: 10, color: "#aaa" } },
    ],
    legend: {
      bottom: 0,
      padding: [0, 0, 8, 0],
      textStyle: { fontFamily: "var(--font-sans)", fontSize: 12, color: "var(--text-muted)" },
      itemWidth: 20,
      itemHeight: 2,
    },
    tooltip: {
      trigger: "axis",
      backgroundColor: "var(--bg-panel)",
      borderColor: "var(--border)",
      borderWidth: 1,
      textStyle: { fontFamily: "var(--font-sans)", fontSize: 13, color: "var(--text)" },
      formatter: (params: { seriesName: string; name: string; value: number | null }[]) => {
        const lines = params
          .filter((p) => p.value != null)
          .map((p) => `${p.seriesName}：${(p.value as number).toFixed(1)}%`);
        return `${params[0]?.name ?? ""}<br/>${lines.join("<br/>")}`;
      },
    },
    xAxis: {
      type: "category",
      data: dates,
      axisLabel: { fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--text-muted)", interval: Math.floor(dates.length / 8) },
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
        name: "20日波动率",
        type: "line",
        data: vol20Aligned,
        symbol: "none",
        lineStyle: { width: 1, color: "rgba(196,30,58,0.6)" },
        connectNulls: false,
      },
      {
        name: "60日波动率",
        type: "line",
        data: vol60.map((d) => d.volatility),
        symbol: "none",
        lineStyle: { width: 2, color: "#C41E3A" },
      },
    ],
  };

  const avgVol60 = vol60.length ? (vol60.reduce((s, d) => s + d.volatility, 0) / vol60.length).toFixed(1) : "—";
  const maxVol60 = vol60.length ? Math.max(...vol60.map((d) => d.volatility)).toFixed(1) : "—";

  return (
    <div>
      <div style={{ display: "flex", gap: 24, marginBottom: 16, flexWrap: "wrap" }}>
        {[
          { label: "60日均值", value: `${avgVol60}%` },
          { label: "60日峰值", value: `${maxVol60}%` },
        ].map((item) => (
          <div key={item.label}>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--text-muted)", marginBottom: 2 }}>{item.label}</div>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: 15, fontWeight: 600, color: "var(--text-heading)" }}>{item.value}</div>
          </div>
        ))}
      </div>
      <ReactECharts option={option} style={{ height: 320 }} notMerge lazyUpdate={false} />
    </div>
  );
}

function Placeholder({ h, msg }: { h: number; msg: string }) {
  return <div style={{ height: h, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-muted)", fontFamily: "var(--font-mono)", fontSize: 13 }}>{msg}</div>;
}
