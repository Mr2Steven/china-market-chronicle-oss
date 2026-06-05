"use client";

import ReactECharts from "echarts-for-react";
import { useMemo } from "react";
import { useChartData } from "@/hooks/useChartData";
import type { DailyPoint } from "@/types/data";

interface MarginPoint {
  date: string;
  margin_balance: number;
  short_balance: number;
  total: number;
}

interface ChartData {
  dates: string[];
  marginBalance: number[];
  shortBalance: number[];
  total: number[];
  shanghaiClose: (number | null)[];
  current: MarginPoint | null;
  maxMarginBalance: number | null;
}

function alignShanghaiClose(marginDates: string[], daily: DailyPoint[]): (number | null)[] {
  const sortedDaily = [...daily].sort((a, b) => a.date.localeCompare(b.date));
  let index = 0;
  let lastClose: number | null = null;

  return marginDates.map((date) => {
    while (index < sortedDaily.length && sortedDaily[index].date <= date) {
      lastClose = sortedDaily[index].close;
      index += 1;
    }
    return lastClose;
  });
}

export default function MarginBalanceChart() {
  const margin = useChartData<MarginPoint[]>("margin", "balance.json");
  const shanghai = useChartData<DailyPoint[]>("shanghai", "daily.json");

  const { dates, marginBalance, shortBalance, total, shanghaiClose, current, maxMarginBalance } = useMemo<ChartData>(() => {
    if (!margin.data || !shanghai.data) {
      return {
        dates: [],
        marginBalance: [],
        shortBalance: [],
        total: [],
        shanghaiClose: [],
        current: null,
        maxMarginBalance: null,
      };
    }

    const rows = [...margin.data].sort((a, b) => a.date.localeCompare(b.date));
    if (rows.length === 0) {
      return {
        dates: [],
        marginBalance: [],
        shortBalance: [],
        total: [],
        shanghaiClose: [],
        current: null,
        maxMarginBalance: null,
      };
    }

    const dates = rows.map((point) => point.date);
    const marginBalance = rows.map((point) => point.margin_balance);
    const shortBalance = rows.map((point) => point.short_balance);
    const total = rows.map((point) => point.total);
    const shanghaiClose = alignShanghaiClose(dates, shanghai.data);

    const current = rows[rows.length - 1] ?? null;
    const maxMarginBalance = Math.max(...marginBalance);

    return { dates, marginBalance, shortBalance, total, shanghaiClose, current, maxMarginBalance };
  }, [margin.data, shanghai.data]);

  const loading = margin.loading || shanghai.loading;
  const error = margin.error || shanghai.error;

  if (loading) return <Placeholder h={380} msg="加载中…" />;
  if (error || !margin.data || !shanghai.data) return <Placeholder h={380} msg={`加载失败：${error}`} />;

  const n = dates.length;
  const option = {
    backgroundColor: "transparent",
    legend: {
      data: ["融资余额", "上证综指"],
      bottom: 34,
      left: "center",
      padding: 4,
      textStyle: { fontFamily: "var(--font-mono)", fontSize: 11 },
    },
    grid: { left: 62, right: 62, top: 34, bottom: 88, containLabel: true },
    dataZoom: [
      { type: "inside" },
      { type: "slider", bottom: 8, height: 18, borderColor: "#ddd", fillerColor: "rgba(0,0,0,0.05)", textStyle: { fontFamily: "var(--font-mono)", fontSize: 10, color: "#aaa" } },
    ],
    tooltip: {
      trigger: "axis",
      backgroundColor: "var(--bg-panel)",
      borderColor: "var(--border)",
      borderWidth: 1,
      textStyle: { fontFamily: "var(--font-sans)", fontSize: 13, color: "var(--text)" },
      formatter: (params: { seriesName: string; name: string; value: number | null }[]) => {
        const idx = dates.indexOf(params[0]?.name ?? "");
        const marginValue = idx >= 0 ? marginBalance[idx] : null;
        const shortValue = idx >= 0 ? shortBalance[idx] : null;
        const totalValue = idx >= 0 ? total[idx] : null;
        const closeValue = idx >= 0 ? shanghaiClose[idx] : null;
        return [
          params[0]?.name,
          `融资余额：${marginValue?.toFixed(0) ?? "—"} 亿元`,
          `融券余额：${shortValue?.toFixed(0) ?? "—"} 亿元`,
          `两融合计：${totalValue?.toFixed(0) ?? "—"} 亿元`,
          `上证综指：${closeValue?.toFixed(0) ?? "—"}`,
        ].join("<br/>");
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
    yAxis: [
      {
        type: "value",
        name: "融资余额（亿元）",
        nameTextStyle: { fontFamily: "var(--font-mono)", fontSize: 10, color: "#888" },
        axisLabel: { fontFamily: "var(--font-mono)", fontSize: 11, color: "#888" },
        splitLine: { lineStyle: { color: "#eee", type: "dashed" } },
        axisLine: { show: false },
        axisTick: { show: false },
      },
      {
        type: "value",
        name: "上证综指",
        nameTextStyle: { fontFamily: "var(--font-mono)", fontSize: 10, color: "#888" },
        axisLabel: { fontFamily: "var(--font-mono)", fontSize: 11, color: "#888" },
        splitLine: { show: false },
        axisLine: { show: false },
        axisTick: { show: false },
        scale: true,
      },
    ],
    series: [
      {
        name: "融资余额",
        type: "line",
        yAxisIndex: 0,
        data: marginBalance,
        symbol: "none",
        lineStyle: { width: 1.5, color: "#1890FF" },
        areaStyle: { color: "rgba(24,144,255,0.18)" },
      },
      {
        name: "上证综指",
        type: "line",
        yAxisIndex: 1,
        data: shanghaiClose,
        symbol: "none",
        lineStyle: { width: 1.4, color: "#C41E3A" },
        connectNulls: true,
      },
    ],
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <div style={{ display: "flex", gap: "14px 28px", flexWrap: "wrap", alignItems: "flex-start" }}>
        {[
          { label: "最新融资余额", value: current ? `${current.margin_balance.toFixed(0)} 亿` : "—", color: "#1890FF" },
          { label: "最新融券余额", value: current ? `${current.short_balance.toFixed(0)} 亿` : "—" },
          { label: "两融合计", value: current ? `${current.total.toFixed(0)} 亿` : "—", color: "#C41E3A" },
          { label: "历史峰值", value: maxMarginBalance ? `${maxMarginBalance.toFixed(0)} 亿` : "—" },
        ].map((item) => (
          <div key={item.label}>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--text-muted)", marginBottom: 2 }}>{item.label}</div>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: 15, fontWeight: 600, color: item.color ?? "var(--text-heading)" }}>{item.value}</div>
          </div>
        ))}
      </div>
      <ReactECharts option={option} style={{ height: 370 }} notMerge lazyUpdate={false} />
      <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--text-muted)" }}>
        融资融券余额为沪深两市汇总，单位为亿元；上证综指按融资融券日期向前匹配最近交易日收盘价。
      </div>
    </div>
  );
}

function Placeholder({ h, msg }: { h: number; msg: string }) {
  return <div style={{ height: h, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-muted)", fontFamily: "var(--font-mono)", fontSize: 13 }}>{msg}</div>;
}
