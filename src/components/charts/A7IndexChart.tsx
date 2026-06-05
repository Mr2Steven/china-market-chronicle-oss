"use client";

import ReactECharts from "echarts-for-react";
import { useMemo, useState } from "react";
import { useChartData } from "@/hooks/useChartData";

interface StockMeta { code: string; name: string; color: string }
interface A7Combined {
  start_date: string;
  meta: StockMeta[];
  dates: string[];
  series: Record<string, (number | null)[]>;
}

export default function A7IndexChart() {
  const { data, loading, error } = useChartData<A7Combined>("a7", "combined.json");
  const [showIndividual, setShowIndividual] = useState(true);

  const option = useMemo(() => {
    if (!data) return {};
    const { meta, dates, series } = data;
    const n = dates.length;

    const stockSeries = meta.map((m) => ({
      name: m.name,
      type: "line",
      data: series[m.code] ?? [],
      symbol: "none",
      lineStyle: { width: 1, color: m.color, opacity: showIndividual ? 0.7 : 0 },
      itemStyle: { color: m.color },
      connectNulls: true,
    }));

    const indexSeries = {
      name: "等权合成",
      type: "line",
      data: series["index"] ?? [],
      symbol: "none",
      lineStyle: { width: 2.5, color: "#111" },
      itemStyle: { color: "#111" },
      connectNulls: true,
      z: 10,
    };

    return {
      backgroundColor: "transparent",
      legend: {
        data: [...meta.map((m) => m.name), "等权合成"],
        bottom: 0,
        padding: [0, 0, 8, 0],
        textStyle: { fontFamily: "var(--font-mono)", fontSize: 10 },
        itemWidth: 12,
        itemHeight: 8,
      },
      grid: { left: 50, right: 20, top: 20, bottom: 60, containLabel: true },
      tooltip: {
        trigger: "axis",
        backgroundColor: "#fff",
        borderColor: "#ddd",
        borderWidth: 1,
        textStyle: { fontFamily: "var(--font-sans)", fontSize: 12 },
        formatter: (params: { seriesName: string; value: number | null }[]) => {
          const lines = params
            .filter((p) => p.value != null)
            .map((p) => {
              const sign = (p.value as number) >= 100 ? "+" : "";
              const rel = ((p.value as number) - 100).toFixed(1);
              return `${p.seriesName}：${(p.value as number).toFixed(1)}（${sign}${rel}%）`;
            })
            .join("<br/>");
          return lines;
        },
      },
      xAxis: {
        type: "category",
        data: dates,
        axisLabel: { fontFamily: "var(--font-mono)", fontSize: 10, color: "#888", interval: Math.floor(n / 8) },
        axisLine: { lineStyle: { color: "#ddd" } },
        axisTick: { show: false },
        boundaryGap: false,
      },
      yAxis: {
        type: "value",
        name: "基准100",
        nameTextStyle: { fontFamily: "var(--font-mono)", fontSize: 10, color: "#888" },
        axisLabel: { fontFamily: "var(--font-mono)", fontSize: 10, color: "#888" },
        splitLine: { lineStyle: { color: "#eee", type: "dashed" } },
        axisLine: { show: false },
        axisTick: { show: false },
      },
      series: [...stockSeries, indexSeries],
    };
  }, [data, showIndividual]);

  if (loading) return <Placeholder h={380} msg="加载中…" />;
  if (error || !data) return <Placeholder h={380} msg={`加载失败：${error}`} />;

  // 当前各股相对起点涨跌幅
  const lastVals = data.meta.map((m) => {
    const arr = data.series[m.code];
    const v = arr ? arr[arr.length - 1] : null;
    return { ...m, val: v };
  });
  const idxArr = data.series["index"];
  const idxLast = idxArr ? idxArr[idxArr.length - 1] : null;

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12, flexWrap: "wrap", gap: 8 }}>
        <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
          {lastVals.map((m) => {
            const rel = m.val != null ? m.val - 100 : null;
            return (
              <div key={m.code}>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--text-muted)", marginBottom: 1 }}>{m.name}</div>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: 13, fontWeight: 600, color: m.color }}>
                  {rel != null ? `${rel >= 0 ? "+" : ""}${rel.toFixed(1)}%` : "—"}
                </div>
              </div>
            );
          })}
          {idxLast != null && (
            <div>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--text-muted)", marginBottom: 1 }}>等权合成</div>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: 13, fontWeight: 700, color: "#111" }}>
                {`${(idxLast - 100) >= 0 ? "+" : ""}${(idxLast - 100).toFixed(1)}%`}
              </div>
            </div>
          )}
        </div>
        <button
          onClick={() => setShowIndividual((v) => !v)}
          style={{ fontFamily: "var(--font-mono)", fontSize: 11, padding: "3px 10px", border: "1px solid #ccc", borderRadius: 4, background: showIndividual ? "#f5f0e8" : "#fff", cursor: "pointer" }}
        >
          {showIndividual ? "隐藏个股" : "显示个股"}
        </button>
      </div>
      <ReactECharts option={option} style={{ height: 340 }} notMerge lazyUpdate={false} />
      <div style={{ marginTop: 6, fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--text-muted)" }}>
        基准：{data.start_date} 起始 = 100。黑色粗线为七只股票等权合成指数。
      </div>
    </div>
  );
}

function Placeholder({ h, msg }: { h: number; msg: string }) {
  return <div style={{ height: h, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-muted)", fontFamily: "var(--font-mono)", fontSize: 13 }}>{msg}</div>;
}
