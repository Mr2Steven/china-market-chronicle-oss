"use client";

import ReactECharts from "echarts-for-react";
import { useMemo } from "react";
import { useChartData } from "@/hooks/useChartData";
import type { DailyPoint } from "@/types/data";

export default function HSIvsHS300Chart() {
  const hsi    = useChartData<DailyPoint[]>("hsi",   "daily.json");
  const hs300  = useChartData<DailyPoint[]>("hs300", "daily.json");

  const { dates, hsiNorm, hs300Norm } = useMemo(() => {
    if (!hsi.data || !hs300.data) return { dates: [], hsiNorm: [], hs300Norm: [] };

    const hsiMap   = new Map(hsi.data.map((d) => [d.date, d.close]));
    const hs300Map = new Map(hs300.data.map((d) => [d.date, d.close]));

    // Common dates
    const commonDates = hsi.data
      .map((d) => d.date)
      .filter((dt) => hs300Map.has(dt))
      .sort();

    if (commonDates.length === 0) return { dates: [], hsiNorm: [], hs300Norm: [] };

    const baseHSI   = hsiMap.get(commonDates[0])!;
    const baseHS300 = hs300Map.get(commonDates[0])!;

    const hsiNorm   = commonDates.map((dt) => parseFloat(((hsiMap.get(dt)!   / baseHSI)   * 100).toFixed(2)));
    const hs300Norm = commonDates.map((dt) => parseFloat(((hs300Map.get(dt)! / baseHS300) * 100).toFixed(2)));

    return { dates: commonDates, hsiNorm, hs300Norm };
  }, [hsi.data, hs300.data]);

  const loading = hsi.loading || hs300.loading;
  const error   = hsi.error   || hs300.error;

  if (loading) return <Placeholder h={340} msg="加载中…" />;
  if (error || !hsi.data || !hs300.data) return <Placeholder h={340} msg={`加载失败：${error}`} />;

  const n = dates.length;
  const hsiLast   = hsiNorm[hsiNorm.length - 1];
  const hs300Last = hs300Norm[hs300Norm.length - 1];
  const diff = hsiLast != null && hs300Last != null ? (hsiLast - hs300Last) : null;

  const option = {
    backgroundColor: "transparent",
    legend: {
      data: ["恒生指数", "沪深300"],
      top: 8,
      right: 8,
      padding: 4,
      textStyle: { fontFamily: "var(--font-mono)", fontSize: 11 },
    },
    grid: { left: 55, right: 20, top: 36, bottom: 64, containLabel: true },
    dataZoom: [
      { type: "inside" },
      { type: "slider", bottom: 8, height: 20, borderColor: "#ddd", fillerColor: "rgba(0,0,0,0.05)", textStyle: { fontFamily: "var(--font-mono)", fontSize: 10, color: "#aaa" } },
    ],
    tooltip: {
      trigger: "axis",
      backgroundColor: "#fff",
      borderColor: "#ddd",
      borderWidth: 1,
      textStyle: { fontFamily: "var(--font-sans)", fontSize: 13 },
      formatter: (params: { seriesName: string; name: string; value: number }[]) => {
        const lines = params.map((p) => `${p.seriesName}：${p.value?.toFixed(1) ?? "—"}`).join("<br/>");
        return `${params[0]?.name}<br/>${lines}`;
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
    yAxis: {
      type: "value",
      name: "基准100",
      nameTextStyle: { fontFamily: "var(--font-mono)", fontSize: 10, color: "#888" },
      axisLabel: { fontFamily: "var(--font-mono)", fontSize: 11, color: "#888" },
      splitLine: { lineStyle: { color: "#eee", type: "dashed" } },
      axisLine: { show: false },
      axisTick: { show: false },
    },
    series: [
      {
        name: "恒生指数",
        type: "line",
        data: hsiNorm,
        symbol: "none",
        lineStyle: { width: 1.5, color: "#722ED1" },
        connectNulls: false,
      },
      {
        name: "沪深300",
        type: "line",
        data: hs300Norm,
        symbol: "none",
        lineStyle: { width: 1.5, color: "#C41E3A" },
        connectNulls: false,
      },
    ],
  };

  return (
    <div>
      <div style={{ display: "flex", gap: 24, marginBottom: 16, flexWrap: "wrap" }}>
        {[
          { label: "恒生指数（当前基准）", value: `${hsiLast?.toFixed(1) ?? "—"}`, color: "#722ED1" },
          { label: "沪深300（当前基准）",  value: `${hs300Last?.toFixed(1) ?? "—"}`, color: "#C41E3A" },
          { label: "累计差值 (HSI − HS300)", value: diff != null ? `${diff >= 0 ? "+" : ""}${diff.toFixed(1)}` : "—",
            color: diff != null ? (diff >= 0 ? "#722ED1" : "#C41E3A") : "#444" },
          { label: "共同起始日", value: dates[0] ?? "—" },
        ].map((item) => (
          <div key={item.label}>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--text-muted)", marginBottom: 2 }}>{item.label}</div>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: 15, fontWeight: 600, color: item.color ?? "var(--text-heading)" }}>{item.value}</div>
          </div>
        ))}
      </div>
      <ReactECharts option={option} style={{ height: 300 }} notMerge lazyUpdate={false} />
      <div style={{ marginTop: 6, fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--text-muted)" }}>
        两指数均以共同起始日（{dates[0]}）收盘价归一化为 100。紫色 = 恒生，红色 = 沪深300。
      </div>
    </div>
  );
}

function Placeholder({ h, msg }: { h: number; msg: string }) {
  return <div style={{ height: h, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-muted)", fontFamily: "var(--font-mono)", fontSize: 13 }}>{msg}</div>;
}
