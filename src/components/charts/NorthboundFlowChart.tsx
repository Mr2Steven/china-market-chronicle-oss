"use client";

import ReactEChartsCore from "echarts-for-react/lib/core";
import * as echarts from "echarts/core";
import { BarChart, LineChart } from "echarts/charts";
import { GridComponent, TooltipComponent, LegendComponent, DataZoomComponent } from "echarts/components";
import { CanvasRenderer } from "echarts/renderers";
import { useMemo } from "react";
import { useChartData } from "@/hooks/useChartData";

echarts.use([BarChart, LineChart, GridComponent, TooltipComponent, LegendComponent, DataZoomComponent, CanvasRenderer]);

interface FlowPoint {
  date: string;
  net_flow: number;   // 亿元
  cumulative: number; // 万亿元
}

export default function NorthboundFlowChart() {
  const { data, loading, error } = useChartData<FlowPoint[]>("northbound", "flow.json");

  const option = useMemo(() => {
    if (!data || data.length === 0) return {};

    const dates = data.map((d) => d.date);
    const flows = data.map((d) => d.net_flow);
    const cumulatives = data.map((d) => parseFloat((d.cumulative * 10000).toFixed(0))); // convert 万亿→亿
    const n = dates.length;

    return {
      backgroundColor: "transparent",
      legend: {
        data: ["日净流入（亿元）", "累计净买入（亿元）"],
        top: "bottom",
        padding: [0, 0, 8, 0],
        textStyle: { fontFamily: "var(--font-mono)", fontSize: 10 },
      },
      grid: { left: 60, right: 60, top: 16, bottom: 80, containLabel: true },
      dataZoom: [
        { type: "inside" },
        { type: "slider", bottom: 32, height: 20, borderColor: "#ddd", fillerColor: "rgba(0,0,0,0.05)", textStyle: { fontFamily: "var(--font-mono)", fontSize: 10, color: "#aaa" } },
      ],
      tooltip: {
        trigger: "axis",
        backgroundColor: "#fff",
        borderColor: "#ddd",
        borderWidth: 1,
        textStyle: { fontFamily: "var(--font-sans)", fontSize: 12 },
        axisPointer: { type: "shadow" },
        formatter: (params: { seriesName: string; name: string; value: number }[]) => {
          const lines = params.map((p) => `${p.seriesName}：${p.value != null ? p.value.toFixed(1) : "—"}`).join("<br/>");
          return `${params[0]?.name}<br/>${lines}`;
        },
      },
      xAxis: {
        type: "category",
        data: dates,
        axisLabel: { fontFamily: "var(--font-mono)", fontSize: 10, color: "#888", interval: Math.floor(n / 8) },
        axisLine: { lineStyle: { color: "#ddd" } },
        axisTick: { show: false },
      },
      yAxis: [
        {
          type: "value",
          name: "亿元",
          nameTextStyle: { fontFamily: "var(--font-mono)", fontSize: 10, color: "#888" },
          axisLabel: { fontFamily: "var(--font-mono)", fontSize: 10, color: "#888" },
          splitLine: { lineStyle: { color: "#eee", type: "dashed" } },
          axisLine: { show: false },
          axisTick: { show: false },
        },
        {
          type: "value",
          name: "累计(亿元)",
          nameTextStyle: { fontFamily: "var(--font-mono)", fontSize: 10, color: "#888" },
          axisLabel: { fontFamily: "var(--font-mono)", fontSize: 10, color: "#888" },
          splitLine: { show: false },
          axisLine: { show: false },
          axisTick: { show: false },
        },
      ],
      series: [
        {
          name: "日净流入（亿元）",
          type: "bar",
          yAxisIndex: 0,
          data: flows.map((v) => ({
            value: v,
            itemStyle: { color: v >= 0 ? "#C41E3A" : "#2D6A4F" },
          })),
          barMaxWidth: 4,
        },
        {
          name: "累计净买入（亿元）",
          type: "line",
          yAxisIndex: 1,
          data: cumulatives,
          symbol: "none",
          lineStyle: { width: 1.5, color: "#FA541C" },
          smooth: true,
        },
      ],
    };
  }, [data]);

  if (loading) return <Placeholder h={360} msg="加载中…" />;
  if (error || !data || data.length === 0) return <Placeholder h={360} msg={`加载失败：${error}`} />;

  const last = data[data.length - 1];
  const totalDays = data.length;
  const positiveDays = data.filter((d) => d.net_flow > 0).length;
  const avgFlow = data.reduce((s, d) => s + d.net_flow, 0) / totalDays;
  const maxInflow = Math.max(...data.map((d) => d.net_flow));
  const maxOutflow = Math.min(...data.map((d) => d.net_flow));

  const stats = [
    { label: "最新累计（亿元）", value: (last.cumulative * 10000).toFixed(0) },
    { label: "日均净流入", value: `${avgFlow.toFixed(1)} 亿` },
    { label: "净流入天数占比", value: `${((positiveDays / totalDays) * 100).toFixed(0)}%`, color: "#C41E3A" },
    { label: "单日最大流入", value: `+${maxInflow.toFixed(1)} 亿`, color: "#C41E3A" },
    { label: "单日最大流出", value: `${maxOutflow.toFixed(1)} 亿`, color: "#2D6A4F" },
    { label: "数据截至", value: last.date },
  ];

  return (
    <div>
      <div style={{ display: "flex", gap: 20, marginBottom: 16, flexWrap: "wrap" }}>
        {stats.map((s) => (
          <div key={s.label}>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--text-muted)", marginBottom: 2 }}>{s.label}</div>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: 14, fontWeight: 600, color: s.color ?? "var(--text-heading)" }}>{s.value}</div>
          </div>
        ))}
      </div>
      <ReactEChartsCore echarts={echarts} option={option} style={{ height: 320 }} notMerge lazyUpdate={false} />
      <div style={{ marginTop: 6, fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--text-muted)" }}>
        红柱 = 净买入，绿柱 = 净卖出（单位：亿元）。橙线 = 历史累计净买入总额。数据来源：AkShare · 东方财富，截至 {last.date}。
      </div>
    </div>
  );
}

function Placeholder({ h, msg }: { h: number; msg: string }) {
  return <div style={{ height: h, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-muted)", fontFamily: "var(--font-mono)", fontSize: 13 }}>{msg}</div>;
}
