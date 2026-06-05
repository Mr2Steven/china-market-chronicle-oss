"use client";

import ReactEChartsCore from "echarts-for-react/lib/core";
import * as echarts from "echarts/core";
import { ScatterChart } from "echarts/charts";
import { GridComponent, TooltipComponent, DataZoomComponent } from "echarts/components";
import { CanvasRenderer } from "echarts/renderers";
import { useMemo, useState } from "react";
import { useChartData } from "@/hooks/useChartData";

echarts.use([ScatterChart, GridComponent, TooltipComponent, DataZoomComponent, CanvasRenderer]);

interface StockDetail {
  code: string;
  name: string;
  weight: number;
  industry: string;
  market_cap_bn: number | null;
  ytd_return: number | null;
}

export default function ConstituentScatterChart() {
  const { data, loading, error } = useChartData<StockDetail[]>("hs300", "constituents-detail.json");
  const [highlight, setHighlight] = useState<string | null>(null);

  const { option, industries, stats } = useMemo(() => {
    if (!data) return { option: {}, industries: [] as string[], stats: null };

    const valid = data.filter((d) => d.market_cap_bn != null && d.market_cap_bn > 0);
    const allIndustries = Array.from(new Set(valid.map((d) => d.industry))).sort();

    const visible = highlight == null ? valid : valid.filter((d) => d.industry === highlight);

    // compute x-axis range (log10 of market_cap_bn)
    const logCaps = valid.map((d) => Math.log10(d.market_cap_bn!));
    const minLogCap = Math.floor(Math.min(...logCaps) * 10) / 10;
    const maxLogCap = Math.ceil(Math.max(...logCaps) * 10) / 10;

    // compute y-axis range (ytd_return)
    const ytdVals = valid.map((d) => d.ytd_return ?? 0);
    const minYtd = Math.floor(Math.min(...ytdVals)) - 1;
    const maxYtd = Math.ceil(Math.max(...ytdVals)) + 1;

    const seriesData = valid.map((d) => {
      const ytd = d.ytd_return ?? 0;
      const logCap = Math.log10(d.market_cap_bn!);
      const isUp = ytd >= 0;
      const isDimmed = highlight != null && d.industry !== highlight;
      const symbolSize = Math.max(6, Math.min(40, Math.sqrt(d.weight) * 16));

      return {
        value: [logCap, ytd, d.weight],
        name: d.name,
        industry: d.industry,
        code: d.code,
        symbolSize,
        itemStyle: {
          color: isUp ? "rgba(196,30,58,0.65)" : "rgba(45,106,79,0.65)",
          borderColor: isUp ? "#C41E3A" : "#2D6A4F",
          borderWidth: 0.5,
          opacity: isDimmed ? 0.1 : 1,
        },
        label: {
          show: d.weight >= 1 && !isDimmed,
          formatter: () => d.name,
          position: "right" as const,
          fontSize: 10,
          color: "var(--text-muted)",
          fontFamily: "var(--font-mono)",
        },
      };
    });

    const opt = {
      backgroundColor: "transparent",
      grid: { left: 70, right: 20, top: 20, bottom: 88, containLabel: true },
      tooltip: {
        trigger: "item",
        backgroundColor: "#fff",
        borderColor: "#ddd",
        borderWidth: 1,
        textStyle: { fontFamily: "var(--font-sans)", fontSize: 13 },
        formatter: (p: { data: { name: string; industry: string; value: [number, number, number] } }) => {
          const [logCap, ytd, w] = p.data.value;
          const cap = Math.pow(10, logCap);
          const capStr = cap >= 10000
            ? `${(cap / 10000).toFixed(2)} 万亿`
            : `${cap.toFixed(0)} 亿`;
          const sign = ytd >= 0 ? "+" : "";
          return [
            `<strong>${p.data.name}</strong>（${p.data.industry}）`,
            `市值：${capStr}`,
            `权重：${w.toFixed(3)}%`,
            `近1年涨跌：${sign}${ytd.toFixed(2)}%`,
          ].join("<br/>");
        },
      },
      xAxis: {
        type: "value",
        name: "总市值（亿元，对数）",
        nameLocation: "middle",
        nameGap: 32,
        min: minLogCap - 0.1,
        max: maxLogCap + 0.1,
        nameTextStyle: { fontFamily: "var(--font-mono)", fontSize: 11, color: "#888" },
        axisLabel: {
          fontFamily: "var(--font-mono)",
          fontSize: 10,
          color: "#888",
          formatter: (v: number) => {
            const cap = Math.pow(10, v);
            return cap >= 10000 ? `${(cap / 10000).toFixed(0)}万亿` : `${cap.toFixed(0)}亿`;
          },
        },
        splitLine: { lineStyle: { color: "#eee", type: "dashed" } },
        axisLine: { show: false },
        axisTick: { show: false },
      },
      yAxis: {
        type: "value",
        name: "近1年涨跌幅 (%)",
        nameLocation: "middle",
        nameGap: 50,
        min: minYtd,
        max: maxYtd,
        nameTextStyle: { fontFamily: "var(--font-mono)", fontSize: 11, color: "#888" },
        axisLabel: {
          fontFamily: "var(--font-mono)",
          fontSize: 10,
          color: "#888",
          formatter: (v: number) => `${v >= 0 ? "+" : ""}${v}%`,
        },
        splitLine: { lineStyle: { color: "#eee", type: "dashed" } },
        axisLine: { show: false },
        axisTick: { show: false },
      },
      dataZoom: [
        { type: "inside", xAxisIndex: 0, yAxisIndex: 0 },
        {
          type: "slider",
          bottom: 36,
          height: 20,
          borderColor: "#ddd",
          fillerColor: "rgba(0,0,0,0.05)",
          textStyle: { fontFamily: "var(--font-mono)", fontSize: 10, color: "#aaa" },
        },
      ],
      series: [
        {
          type: "scatter",
          data: seriesData,
          symbolSize: (val: number[]) => Math.max(6, Math.min(40, Math.sqrt(val[2]) * 16)),
          label: { show: false }, // per-item label overrides this
        },
      ],
    };

    const totalWeight = valid.reduce((s, d) => s + d.weight, 0);
    const upCount = valid.filter((d) => (d.ytd_return ?? 0) >= 0).length;
    return {
      option: opt,
      industries: allIndustries,
      stats: { total: valid.length, upCount, totalWeight: totalWeight.toFixed(1) },
    };
  }, [data, highlight]);

  if (loading) return <Placeholder h={480} msg="加载中…" />;
  if (error || !data) return <Placeholder h={480} msg={`加载失败：${error}`} />;

  return (
    <div>
      {/* stats row */}
      {stats && (
        <div style={{ display: "flex", gap: 24, marginBottom: 10, flexWrap: "wrap" }}>
          {[
            { label: "成分股总数", value: `${stats.total} 只` },
            { label: "今日上涨", value: `${stats.upCount} 只`, color: "#C41E3A" },
            { label: "今日下跌", value: `${stats.total - stats.upCount} 只`, color: "#2D6A4F" },
          ].map((s) => (
            <div key={s.label}>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--text-muted)", marginBottom: 2 }}>{s.label}</div>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: 14, fontWeight: 600, color: s.color ?? "var(--text-heading)" }}>{s.value}</div>
            </div>
          ))}
        </div>
      )}

      {/* industry filter */}
      <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginBottom: 10 }}>
        <button
          onClick={() => setHighlight(null)}
          style={{
            fontFamily: "var(--font-mono)", fontSize: 10, padding: "2px 8px",
            border: "1px solid var(--border)", borderRadius: 3,
            background: highlight == null ? "var(--grid)" : "transparent",
            color: "var(--text)", cursor: "pointer",
          }}
        >
          全部
        </button>
        {industries.map((ind) => (
          <button
            key={ind}
            onClick={() => setHighlight(highlight === ind ? null : ind)}
            style={{
              fontFamily: "var(--font-mono)", fontSize: 10, padding: "2px 8px",
              border: "1px solid var(--border)", borderRadius: 3,
              background: highlight === ind ? "var(--grid)" : "transparent",
              color: "var(--text)", cursor: "pointer",
            }}
          >
            {ind}
          </button>
        ))}
      </div>

      <ReactEChartsCore
        echarts={echarts}
        option={option}
        style={{ height: 440 }}
        notMerge
        lazyUpdate={false}
      />

      <div style={{ marginTop: 6, fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--text-muted)" }}>
        X轴 = 总市值（对数），Y轴 = 近1年涨跌幅。气泡大小 = 指数权重，权重≥1%股票显示名称。滚轮可缩放。
      </div>
    </div>
  );
}

function Placeholder({ h, msg }: { h: number; msg: string }) {
  return (
    <div style={{ height: h, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-muted)", fontFamily: "var(--font-mono)", fontSize: 13 }}>
      {msg}
    </div>
  );
}
