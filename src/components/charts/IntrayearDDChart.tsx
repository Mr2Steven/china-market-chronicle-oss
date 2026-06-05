"use client";

import ReactECharts from "echarts-for-react";
import { useMemo } from "react";
import { useChartData } from "@/hooks/useChartData";
import type { IntrayearDD } from "@/types/data";

interface Props { indexSlug: string }

export default function IntrayearDDChart({ indexSlug }: Props) {
  const { data, loading, error } = useChartData<IntrayearDD[]>(indexSlug, "intrayear-dd.json");

  const stats = useMemo(() => {
    if (!data || data.length === 0) return null;
    const avgDD = (data.reduce((s, d) => s + d.max_intrayear_dd, 0) / data.length).toFixed(1);
    const posYears = data.filter((d) => d.full_year_return >= 0).length;
    return { avgDD, posYears, total: data.length };
  }, [data]);

  if (loading) return <Placeholder h={360} msg="加载中…" />;
  if (error || !data) return <Placeholder h={360} msg={`加载失败：${error}`} />;

  const years = data.map((d) => String(d.year));

  const option = {
    backgroundColor: "transparent",
    grid: { left: 55, right: 20, top: 20, bottom: 64, containLabel: true },
    legend: {
      bottom: 0,
      padding: [0, 0, 8, 0],
      textStyle: { fontFamily: "var(--font-sans)", fontSize: 12, color: "var(--text-muted)" },
      itemWidth: 14,
      itemHeight: 10,
    },
    tooltip: {
      trigger: "axis",
      axisPointer: { type: "shadow" },
      backgroundColor: "var(--bg-panel)",
      borderColor: "var(--border)",
      borderWidth: 1,
      textStyle: { fontFamily: "var(--font-sans)", fontSize: 13, color: "var(--text)" },
      formatter: (params: { seriesName: string; name: string; value: number }[]) => {
        const lines = params.map((p) => {
          const sign = p.value >= 0 ? "+" : "";
          return `${p.seriesName}：${sign}${p.value.toFixed(1)}%`;
        });
        return `${params[0]?.name ?? ""}<br/>${lines.join("<br/>")}`;
      },
    },
    xAxis: {
      type: "category",
      data: years,
      axisLabel: { fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--text-muted)", interval: 4, rotate: 45 },
      axisLine: { lineStyle: { color: "var(--border)" } },
      axisTick: { show: false },
    },
    yAxis: {
      type: "value",
      axisLabel: { fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--text-muted)", formatter: (v: number) => `${v}%` },
      splitLine: { lineStyle: { color: "var(--grid)", type: "dashed" } },
      axisLine: { show: false },
      axisTick: { show: false },
    },
    series: [
      {
        name: "年内最大回撤",
        type: "bar",
        data: data.map((d) => ({
          value: d.max_intrayear_dd,
          itemStyle: { color: "rgba(100,100,100,0.55)" },
        })),
        barGap: "10%",
        barMaxWidth: 14,
      },
      {
        name: "全年涨跌",
        type: "bar",
        data: data.map((d) => ({
          value: d.full_year_return,
          itemStyle: { color: d.full_year_return >= 0 ? "rgba(196,30,58,0.75)" : "rgba(45,106,79,0.75)" },
        })),
        barGap: "10%",
        barMaxWidth: 14,
      },
      // zero baseline
      {
        type: "line",
        data: Array(years.length).fill(0),
        symbol: "none",
        lineStyle: { color: "#999", width: 1 },
        silent: true,
        animation: false,
        tooltip: { show: false },
        legend: { show: false },
      },
    ],
  };

  return (
    <div>
      {stats && (
        <>
          <div style={{ display: "flex", gap: 24, marginBottom: 10, flexWrap: "wrap" }}>
            {[
              { label: "平均年内最大回撤", value: `${stats.avgDD}%` },
              { label: "全年正收益", value: `${stats.posYears} / ${stats.total} 年` },
            ].map((item) => (
              <div key={item.label}>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--text-muted)", marginBottom: 2 }}>{item.label}</div>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: 15, fontWeight: 600, color: "var(--text-heading)" }}>{item.value}</div>
              </div>
            ))}
          </div>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--text-muted)", marginBottom: 12, padding: "6px 10px", background: "var(--grid)", borderRadius: 4 }}>
            平均年内最大回撤 {stats.avgDD}%，但<strong style={{ color: "var(--text-heading)", margin: "0 4px" }}>{stats.posYears} / {stats.total} 年</strong>全年最终收正
          </div>
        </>
      )}
      <ReactECharts option={option} style={{ height: 340 }} notMerge lazyUpdate={false} />
    </div>
  );
}

function Placeholder({ h, msg }: { h: number; msg: string }) {
  return <div style={{ height: h, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-muted)", fontFamily: "var(--font-mono)", fontSize: 13 }}>{msg}</div>;
}
