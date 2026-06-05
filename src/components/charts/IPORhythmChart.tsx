"use client";

import ReactECharts from "echarts-for-react";
import { useMemo } from "react";
import { useChartData } from "@/hooks/useChartData";

interface MonthlyIPO { month: string; count: number }

export default function IPORhythmChart() {
  const { data, loading, error } = useChartData<MonthlyIPO[]>("ipo", "monthly.json");

  const option = useMemo(() => {
    if (!data || data.length === 0) return {};

    const months = data.map((d) => d.month);
    const counts = data.map((d) => d.count);
    const maxCount = Math.max(...counts);

    return {
      backgroundColor: "transparent",
      grid: { left: 50, right: 20, top: 20, bottom: 60, containLabel: true },
      tooltip: {
        trigger: "axis",
        axisPointer: { type: "shadow" },
        backgroundColor: "#fff",
        borderColor: "#ddd",
        borderWidth: 1,
        textStyle: { fontFamily: "var(--font-sans)", fontSize: 13 },
        formatter: (params: { name: string; value: number }[]) =>
          `${params[0].name}<br/>新股申购：${params[0].value} 只`,
      },
      xAxis: {
        type: "category",
        data: months,
        axisLabel: {
          fontFamily: "var(--font-mono)",
          fontSize: 10,
          color: "#888",
          rotate: 45,
          interval: 2,
        },
        axisLine: { lineStyle: { color: "#ddd" } },
        axisTick: { show: false },
      },
      yAxis: {
        type: "value",
        name: "只数",
        nameTextStyle: { fontFamily: "var(--font-mono)", fontSize: 10, color: "#888" },
        axisLabel: { fontFamily: "var(--font-mono)", fontSize: 11, color: "#888" },
        splitLine: { lineStyle: { color: "#eee", type: "dashed" } },
        axisLine: { show: false },
        axisTick: { show: false },
      },
      series: [
        {
          type: "bar",
          data: counts.map((v) => ({
            value: v,
            itemStyle: {
              color: v >= maxCount * 0.8 ? "#C41E3A" :
                     v >= maxCount * 0.5 ? "#FA8C16" : "#ADC6FF",
            },
          })),
          barMaxWidth: 28,
          label: {
            show: true,
            position: "top",
            fontFamily: "var(--font-mono)",
            fontSize: 10,
            color: "#666",
            formatter: (p: { value: number }) => p.value > 0 ? String(p.value) : "",
          },
        },
      ],
    };
  }, [data]);

  if (loading) return <Placeholder h={340} msg="加载中…" />;
  if (error || !data || data.length === 0) return <Placeholder h={340} msg={`加载失败：${error}`} />;

  const total = data.reduce((s, d) => s + d.count, 0);
  const avg = (total / data.length).toFixed(1);
  const maxMonth = data.reduce((a, b) => a.count > b.count ? a : b);
  const minMonth = data.reduce((a, b) => a.count < b.count ? a : b);

  return (
    <div>
      <div style={{ display: "flex", gap: 24, marginBottom: 16, flexWrap: "wrap" }}>
        {[
          { label: "统计区间", value: `${data[0].month} ~ ${data[data.length - 1].month}` },
          { label: "累计新股数", value: `${total} 只` },
          { label: "月均新股数", value: `${avg} 只` },
          { label: "最多单月", value: `${maxMonth.month}（${maxMonth.count}只）`, color: "#C41E3A" },
          { label: "最少单月", value: `${minMonth.month}（${minMonth.count}只）`, color: "#2D6A4F" },
        ].map((s) => (
          <div key={s.label}>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--text-muted)", marginBottom: 2 }}>{s.label}</div>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: 14, fontWeight: 600, color: s.color ?? "var(--text-heading)" }}>{s.value}</div>
          </div>
        ))}
      </div>
      <ReactECharts option={option} style={{ height: 300 }} notMerge lazyUpdate={false} />
      <div style={{ marginTop: 6, fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--text-muted)" }}>
        按申购日期统计。红色 = 当月 IPO 数 ≥ 历史峰值 80%，橙色 = ≥ 50%。数据来源：AkShare · 巨潮资讯。
      </div>
    </div>
  );
}

function Placeholder({ h, msg }: { h: number; msg: string }) {
  return <div style={{ height: h, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-muted)", fontFamily: "var(--font-mono)", fontSize: 13 }}>{msg}</div>;
}
