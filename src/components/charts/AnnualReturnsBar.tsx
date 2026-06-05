"use client";

import ReactEChartsCore from "echarts-for-react/lib/core";
import * as echarts from "echarts/core";
import { BarChart, LineChart } from "echarts/charts";
import { GridComponent, TooltipComponent, LegendComponent, DataZoomComponent } from "echarts/components";
import { CanvasRenderer } from "echarts/renderers";
import { useChartData } from "@/hooks/useChartData";
import type { AnnualReturn } from "@/types/data";

echarts.use([BarChart, LineChart, GridComponent, TooltipComponent, LegendComponent, DataZoomComponent, CanvasRenderer]);

interface Props {
  indexSlug: string;
}

export default function AnnualReturnsBar({ indexSlug }: Props) {
  const { data, loading, error } = useChartData<AnnualReturn[]>(
    indexSlug,
    "annual-returns.json"
  );

  if (loading) {
    return (
      <div style={{ height: 400, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-muted)", fontFamily: "var(--font-mono)", fontSize: 13 }}>
        加载中…
      </div>
    );
  }

  if (error || !data) {
    return (
      <div style={{ height: 400, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-muted)", fontFamily: "var(--font-mono)", fontSize: 13 }}>
        数据加载失败：{error}
      </div>
    );
  }

  const upYears = data.filter((d) => d.return_pct >= 0).length;
  const downYears = data.filter((d) => d.return_pct < 0).length;
  const avg = (data.reduce((s, d) => s + d.return_pct, 0) / data.length).toFixed(1);
  const best = data.reduce((a, b) => (a.return_pct > b.return_pct ? a : b));
  const worst = data.reduce((a, b) => (a.return_pct < b.return_pct ? a : b));

  const closes = data.map((d) => d.close ?? null);
  const hasClose = closes.some((v) => v != null);

  const option = {
    backgroundColor: "transparent",
    grid: { left: 60, right: hasClose ? 60 : 20, top: 36, bottom: 64, containLabel: true },
    legend: {
      data: hasClose ? ["年度涨跌幅", "指数点位"] : ["年度涨跌幅"],
      top: 8,
      left: 8,
      padding: 4,
      textStyle: { fontFamily: "var(--font-mono)", fontSize: 11 },
    },
    tooltip: {
      trigger: "axis",
      backgroundColor: "var(--bg-panel)",
      borderColor: "var(--border)",
      borderWidth: 1,
      textStyle: { fontFamily: "var(--font-sans)", fontSize: 13, color: "var(--text)" },
      formatter: (params: { seriesName: string; name: string; value: number | null }[]) => {
        const barP = params.find((p) => p.seriesName === "年度涨跌幅");
        const lineP = params.find((p) => p.seriesName === "指数点位");
        const sign = (barP?.value ?? 0) >= 0 ? "+" : "";
        let s = `${params[0]?.name}年<br/>涨跌幅：${sign}${barP?.value?.toFixed(1) ?? "—"}%`;
        if (lineP?.value != null) s += `<br/>收盘点位：${lineP.value.toFixed(0)}`;
        return s;
      },
    },
    xAxis: {
      type: "category",
      data: data.map((d) => String(d.year)),
      axisLabel: { fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--text-muted)", interval: 4, rotate: 45 },
      axisLine: { lineStyle: { color: "var(--border)" } },
      axisTick: { lineStyle: { color: "var(--border)" } },
    },
    yAxis: [
      {
        type: "value",
        axisLabel: { fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--text-muted)", formatter: (v: number) => `${v}%` },
        splitLine: { lineStyle: { color: "var(--grid)", type: "dashed" } },
        axisLine: { show: false },
        axisTick: { show: false },
      },
      ...(hasClose ? [{
        type: "value",
        axisLabel: { fontFamily: "var(--font-mono)", fontSize: 10, color: "#bbb" },
        splitLine: { show: false },
        axisLine: { show: false },
        axisTick: { show: false },
      }] : []),
    ],
    dataZoom: [
      { type: "inside" },
      { type: "slider", bottom: 8, height: 20, borderColor: "#ddd", fillerColor: "rgba(0,0,0,0.05)", textStyle: { fontFamily: "var(--font-mono)", fontSize: 10, color: "#aaa" } },
    ],
    series: [
      {
        name: "年度涨跌幅",
        type: "bar",
        yAxisIndex: 0,
        data: data.map((d) => ({
          value: d.return_pct,
          itemStyle: { color: d.return_pct >= 0 ? "#C41E3A" : "#2D6A4F" },
        })),
        barMaxWidth: 20,
      },
      ...(hasClose ? [{
        name: "指数点位",
        type: "line",
        yAxisIndex: 1,
        data: closes,
        symbol: "none",
        lineStyle: { width: 1.5, color: "rgba(100,100,100,0.5)" },
        connectNulls: true,
      }] : []),
    ],
  };

  return (
    <div>
      <div style={{ display: "flex", gap: 24, marginBottom: 16, flexWrap: "wrap" }}>
        {[
          { label: "上涨年", value: `${upYears} 年` },
          { label: "下跌年", value: `${downYears} 年` },
          { label: "算术均值", value: `${avg}%` },
          { label: "最佳年份", value: `${best.year} (+${best.return_pct}%)` },
          { label: "最差年份", value: `${worst.year} (${worst.return_pct}%)` },
        ].map((item) => (
          <div key={item.label}>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--text-muted)", marginBottom: 2 }}>{item.label}</div>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: 15, fontWeight: 600, color: "var(--text-heading)" }}>{item.value}</div>
          </div>
        ))}
      </div>

      <ReactEChartsCore
        echarts={echarts}
        option={option}
        style={{ height: 380 }}
        notMerge
        lazyUpdate={false}
      />
    </div>
  );
}
