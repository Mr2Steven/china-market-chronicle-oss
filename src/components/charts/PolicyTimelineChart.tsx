"use client";

import ReactECharts from "echarts-for-react";
import { useMemo } from "react";
import { useChartData } from "@/hooks/useChartData";
import type { DailyPoint } from "@/types/data";

type PolicyImpact = "利好" | "利空" | "中性";

interface PolicyEvent {
  date: string;
  event: string;
  category: string;
  impact: PolicyImpact;
}

const IMPACT_COLORS: Record<PolicyImpact, string> = {
  利好: "#2D6A4F",
  利空: "#C41E3A",
  中性: "#8A8A8A",
};

function nearestTradingPoint(daily: DailyPoint[], targetDate: string): DailyPoint | undefined {
  if (daily.length === 0) return undefined;

  const target = new Date(targetDate).getTime();
  let best = daily[0];
  let bestDiff = Math.abs(new Date(best.date).getTime() - target);

  for (const point of daily) {
    const diff = Math.abs(new Date(point.date).getTime() - target);
    if (diff < bestDiff) {
      best = point;
      bestDiff = diff;
    }
  }

  return best;
}

export default function PolicyTimelineChart() {
  const daily = useChartData<DailyPoint[]>("shanghai", "daily.json");
  const events = useChartData<PolicyEvent[]>("policy", "events.json");

  const { dates, closes, eventPoints, counts } = useMemo(() => {
    if (!daily.data || !events.data) {
      return {
        dates: [],
        closes: [],
        eventPoints: [],
        counts: { positive: 0, negative: 0, neutral: 0 },
      };
    }

    const dates = daily.data.map((point) => point.date);
    const closes = daily.data.map((point) => point.close);
    const dateIndex = new Map(dates.map((date, index) => [date, index]));

    const eventPoints = events.data
      .map((event) => {
        const point = nearestTradingPoint(daily.data!, event.date);
        if (!point) return null;

        return {
          name: event.event,
          value: point.close,
          coord: [dateIndex.get(point.date) ?? 0, point.close],
          symbol: "pin",
          symbolSize: 28,
          itemStyle: { color: IMPACT_COLORS[event.impact] },
          label: { show: false },
          emphasis: {
            label: {
              show: true,
              formatter: event.event,
              position: "top",
              color: "var(--text-heading)",
              fontFamily: "var(--font-sans)",
              fontSize: 11,
              backgroundColor: "var(--bg-panel)",
              borderColor: "var(--border)",
              borderWidth: 1,
              borderRadius: 4,
              padding: [4, 6],
            },
          },
          eventDate: event.date,
          tradingDate: point.date,
          event: event.event,
          category: event.category,
          impact: event.impact,
          close: point.close,
        };
      })
      .filter((point): point is NonNullable<typeof point> => point !== null);

    return {
      dates,
      closes,
      eventPoints,
      counts: {
        positive: events.data.filter((event) => event.impact === "利好").length,
        negative: events.data.filter((event) => event.impact === "利空").length,
        neutral: events.data.filter((event) => event.impact === "中性").length,
      },
    };
  }, [daily.data, events.data]);

  const loading = daily.loading || events.loading;
  const error = daily.error || events.error;

  if (loading) return <Placeholder h={380} msg="加载中…" />;
  if (error || !daily.data || !events.data) return <Placeholder h={380} msg={`加载失败：${error}`} />;

  const option = {
    backgroundColor: "transparent",
    legend: {
      data: ["上证综指"],
      top: 8,
      left: 8,
      padding: 4,
      textStyle: { fontFamily: "var(--font-mono)", fontSize: 11 },
    },
    grid: { left: 55, right: 20, top: 40, bottom: 64, containLabel: true },
    dataZoom: [
      { type: "inside" },
      { type: "slider", bottom: 8, height: 20, borderColor: "#ddd", fillerColor: "rgba(0,0,0,0.05)", textStyle: { fontFamily: "var(--font-mono)", fontSize: 10, color: "#aaa" } },
    ],
    tooltip: {
      trigger: "item",
      backgroundColor: "var(--bg-panel)",
      borderColor: "var(--border)",
      borderWidth: 1,
      textStyle: { fontFamily: "var(--font-sans)", fontSize: 13, color: "var(--text)" },
      formatter: (params: {
        componentType: string;
        seriesName: string;
        name?: string;
        data?: {
          eventDate?: string;
          tradingDate?: string;
          event?: string;
          category?: string;
          impact?: PolicyImpact;
          close?: number;
        };
        value?: number;
      }) => {
        if (params.data?.event) {
          const data = params.data;
          const color = IMPACT_COLORS[data.impact ?? "中性"];
          return [
            `${data.eventDate}${data.tradingDate !== data.eventDate ? `（交易日 ${data.tradingDate}）` : ""}`,
            `<b>${data.event}</b>`,
            `分类：${data.category}`,
            `影响：<span style="color:${color};font-weight:600">${data.impact}</span>`,
            `上证综指：${data.close?.toFixed(0) ?? "—"}`,
          ].join("<br/>");
        }

        return `${params.name}<br/>上证综指：${typeof params.value === "number" ? params.value.toFixed(0) : "—"}`;
      },
    },
    xAxis: {
      type: "category",
      data: dates,
      axisLabel: { fontFamily: "var(--font-mono)", fontSize: 11, color: "#888", interval: Math.floor(dates.length / 8) },
      axisLine: { lineStyle: { color: "#ddd" } },
      axisTick: { show: false },
      boundaryGap: false,
    },
    yAxis: {
      type: "value",
      scale: true,
      axisLabel: { fontFamily: "var(--font-mono)", fontSize: 11, color: "#888" },
      splitLine: { lineStyle: { color: "#eee", type: "dashed" } },
      axisLine: { show: false },
      axisTick: { show: false },
    },
    series: [
      {
        name: "上证综指",
        type: "line",
        data: closes,
        symbol: "none",
        lineStyle: { width: 1.4, color: "#555" },
        areaStyle: { color: "rgba(85,85,85,0.05)" },
        markPoint: {
          symbol: "pin",
          symbolSize: 28,
          data: eventPoints,
        },
      },
    ],
  };

  return (
    <div>
      <div style={{ display: "flex", gap: 24, marginBottom: 16, flexWrap: "wrap" }}>
        {[
          { label: "政策事件", value: String(events.data.length) },
          { label: "利好", value: String(counts.positive), color: IMPACT_COLORS["利好"] },
          { label: "利空", value: String(counts.negative), color: IMPACT_COLORS["利空"] },
          { label: "中性", value: String(counts.neutral), color: IMPACT_COLORS["中性"] },
        ].map((item) => (
          <div key={item.label}>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--text-muted)", marginBottom: 2 }}>{item.label}</div>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: 15, fontWeight: 600, color: item.color ?? "var(--text-heading)" }}>{item.value}</div>
          </div>
        ))}
      </div>
      <ReactECharts option={option} style={{ height: 340 }} notMerge lazyUpdate={false} />
      <div style={{ marginTop: 6, fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--text-muted)" }}>
        绿色 = 利好，红色 = 利空，灰色 = 中性。非交易日事件会映射到最接近的上证综指交易日。
      </div>
    </div>
  );
}

function Placeholder({ h, msg }: { h: number; msg: string }) {
  return <div style={{ height: h, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-muted)", fontFamily: "var(--font-mono)", fontSize: 13 }}>{msg}</div>;
}
