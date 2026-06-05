"use client";

import ReactECharts from "echarts-for-react";
import { useMemo } from "react";
import { useChartData } from "@/hooks/useChartData";
import { computeReturnDistribution } from "@/lib/compute";
import type { AnnualReturn } from "@/types/data";

interface Props {
  indexSlug: string;
}

export default function ReturnDistributionChart({ indexSlug }: Props) {
  const { data, loading, error } = useChartData<AnnualReturn[]>(indexSlug, "annual-returns.json");

  const buckets = useMemo(() => {
    if (!data) return [];
    return computeReturnDistribution(data);
  }, [data]);

  const avg = useMemo(() => {
    if (!data || data.length === 0) return 0;
    return data.reduce((s, d) => s + d.return_pct, 0) / data.length;
  }, [data]);

  if (loading) return <div style={{ height: 340, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-muted)", fontFamily: "var(--font-mono)", fontSize: 13 }}>加载中…</div>;
  if (error || !data) return <div style={{ height: 340, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-muted)", fontFamily: "var(--font-mono)", fontSize: 13 }}>加载失败：{error}</div>;

  const isNegativeBucket = (range: string) => range.startsWith("-") || range.startsWith("<");

  const option = {
    backgroundColor: "transparent",
    grid: { left: 110, right: 60, top: 20, bottom: 40, containLabel: false },
    tooltip: {
      trigger: "axis",
      axisPointer: { type: "shadow" },
      backgroundColor: "var(--bg-panel)",
      borderColor: "var(--border)",
      borderWidth: 1,
      textStyle: { fontFamily: "var(--font-sans)", fontSize: 13, color: "var(--text)" },
      formatter: (params: { name: string; value: number }[]) => {
        const b = buckets.find((bkt) => bkt.range === params[0].name);
        return `${params[0].name}<br/>年数：${params[0].value}<br/>具体年份：${b?.years.join("、") ?? "—"}`;
      },
    },
    xAxis: {
      type: "value",
      name: "年数",
      nameTextStyle: { fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--text-muted)" },
      axisLabel: { fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--text-muted)" },
      splitLine: { lineStyle: { color: "var(--grid)", type: "dashed" } },
      axisLine: { show: false },
      axisTick: { show: false },
      minInterval: 1,
    },
    yAxis: {
      type: "category",
      data: buckets.map((b) => b.range),
      axisLabel: { fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--text-muted)" },
      axisLine: { lineStyle: { color: "var(--border)" } },
      axisTick: { show: false },
    },
    series: [
      {
        type: "bar",
        data: buckets.map((b) => ({
          value: b.count,
          itemStyle: { color: isNegativeBucket(b.range) ? "#2D6A4F" : "#C41E3A" },
        })),
        barMaxWidth: 28,
        label: {
          show: true,
          position: "right",
          fontFamily: "var(--font-mono)",
          fontSize: 12,
          color: "var(--text-muted)",
          formatter: (p: { value: number }) => p.value > 0 ? `${p.value}年` : "",
        },
      },
    ],
    graphic: [
      {
        type: "text",
        right: 10,
        bottom: 10,
        style: {
          text: `均值 ${avg.toFixed(1)}%`,
          fontFamily: "var(--font-mono)",
          fontSize: 11,
          fill: "var(--text-muted)",
        },
      },
    ],
  };

  return <ReactECharts option={option} style={{ height: 340 }} notMerge lazyUpdate={false} />;
}
