"use client";

import ReactECharts from "echarts-for-react";
import { useMemo } from "react";
import { useChartData } from "@/hooks/useChartData";

interface PremiumPoint {
  date: string;
  premium: number; // 100 = parity, >100 = A premium, <100 = H premium
}

export default function AHPremiumChart() {
  const { data, loading, error } = useChartData<PremiumPoint[]>("ah-premium", "index.json");

  const { current, mean, max, min } = useMemo(() => {
    if (!data || data.length === 0) return { current: 0, mean: 0, max: 0, min: 0 };
    const vals = data.map((d) => d.premium);
    const mean = vals.reduce((a, b) => a + b, 0) / vals.length;
    return {
      current: vals[vals.length - 1],
      mean: Math.round(mean * 10) / 10,
      max: Math.max(...vals),
      min: Math.min(...vals),
    };
  }, [data]);

  const option = useMemo(() => {
    if (!data || data.length === 0) return {};
    const dates = data.map((d) => d.date);
    const vals = data.map((d) => d.premium);
    const n = dates.length;

    // color: above 100 = A-premium (red area), below 100 = H-premium (green area)
    const maxVal = Math.max(...vals);
    const minVal = Math.min(...vals);
    const zeroFrac = Math.max(0.01, Math.min(0.99, (maxVal - 100) / (maxVal - minVal)));

    return {
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
        formatter: (params: { name: string; value: number }[]) => {
          const v = params[0].value;
          const desc = v > 100 ? `A股溢价 +${(v - 100).toFixed(1)}%` : `H股溢价 +${(100 - v).toFixed(1)}%`;
          return `${params[0].name}<br/>A/H 溢价：${v?.toFixed(1) ?? "—"}<br/>${desc}`;
        },
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
        min: Math.max(50, Math.floor(minVal * 0.95)),
        axisLabel: { fontFamily: "var(--font-mono)", fontSize: 11, color: "#888" },
        splitLine: { lineStyle: { color: "#eee", type: "dashed" } },
        axisLine: { show: false },
        axisTick: { show: false },
      },
      series: [
        {
          type: "line",
          data: vals,
          symbol: "none",
          lineStyle: { width: 1.5, color: "#C41E3A" },
          areaStyle: {
            color: {
              type: "linear", x: 0, y: 0, x2: 0, y2: 1,
              colorStops: [
                { offset: 0,           color: "rgba(196,30,58,0.35)" },
                { offset: zeroFrac - 0.001, color: "rgba(196,30,58,0.06)" },
                { offset: zeroFrac,    color: "rgba(45,106,79,0.06)" },
                { offset: 1,           color: "rgba(45,106,79,0.30)" },
              ],
            },
          },
          connectNulls: false,
        },
        // 100 parity line
        {
          type: "line",
          data: Array(n).fill(100),
          symbol: "none",
          lineStyle: { color: "#999", width: 1.2, type: "dashed" },
          silent: true,
          animation: false,
          tooltip: { show: false },
        },
        // mean line
        {
          type: "line",
          data: Array(n).fill(parseFloat(mean.toFixed(1))),
          symbol: "none",
          lineStyle: { color: "#ccc", width: 1, type: "dashed" },
          silent: true,
          animation: false,
          tooltip: { show: false },
        },
      ],
    };
  }, [data, mean]);

  if (loading) return <Placeholder h={340} msg="加载中…" />;
  if (error || !data || data.length === 0) return <Placeholder h={340} msg={`加载失败：${error}`} />;

  const pctColor = current > 120 ? "#C41E3A" : current < 100 ? "#2D6A4F" : "#444";

  return (
    <div>
      <div style={{ display: "flex", gap: 24, marginBottom: 16, flexWrap: "wrap" }}>
        {[
          { label: "当前 A/H 溢价", value: current.toFixed(1), color: pctColor },
          { label: "历史均值", value: mean.toFixed(1) },
          { label: "历史最高（A溢价）", value: max.toFixed(1), color: "#C41E3A" },
          { label: "历史最低（H溢价）", value: min.toFixed(1), color: "#2D6A4F" },
          { label: "基准", value: "100 = 等价" },
        ].map((s) => (
          <div key={s.label}>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--text-muted)", marginBottom: 2 }}>{s.label}</div>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: 15, fontWeight: 600, color: s.color ?? "var(--text-heading)" }}>{s.value}</div>
          </div>
        ))}
      </div>
      <ReactECharts option={option} style={{ height: 300 }} notMerge lazyUpdate={false} />
      <div style={{ marginTop: 6, fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--text-muted)" }}>
        基于 7 对主要 A/H 双重上市蓝筹股月末收盘价估算（工行、建行、农行、中行、平安、中油、中化），非官方 HSAHP 指数。
        灰色虚线 = 历史均值，深灰虚线 = 100（等价）。
      </div>
    </div>
  );
}

function Placeholder({ h, msg }: { h: number; msg: string }) {
  return <div style={{ height: h, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-muted)", fontFamily: "var(--font-mono)", fontSize: 13 }}>{msg}</div>;
}
