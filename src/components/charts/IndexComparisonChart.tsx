"use client";

import ReactECharts from "echarts-for-react";
import { useMemo } from "react";
import { useChartData } from "@/hooks/useChartData";
import type { DailyPoint } from "@/types/data";

export default function IndexComparisonChart() {
  const hs300 = useChartData<DailyPoint[]>("hs300", "daily.json");
  const shanghai = useChartData<DailyPoint[]>("shanghai", "daily.json");

  const { hs300Pts, shanghaiPts, hs300Norm, shanghaiNorm, dates } = useMemo(() => {
    if (!hs300.data || !shanghai.data) return { hs300Pts: [], shanghaiPts: [], hs300Norm: [], shanghaiNorm: [], dates: [] };

    // Align by date — find common start date
    const hs300Map = new Map(hs300.data.map((d) => [d.date, d.close]));
    const shanghaiMap = new Map(shanghai.data.map((d) => [d.date, d.close]));
    const commonDates = hs300.data
      .map((d) => d.date)
      .filter((date) => shanghaiMap.has(date))
      .sort();

    if (commonDates.length === 0) return { hs300Pts: [], shanghaiPts: [], hs300Norm: [], shanghaiNorm: [], dates: [] };

    const base300 = hs300Map.get(commonDates[0])!;
    const baseSH = shanghaiMap.get(commonDates[0])!;

    const hs300Norm = commonDates.map((d) => parseFloat(((hs300Map.get(d)! / base300) * 100).toFixed(2)));
    const shanghaiNorm = commonDates.map((d) => parseFloat(((shanghaiMap.get(d)! / baseSH) * 100).toFixed(2)));

    return { hs300Pts: hs300.data, shanghaiPts: shanghai.data, hs300Norm, shanghaiNorm, dates: commonDates };
  }, [hs300.data, shanghai.data]);

  const loading = hs300.loading || shanghai.loading;
  const error = hs300.error || shanghai.error;

  if (loading) return <Placeholder h={340} msg="加载中（双指数日线数据）…" />;
  if (error || !hs300.data || !shanghai.data) return <Placeholder h={340} msg={`加载失败：${error}`} />;

  const n = dates.length;
  const hs300Last = hs300Norm[hs300Norm.length - 1];
  const shLast = shanghaiNorm[shanghaiNorm.length - 1];
  const diff = hs300Last != null && shLast != null ? (hs300Last - shLast).toFixed(1) : "—";

  const option = {
    backgroundColor: "transparent",
    grid: { left: 55, right: 20, top: 36, bottom: 64, containLabel: true },
    dataZoom: [
      { type: "inside" },
      { type: "slider", bottom: 8, height: 20, borderColor: "#ddd", fillerColor: "rgba(0,0,0,0.05)", textStyle: { fontFamily: "var(--font-mono)", fontSize: 10, color: "#aaa" } },
    ],
    legend: {
      data: ["沪深300", "上证综指"],
      top: 8,
      right: 8,
      padding: 4,
      textStyle: { fontFamily: "var(--font-mono)", fontSize: 11 },
    },
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
        name: "沪深300",
        type: "line",
        data: hs300Norm,
        symbol: "none",
        lineStyle: { width: 1.5, color: "#C41E3A" },
        connectNulls: false,
      },
      {
        name: "上证综指",
        type: "line",
        data: shanghaiNorm,
        symbol: "none",
        lineStyle: { width: 1.5, color: "#2D6A4F" },
        connectNulls: false,
      },
    ],
  };

  return (
    <div>
      <div style={{ display: "flex", gap: 24, marginBottom: 16, flexWrap: "wrap" }}>
        {[
          { label: "沪深300（当前基准）", value: `${hs300Last?.toFixed(1) ?? "—"}` },
          { label: "上证综指（当前基准）", value: `${shLast?.toFixed(1) ?? "—"}` },
          { label: "累计差值 (HS300 − SH)", value: diff, color: Number(diff) >= 0 ? "#C41E3A" : "#2D6A4F" },
          { label: "基准起点", value: dates[0] ?? "—" },
        ].map((item) => (
          <div key={item.label}>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--text-muted)", marginBottom: 2 }}>{item.label}</div>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: 15, fontWeight: 600, color: item.color ?? "var(--text-heading)" }}>{item.value}</div>
          </div>
        ))}
      </div>
      <ReactECharts option={option} style={{ height: 300 }} notMerge lazyUpdate={false} />
      <div style={{ marginTop: 8, fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--text-muted)" }}>
        两指数均以共同起始日收盘价归一化为 100，方便对比相对表现。
      </div>
    </div>
  );
}

function Placeholder({ h, msg }: { h: number; msg: string }) {
  return <div style={{ height: h, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-muted)", fontFamily: "var(--font-mono)", fontSize: 13 }}>{msg}</div>;
}
