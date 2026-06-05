"use client";

import ReactEChartsCore from "echarts-for-react/lib/core";
import * as echarts from "echarts/core";
import { HeatmapChart } from "echarts/charts";
import { GridComponent, TooltipComponent, VisualMapComponent } from "echarts/components";
import { CanvasRenderer } from "echarts/renderers";
import { useMemo } from "react";
import { useChartData } from "@/hooks/useChartData";
import type { MonthlyMatrix } from "@/types/data";

echarts.use([HeatmapChart, GridComponent, TooltipComponent, VisualMapComponent, CanvasRenderer]);

const MONTHS = ["1月", "2月", "3月", "4月", "5月", "6月", "7月", "8月", "9月", "10月", "11月", "12月"];

interface Props { indexSlug: string }

export default function MonthlyHeatmapChart({ indexSlug }: Props) {
  const { data, loading, error } = useChartData<MonthlyMatrix>(indexSlug, "monthly.json");

  const { heatData, years } = useMemo(() => {
    if (!data) return { heatData: [], years: [] as string[] };
    const yrs = data.matrix.map((r) => String(r.year));
    const pts = [] as object[];
    for (const row of data.matrix) {
      for (let m = 0; m < 12; m++) {
        const val = row.months[m];
        if (val == null) continue;
        const absV = Math.abs(val);
        const textColor = absV > 9 ? "#FFFFFF" : val >= 0 ? "#C41E3A" : "#2D6A4F";
        pts.push({
          value: [m, String(row.year), val],
          label: {
            show: true,
            fontFamily: "JetBrains Mono, Fira Code, monospace",
            fontSize: 9,
            color: textColor,
            formatter: () => `${val >= 0 ? "+" : ""}${val.toFixed(1)}`,
          },
        });
      }
    }
    return { heatData: pts, years: yrs };
  }, [data]);

  if (loading) return <Placeholder h={500} msg="加载中…" />;
  if (error || !data) return <Placeholder h={500} msg={`加载失败：${error}`} />;

  const chartHeight = Math.max(300, years.length * 14 + 60);

  const option = {
    backgroundColor: "transparent",
    grid: { left: 50, right: 20, top: 10, bottom: 50, containLabel: true },
    tooltip: {
      trigger: "item",
      backgroundColor: "var(--bg-panel)",
      borderColor: "var(--border)",
      borderWidth: 1,
      textStyle: { fontFamily: "var(--font-sans)", fontSize: 13, color: "var(--text)" },
      formatter: (p: { value: [number, string, number] }) => {
        const [mi, yr, val] = p.value;
        const sign = val >= 0 ? "+" : "";
        return `${yr}年 ${MONTHS[mi]}<br/>涨跌：${sign}${val.toFixed(2)}%`;
      },
    },
    xAxis: {
      type: "category",
      data: MONTHS,
      position: "top",
      axisLabel: { fontFamily: "var(--font-sans)", fontSize: 11, color: "var(--text-muted)" },
      axisLine: { show: false },
      axisTick: { show: false },
      splitLine: { show: false },
    },
    yAxis: {
      type: "category",
      data: years,
      inverse: true,
      axisLabel: { fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--text-muted)" },
      axisLine: { show: false },
      axisTick: { show: false },
      splitLine: { show: false },
    },
    visualMap: {
      show: false,
      type: "continuous",
      min: -15,
      max: 15,
      inRange: { color: ["#2D6A4F", "#F5F0E8", "#C41E3A"] },
    },
    series: [
      {
        type: "heatmap",
        data: heatData,
        itemStyle: { borderWidth: 1, borderColor: "var(--bg)" },
        emphasis: { itemStyle: { shadowBlur: 4, shadowColor: "rgba(0,0,0,0.15)" } },
      },
    ],
  };

  const summary = data.summary;

  return (
    <div>
      <ReactEChartsCore
        echarts={echarts}
        option={option}
        style={{ height: chartHeight }}
        notMerge
        lazyUpdate={false}
      />

      {/* Summary rows */}
      <div style={{ marginTop: 8, overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: "var(--font-mono)", fontSize: 11 }}>
          <thead>
            <tr>
              <th style={{ textAlign: "left", color: "var(--text-muted)", padding: "4px 6px", minWidth: 50 }}></th>
              {MONTHS.map((m) => (
                <th key={m} style={{ textAlign: "center", color: "var(--text-muted)", padding: "4px 4px", minWidth: 36 }}>{m}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={{ color: "var(--text-muted)", padding: "4px 6px", whiteSpace: "nowrap" }}>月均值</td>
              {summary.avg.map((v, i) => (
                <td key={i} style={{
                  textAlign: "center",
                  padding: "3px 4px",
                  color: v == null ? "var(--text-muted)" : v >= 0 ? "var(--up)" : "var(--down)",
                  fontWeight: 600,
                }}>
                  {v == null ? "—" : `${v >= 0 ? "+" : ""}${v.toFixed(1)}`}
                </td>
              ))}
            </tr>
            <tr>
              <td style={{ color: "var(--text-muted)", padding: "4px 6px", whiteSpace: "nowrap" }}>胜率</td>
              {summary.win_rate.map((v, i) => (
                <td key={i} style={{
                  textAlign: "center",
                  padding: "3px 4px",
                  color: v == null ? "var(--text-muted)" : v >= 0.5 ? "var(--up)" : "var(--down)",
                }}>
                  {v == null ? "—" : `${(v * 100).toFixed(0)}%`}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Placeholder({ h, msg }: { h: number; msg: string }) {
  return <div style={{ height: h, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-muted)", fontFamily: "var(--font-mono)", fontSize: 13 }}>{msg}</div>;
}
