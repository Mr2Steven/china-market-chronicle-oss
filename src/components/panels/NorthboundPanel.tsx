"use client";

import ReactECharts from "echarts-for-react";
import { useMemo, useState } from "react";
import { useChartData } from "@/hooks/useChartData";

interface NorthboundData {
  dates: string[];
  sh_net: number[];
  sz_net: number[];
  total_net: number[];
  cumulative: number[];
  sh_close: number[];
}

type Tab = "daily" | "cumulative";

function fmt(value: number | null | undefined, digits = 1): string {
  if (typeof value !== "number" || Number.isNaN(value)) return "—";
  return `${value >= 0 ? "+" : ""}${value.toFixed(digits)}`;
}

function plain(value: number | null | undefined, digits = 1): string {
  if (typeof value !== "number" || Number.isNaN(value)) return "—";
  return value.toFixed(digits);
}

function parseDate(date: string): Date {
  return new Date(`${date}T00:00:00`);
}

function weekStart(date: string): string {
  const d = parseDate(date);
  const day = d.getDay() === 0 ? 7 : d.getDay();
  d.setDate(d.getDate() - day + 1);
  return d.toISOString().slice(0, 10);
}

export default function NorthboundPanel() {
  const { data, loading, error } = useChartData<NorthboundData>("northbound", "data.json");
  const [tab, setTab] = useState<Tab>("daily");

  const prepared = useMemo(() => {
    if (!data || data.dates.length === 0) return null;
    const lastIndex = data.dates.length - 1;
    const lastDate = data.dates[lastIndex];
    const startOfWeek = weekStart(lastDate);
    const monthPrefix = lastDate.slice(0, 7);
    const sumByDate = (predicate: (date: string) => boolean) =>
      data.dates.reduce((sum, date, index) => sum + (predicate(date) ? data.total_net[index] : 0), 0);

    return {
      lastIndex,
      lastDate,
      todayNet: data.total_net[lastIndex],
      weekNet: sumByDate((date) => date >= startOfWeek),
      monthNet: sumByDate((date) => date.startsWith(monthPrefix)),
      cumulative: data.cumulative[lastIndex],
    };
  }, [data]);

  const option = useMemo(() => {
    if (!data || !prepared) return null;
    const n = data.dates.length;
    const base = {
      backgroundColor: "transparent",
      color: ["#C41E3A", "#6B7280"],
      legend: {
        top: 4,
        left: "center",
        textStyle: { fontFamily: "var(--font-mono)", fontSize: 11 },
      },
      grid: { left: 56, right: 56, top: 46, bottom: 64, containLabel: true },
      dataZoom: [
        { type: "inside" },
        { type: "slider", bottom: 8, height: 20, borderColor: "#ddd", fillerColor: "rgba(0,0,0,0.05)", textStyle: { fontFamily: "var(--font-mono)", fontSize: 10, color: "#aaa" } },
      ],
      xAxis: {
        type: "category",
        data: data.dates,
        axisLabel: { fontFamily: "var(--font-mono)", fontSize: 11, color: "#888", interval: Math.floor(n / 8) },
        axisLine: { lineStyle: { color: "#ddd" } },
        axisTick: { show: false },
        boundaryGap: tab === "daily",
      },
      yAxis: [
        {
          type: "value",
          name: "亿元",
          nameTextStyle: { fontFamily: "var(--font-mono)", fontSize: 10, color: "#888" },
          axisLabel: { fontFamily: "var(--font-mono)", fontSize: 11, color: "#888" },
          splitLine: { lineStyle: { color: "#eee", type: "dashed" } },
        },
        {
          type: "value",
          name: "上证综指",
          nameTextStyle: { fontFamily: "var(--font-mono)", fontSize: 10, color: "#888" },
          axisLabel: { fontFamily: "var(--font-mono)", fontSize: 11, color: "#888" },
          splitLine: { show: false },
        },
      ],
    };

    if (tab === "daily") {
      return {
        ...base,
        legend: { ...base.legend, data: ["北向净买入", "上证综指"] },
        tooltip: {
          trigger: "axis",
          backgroundColor: "var(--bg-panel)",
          borderColor: "var(--border)",
          borderWidth: 1,
          textStyle: { fontFamily: "var(--font-sans)", fontSize: 13, color: "var(--text)" },
          formatter: (params: { name: string }[]) => {
            const date = params[0]?.name ?? "";
            const idx = data.dates.indexOf(date);
            return [
              date,
              `北向合计：${fmt(data.total_net[idx])} 亿元`,
              `沪股通：${fmt(data.sh_net[idx])} 亿元`,
              `深股通：${fmt(data.sz_net[idx])} 亿元`,
              `上证综指：${plain(data.sh_close[idx], 2)}`,
            ].join("<br/>");
          },
        },
        series: [
          {
            name: "北向净买入",
            type: "bar",
            yAxisIndex: 0,
            data: data.total_net.map((value) => ({
              value,
              itemStyle: { color: value >= 0 ? "#C41E3A" : "#2D6A4F" },
            })),
            barMaxWidth: 6,
          },
          {
            name: "上证综指",
            type: "line",
            yAxisIndex: 1,
            data: data.sh_close,
            symbol: "none",
            lineStyle: { width: 1.5, color: "var(--accent)" },
            smooth: true,
          },
        ],
      };
    }

    return {
      ...base,
      legend: { ...base.legend, data: ["累计净买入", "上证综指"] },
      tooltip: {
        trigger: "axis",
        backgroundColor: "var(--bg-panel)",
        borderColor: "var(--border)",
        borderWidth: 1,
        textStyle: { fontFamily: "var(--font-sans)", fontSize: 13, color: "var(--text)" },
        formatter: (params: { name: string }[]) => {
          const date = params[0]?.name ?? "";
          const idx = data.dates.indexOf(date);
          return [
            date,
            `累计净买入：${plain(data.cumulative[idx])} 亿元`,
            `当日净买入：${fmt(data.total_net[idx])} 亿元`,
            `上证综指：${plain(data.sh_close[idx], 2)}`,
          ].join("<br/>");
        },
      },
      series: [
        {
          name: "累计净买入",
          type: "line",
          yAxisIndex: 0,
          data: data.cumulative,
          symbol: "none",
          lineStyle: { width: 2, color: "#C41E3A" },
          areaStyle: { color: "rgba(196,30,58,0.14)" },
          smooth: true,
        },
        {
          name: "上证综指",
          type: "line",
          yAxisIndex: 1,
          data: data.sh_close,
          symbol: "none",
          lineStyle: { width: 1.5, color: "var(--accent)" },
          smooth: true,
        },
      ],
    };
  }, [data, prepared, tab]);

  if (loading) return <Placeholder h={390} msg="加载中…" />;
  if (error || !data || !prepared || !option) return <Placeholder h={390} msg={`加载失败：${error}`} />;

  const kpis = [
    { label: "今日净买入", value: `${fmt(prepared.todayNet)} 亿`, color: prepared.todayNet >= 0 ? "#C41E3A" : "#2D6A4F" },
    { label: "本周累计", value: `${fmt(prepared.weekNet)} 亿`, color: prepared.weekNet >= 0 ? "#C41E3A" : "#2D6A4F" },
    { label: "本月累计", value: `${fmt(prepared.monthNet)} 亿`, color: prepared.monthNet >= 0 ? "#C41E3A" : "#2D6A4F" },
    { label: "历史累计", value: `${plain(prepared.cumulative, 0)} 亿`, color: "var(--text-heading)" },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "flex", gap: "14px 28px", flexWrap: "wrap", alignItems: "flex-start" }}>
        {kpis.map((item) => (
          <div key={item.label}>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--text-muted)", marginBottom: 2 }}>{item.label}</div>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: 15, fontWeight: 600, color: item.color }}>{item.value}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "inline-flex", alignSelf: "flex-start", border: "1px solid var(--border)", borderRadius: 6, overflow: "hidden" }}>
        {[
          { key: "daily" as const, label: "每日净流入" },
          { key: "cumulative" as const, label: "累计净流入" },
        ].map((item) => (
          <button
            key={item.key}
            type="button"
            onClick={() => setTab(item.key)}
            style={{
              padding: "6px 12px",
              border: 0,
              borderRight: item.key === "daily" ? "1px solid var(--border)" : 0,
              background: tab === item.key ? "var(--bg-subtle)" : "transparent",
              color: tab === item.key ? "var(--text-heading)" : "var(--text-muted)",
              fontFamily: "var(--font-mono)",
              fontSize: 12,
              cursor: "pointer",
            }}
          >
            {item.label}
          </button>
        ))}
      </div>

      <ReactECharts option={option} style={{ height: 390 }} notMerge lazyUpdate={false} />
      <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--text-muted)", lineHeight: 1.6 }}>
        红柱 = 净买入，绿柱 = 净卖出；累计值从数据起始日累加。数据截至 {prepared.lastDate}。
      </div>
    </div>
  );
}

function Placeholder({ h, msg }: { h: number; msg: string }) {
  return <div style={{ height: h, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-muted)", fontFamily: "var(--font-mono)", fontSize: 13 }}>{msg}</div>;
}
