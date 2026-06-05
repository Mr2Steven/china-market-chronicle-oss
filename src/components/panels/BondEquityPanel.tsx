"use client";

import ReactECharts from "echarts-for-react";
import { useMemo } from "react";
import { useChartData } from "@/hooks/useChartData";

interface BondEquityData {
  dates: string[];
  yield_10y: number[];
  earnings_yield: number[];
  erp: number[];
  erp_mean: number;
  erp_std: number;
  erp_plus1std: number;
  erp_minus1std: number;
}

function pct(value: number | null | undefined): string {
  if (typeof value !== "number" || Number.isNaN(value)) return "—";
  return `${(value * 100).toFixed(2)}%`;
}

export default function BondEquityPanel() {
  const { data, loading, error } = useChartData<BondEquityData>("bond_equity", "data.json");

  const stats = useMemo(() => {
    if (!data || data.erp.length === 0) {
      return { currentErp: null, zScore: null };
    }
    const currentErp = data.erp[data.erp.length - 1];
    const zScore = data.erp_std > 0 ? (currentErp - data.erp_mean) / data.erp_std : null;
    return { currentErp, zScore };
  }, [data]);

  const option = useMemo(() => {
    if (!data) return null;
    const n = data.dates.length;
    const mean = Array(n).fill(data.erp_mean);
    const plus = Array(n).fill(data.erp_plus1std);
    const minus = Array(n).fill(data.erp_minus1std);
    const bandHeight = Array(n).fill(data.erp_plus1std - data.erp_minus1std);

    return {
      backgroundColor: "transparent",
      legend: {
        data: ["ERP", "历史均值", "均值+1σ", "均值-1σ"],
        top: 4,
        left: "center",
        textStyle: { fontFamily: "var(--font-mono)", fontSize: 11 },
      },
      grid: { left: 56, right: 24, top: 46, bottom: 64, containLabel: true },
      dataZoom: [
        { type: "inside" },
        { type: "slider", bottom: 8, height: 20, borderColor: "#ddd", fillerColor: "rgba(0,0,0,0.05)", textStyle: { fontFamily: "var(--font-mono)", fontSize: 10, color: "#aaa" } },
      ],
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
            `ERP：${pct(data.erp[idx])}`,
            `10年国债收益率：${pct(data.yield_10y[idx])}`,
            `沪深300隐含收益率：${pct(data.earnings_yield[idx])}`,
          ].join("<br/>");
        },
      },
      xAxis: {
        type: "category",
        data: data.dates,
        axisLabel: { fontFamily: "var(--font-mono)", fontSize: 11, color: "#888", interval: Math.floor(n / 8) },
        axisLine: { lineStyle: { color: "#ddd" } },
        axisTick: { show: false },
        boundaryGap: false,
      },
      yAxis: {
        type: "value",
        axisLabel: {
          fontFamily: "var(--font-mono)",
          fontSize: 11,
          color: "#888",
          formatter: (value: number) => `${(value * 100).toFixed(1)}%`,
        },
        splitLine: { lineStyle: { color: "#eee", type: "dashed" } },
      },
      series: [
        {
          name: "band-base",
          type: "line",
          stack: "confidence-band",
          data: minus,
          symbol: "none",
          lineStyle: { opacity: 0 },
          areaStyle: { opacity: 0 },
          silent: true,
          tooltip: { show: false },
        },
        {
          name: "band-range",
          type: "line",
          stack: "confidence-band",
          data: bandHeight,
          symbol: "none",
          lineStyle: { opacity: 0 },
          areaStyle: { color: "rgba(148,163,184,0.14)" },
          silent: true,
          tooltip: { show: false },
        },
        {
          name: "ERP",
          type: "line",
          data: data.erp,
          symbol: "none",
          lineStyle: { width: 2, color: "rgba(37,99,235,0.92)" },
          itemStyle: { color: "rgba(37,99,235,0.92)" },
          z: 4,
        },
        {
          name: "历史均值",
          type: "line",
          data: mean,
          symbol: "none",
          lineStyle: { color: "#71717A", width: 1, type: "dashed" },
          silent: true,
          tooltip: { show: false },
        },
        {
          name: "均值+1σ",
          type: "line",
          data: plus,
          symbol: "none",
          lineStyle: { color: "#A1A1AA", width: 1, type: "dashed" },
          silent: true,
          tooltip: { show: false },
        },
        {
          name: "均值-1σ",
          type: "line",
          data: minus,
          symbol: "none",
          lineStyle: { color: "#A1A1AA", width: 1, type: "dashed" },
          silent: true,
          tooltip: { show: false },
        },
      ],
    };
  }, [data]);

  if (loading) return <Placeholder h={360} msg="加载中…" />;
  if (error || !data || !option) return <Placeholder h={360} msg={`加载失败：${error}`} />;

  const zScoreText = stats.zScore == null ? "—" : `${stats.zScore >= 0 ? "+" : ""}${stats.zScore.toFixed(2)}σ 偏离`;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "flex", gap: "14px 28px", flexWrap: "wrap", alignItems: "flex-start" }}>
        {[
          { label: "当前 ERP", value: pct(stats.currentErp), color: "rgba(37,99,235,0.92)" },
          { label: "历史均值", value: `${pct(data.erp_mean)}（${zScoreText}）` },
        ].map((item) => (
          <div key={item.label}>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--text-muted)", marginBottom: 2 }}>{item.label}</div>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: 15, fontWeight: 600, color: item.color ?? "var(--text-heading)" }}>{item.value}</div>
          </div>
        ))}
      </div>
      <ReactECharts option={option} style={{ height: 360 }} notMerge lazyUpdate={false} />
      <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--text-muted)", lineHeight: 1.6 }}>
        ERP = 沪深300隐含收益率（1/PE）- 中国10年期国债收益率。数值越高，股票相对债券越便宜。
      </div>
    </div>
  );
}

function Placeholder({ h, msg }: { h: number; msg: string }) {
  return <div style={{ height: h, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-muted)", fontFamily: "var(--font-mono)", fontSize: 13 }}>{msg}</div>;
}
