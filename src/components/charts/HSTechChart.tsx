"use client";

import ReactECharts from "echarts-for-react";
import { useMemo } from "react";
import { useChartData } from "@/hooks/useChartData";
import type { DailyPoint } from "@/types/data";

export default function HSTechChart() {
  const { data, loading, error } = useChartData<DailyPoint[]>("hstech", "daily.json");

  const option = useMemo(() => {
    if (!data || data.length === 0) return {};
    const n = data.length;
    const values = data.map((d) => d.close);
    const dates = data.map((d) => d.date);
    const maxVal = Math.max(...values);
    const minVal = Math.min(...values);
    const current = values[n - 1];
    const fromPeak = ((current / maxVal) - 1) * 100;

    // color gradient: current < 8000 is deeply underwater (peak ~11000)
    const fillColor = current < 8000 ? "#2D6A4F" : "#C41E3A";

    return {
      _stats: { current, maxVal, minVal, fromPeak },
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
          `${params[0].name}<br/>恒生科技：${params[0].value?.toFixed(0) ?? "—"}`,
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
        min: Math.floor(minVal * 0.95),
        axisLabel: { fontFamily: "var(--font-mono)", fontSize: 11, color: "#888" },
        splitLine: { lineStyle: { color: "#eee", type: "dashed" } },
        axisLine: { show: false },
        axisTick: { show: false },
      },
      series: [
        {
          type: "line",
          data: values,
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
      ],
    };
  }, [data]);

  if (loading) return <Placeholder h={340} msg="加载中…" />;
  if (error || !data || data.length === 0) return <Placeholder h={340} msg={`加载失败：${error}`} />;

  const values = data.map((d) => d.close);
  const maxVal = Math.max(...values);
  const minVal = Math.min(...values);
  const current = values[values.length - 1];
  const fromPeak = ((current / maxVal) - 1) * 100;
  const fromTrough = ((current / minVal) - 1) * 100;
  const startDate = data[0].date;

  const stats = [
    { label: "当前点位", value: current.toFixed(0) },
    { label: "历史峰值", value: maxVal.toFixed(0) },
    { label: "距峰值", value: `${fromPeak.toFixed(1)}%`, color: fromPeak < -30 ? "#2D6A4F" : "#444" },
    { label: "历史低点", value: minVal.toFixed(0) },
    { label: "距低点", value: `+${fromTrough.toFixed(1)}%`, color: "#C41E3A" },
    { label: "起始日", value: startDate },
  ];

  return (
    <div>
      <div style={{ display: "flex", gap: 24, marginBottom: 16, flexWrap: "wrap" }}>
        {stats.map((s) => (
          <div key={s.label}>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--text-muted)", marginBottom: 2 }}>{s.label}</div>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: 15, fontWeight: 600, color: s.color ?? "var(--text-heading)" }}>{s.value}</div>
          </div>
        ))}
      </div>
      <ReactECharts option={option} style={{ height: 300 }} notMerge lazyUpdate={false} />
      <div style={{ marginTop: 6, fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--text-muted)" }}>
        恒生科技指数 2020 年 7 月上市。追踪在港上市的 30 家科技龙头公司，覆盖互联网、金融科技、云计算、电商等。
      </div>
    </div>
  );
}

function Placeholder({ h, msg }: { h: number; msg: string }) {
  return <div style={{ height: h, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-muted)", fontFamily: "var(--font-mono)", fontSize: 13 }}>{msg}</div>;
}
