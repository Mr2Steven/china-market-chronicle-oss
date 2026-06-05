"use client";

import ReactECharts from "echarts-for-react";
import { useMemo } from "react";
import { useChartData } from "@/hooks/useChartData";
import type { DailyPoint } from "@/types/data";

interface SP500Point { date: string; close: number }

export default function ChinaVsSP500Chart() {
  const hs300  = useChartData<DailyPoint[]>("hs300",  "daily.json");
  const sp500  = useChartData<SP500Point[]>("sp500",  "daily.json");

  const { dates, hs300Norm, sp500Norm } = useMemo(() => {
    if (!hs300.data || !sp500.data) return { dates: [], hs300Norm: [], sp500Norm: [] };

    const hs300Map = new Map(hs300.data.map((d) => [d.date, d.close]));
    const sp500Map = new Map(sp500.data.map((d) => [d.date, d.close]));

    // Use HS300 dates as the spine (more A-share trading days)
    // For S&P 500 on non-US trading days: forward-fill with last known close
    const sp500Dates = sp500.data.map((d) => d.date).sort();
    let lastSP = sp500.data[0].close;
    const sp500FilledMap = new Map<string, number>();
    for (const d of sp500Dates) {
      lastSP = sp500Map.get(d) ?? lastSP;
      sp500FilledMap.set(d, lastSP);
    }

    // Common start: when HS300 data begins (2005-01-04)
    const commonDates = hs300.data
      .map((d) => d.date)
      .filter((dt) => sp500FilledMap.size > 0 && dt >= sp500Dates[0])
      .sort();

    if (commonDates.length === 0) return { dates: [], hs300Norm: [], sp500Norm: [] };

    const base300 = hs300Map.get(commonDates[0])!;
    const baseSP  = sp500FilledMap.get(commonDates[0]) ?? sp500.data[0].close;

    const hs300Norm: (number | null)[] = commonDates.map((dt) => {
      const v = hs300Map.get(dt);
      return v != null ? parseFloat(((v / base300) * 100).toFixed(2)) : null;
    });

    // For S&P 500, forward-fill across HS300 dates
    let lastFill = baseSP;
    const sp500Norm: number[] = commonDates.map((dt) => {
      const v = sp500FilledMap.get(dt);
      if (v != null) lastFill = v;
      return parseFloat(((lastFill / baseSP) * 100).toFixed(2));
    });

    return { dates: commonDates, hs300Norm, sp500Norm };
  }, [hs300.data, sp500.data]);

  const loading = hs300.loading || sp500.loading;
  const error   = hs300.error   || sp500.error;

  if (loading) return <Placeholder h={340} msg="加载中…" />;
  if (error || !hs300.data || !sp500.data) return <Placeholder h={340} msg={`加载失败：${error}`} />;

  const n = dates.length;
  const hs300Last = hs300Norm[hs300Norm.length - 1];
  const sp500Last = sp500Norm[sp500Norm.length - 1];
  const diff = hs300Last != null && sp500Last != null ? (hs300Last - sp500Last) : null;

  const option = {
    backgroundColor: "transparent",
    legend: {
      data: ["沪深300", "标普500"],
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
      formatter: (params: { seriesName: string; name: string; value: number | null }[]) => {
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
        connectNulls: true,
      },
      {
        name: "标普500",
        type: "line",
        data: sp500Norm,
        symbol: "none",
        lineStyle: { width: 1.5, color: "#1890FF" },
        connectNulls: true,
      },
    ],
  };

  return (
    <div>
      <div style={{ display: "flex", gap: 24, marginBottom: 16, flexWrap: "wrap" }}>
        {[
          { label: "沪深300（当前基准）", value: `${hs300Last?.toFixed(1) ?? "—"}`, color: "#C41E3A" },
          { label: "标普500（当前基准）", value: `${sp500Last?.toFixed(1) ?? "—"}`, color: "#1890FF" },
          { label: "累计差值 (HS300 − S&P)", value: diff != null ? `${diff >= 0 ? "+" : ""}${diff.toFixed(1)}` : "—",
            color: diff != null ? (diff >= 0 ? "#C41E3A" : "#2D6A4F") : "#444" },
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
        两指数均以 {dates[0]} 收盘价归一化为 100。标普500 在 A 股非交易日以前一日收盘价填充。
      </div>
    </div>
  );
}

function Placeholder({ h, msg }: { h: number; msg: string }) {
  return <div style={{ height: h, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-muted)", fontFamily: "var(--font-mono)", fontSize: 13 }}>{msg}</div>;
}
