"use client";

import ReactEChartsCore from "echarts-for-react/lib/core";
import * as echarts from "echarts/core";
import { TreemapChart, BarChart } from "echarts/charts";
import { TooltipComponent, GridComponent } from "echarts/components";
import { CanvasRenderer } from "echarts/renderers";
import { useMemo } from "react";
import { useChartData } from "@/hooks/useChartData";

echarts.use([TreemapChart, BarChart, GridComponent, TooltipComponent, CanvasRenderer]);

interface IndustryWeight {
  industry: string;
  weight: number;
  count: number;
  stocks: { code: string; name: string; weight: number }[];
}

const INDUSTRY_COLORS: Record<string, string> = {
  电子:     "#C41E3A",
  电力设备: "#FA541C",
  食品饮料: "#D4B106",
  银行:     "#1890FF",
  非银金融: "#2F54EB",
  医药生物: "#52C41A",
  汽车:     "#13C2C2",
  机械设备: "#722ED1",
  有色金属: "#EB2F96",
  基础化工: "#FF7A45",
  通信:     "#36CFC9",
  计算机:   "#F759AB",
  国防军工: "#73D13D",
  建筑材料: "#9254DE",
  石油石化: "#FF4D4F",
  公用事业: "#40A9FF",
  交通运输: "#FFC53D",
  煤炭:     "#8C8C8C",
  钢铁:     "#BFBFBF",
  房地产:   "#FF85C2",
  传媒:     "#B7EB8F",
  家用电器: "#FF6B35",
  建筑装饰: "#7B5EA7",
  农林牧渔: "#4CAF50",
  美容护理: "#E91E8C",
  其他:     "#90A4AE",
};
const DEFAULT_COLOR = "#ADC6FF";

function stockLabel(name: string, weight: number) {
  if (weight > 3)   return { fontSize: 14, text: `${name}\n${weight.toFixed(1)}%`,         bold: true  };
  if (weight > 1)   return { fontSize: 12, text: `${name}\n${weight.toFixed(1)}%`,         bold: true  };
  if (weight > 0.5) return { fontSize: 10, text: `${name.slice(0, 4)}\n${weight.toFixed(1)}%`, bold: false };
  if (weight > 0.2) return { fontSize: 9,  text: name.slice(0, 3),                         bold: false };
  return                   { fontSize: 8,  text: name.slice(0, 2),                         bold: false };
}

export default function IndustryTreemapChart() {
  const { data, loading, error } = useChartData<IndustryWeight[]>("hs300", "industry-weights.json");

  const { treemapOption, barOption, stats } = useMemo(() => {
    if (!data || data.length === 0) return { treemapOption: {}, barOption: {}, stats: null };

    const totalWeight = data.reduce((s, d) => s + d.weight, 0);
    const sorted = [...data].sort((a, b) => b.weight - a.weight);
    const top5 = sorted.slice(0, 5).reduce((s, d) => s + d.weight, 0);
    const maxItem = sorted[0];

    // ── Treemap — flat: all stocks in one layer, colored by industry ─────────
    const flatData = data.flatMap((industry) =>
      industry.stocks
        .filter((s) => s.weight > 0)
        .map((s) => {
          const lbl = stockLabel(s.name, s.weight);
          return {
            name: s.name,
            value: s.weight,
            industry: industry.industry,
            itemStyle: { color: INDUSTRY_COLORS[industry.industry] ?? DEFAULT_COLOR },
            label: {
              show: true,
              fontSize: lbl.fontSize,
              fontWeight: lbl.bold ? 600 : 400,
              color: "#fff",
              fontFamily: "'PingFang SC', 'Microsoft YaHei', sans-serif",
              formatter: () => lbl.text,
            },
          };
        })
    );

    const treemapOpt = {
      backgroundColor: "transparent",
      tooltip: {
        trigger: "item",
        backgroundColor: "#fff",
        borderColor: "#ddd",
        borderWidth: 1,
        textStyle: { fontFamily: "var(--font-sans)", fontSize: 13 },
        formatter: (p: { name: string; value: number; data: { industry?: string } }) =>
          `<strong>${p.name}</strong>（${p.data?.industry ?? ""}）<br/>权重：${p.value.toFixed(3)}%`,
      },
      series: [
        {
          type: "treemap",
          data: flatData,
          width: "100%",
          height: "100%",
          roam: false,
          nodeClick: false,
          upperLabel: { show: false },
          breadcrumb: { show: false },
          label: { show: true },
          levels: [
            {
              itemStyle: { borderWidth: 1, borderColor: "#fff", gapWidth: 1 },
              label: { show: true },
            },
          ],
        },
      ],
    };

    // ── Horizontal bar chart ──────────────────────────────────────────────────
    // sorted descending; reverse for category axis so largest appears at top with inverse:true
    const barItems = [...sorted].reverse();
    const xMax = parseFloat((sorted[0].weight + 2).toFixed(1));
    const barOpt = {
      backgroundColor: "transparent",
      grid: { left: 8, right: 52, top: 4, bottom: 24, containLabel: true },
      tooltip: {
        trigger: "axis",
        axisPointer: { type: "shadow" },
        backgroundColor: "#fff",
        borderColor: "#ddd",
        borderWidth: 1,
        textStyle: { fontFamily: "var(--font-sans)", fontSize: 12 },
        formatter: (params: { name: string; value: number }[]) =>
          `${params[0].name}：${params[0].value.toFixed(2)}%`,
      },
      xAxis: {
        type: "value",
        min: 0,
        max: xMax,
        axisLabel: { fontFamily: "var(--font-mono)", fontSize: 9, color: "#aaa", formatter: (v: number) => `${v}%` },
        splitLine: { show: false },
        axisLine: { show: true, lineStyle: { color: "#e0e0e0" } },
        axisTick: { show: false },
      },
      yAxis: {
        type: "category",
        data: barItems.map((d) => d.industry),
        inverse: true,
        axisLabel: {
          fontFamily: "var(--font-mono)",
          fontSize: 10,
          color: "#666",
          width: 60,
          overflow: "truncate",
        },
        axisLine: { show: false },
        axisTick: { show: false },
      },
      series: [
        {
          type: "bar",
          data: barItems.map((d) => ({
            value: parseFloat(d.weight.toFixed(3)),
            itemStyle: { color: INDUSTRY_COLORS[d.industry] ?? DEFAULT_COLOR, borderRadius: [0, 3, 3, 0] },
          })),
          barWidth: 20,
          label: {
            show: true,
            position: "right",
            fontFamily: "var(--font-mono)",
            fontSize: 12,
            color: "#555",
            formatter: (p: { value: number }) => `${p.value.toFixed(1)}%`,
          },
        },
      ],
    };

    return {
      treemapOption: treemapOpt,
      barOption: barOpt,
      stats: {
        count: data.length,
        maxIndustry: maxItem.industry,
        maxWeight: maxItem.weight.toFixed(1),
        top5: top5.toFixed(1),
        top5Names: sorted.slice(0, 5).map((d) => d.industry).join("、"),
      },
    };
  }, [data]);

  if (loading) return <Placeholder h={460} msg="加载中…" />;
  if (error || !data) return <Placeholder h={460} msg={`加载失败：${error}`} />;

  return (
    <div>
      {/* ── Stats cards ─────────────────────────────────────────────── */}
      {stats && (
        <div style={{ display: "flex", gap: 24, marginBottom: 16, flexWrap: "wrap" }}>
          {[
            { label: "行业数量", value: `${stats.count} 个申万一级行业` },
            {
              label: "权重最大",
              value: `${stats.maxIndustry} ${stats.maxWeight}%`,
              color: INDUSTRY_COLORS[stats.maxIndustry] ?? DEFAULT_COLOR,
            },
            { label: "TOP5合计", value: `${stats.top5}%` },
            { label: "TOP5行业", value: stats.top5Names, small: true },
          ].map((s) => (
            <div key={s.label} style={{ flex: s.small ? "1 1 200px" : undefined }}>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--text-muted)", marginBottom: 2 }}>
                {s.label}
              </div>
              <div
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: s.small ? 12 : 15,
                  fontWeight: 600,
                  color: s.color ?? "var(--text-heading)",
                  lineHeight: 1.4,
                }}
              >
                {s.value}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Treemap ─────────────────────────────────────────────────── */}
      <ReactEChartsCore
        echarts={echarts}
        option={treemapOption}
        style={{ height: 650 }}
        notMerge
        lazyUpdate={false}
      />

      {/* ── Horizontal bar chart ────────────────────────────────────── */}
      <div style={{ marginTop: 16 }}>
        <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--text-muted)", marginBottom: 4 }}>
          行业权重排名（申万一级）
        </div>
        <ReactEChartsCore
          echarts={echarts}
          option={barOption}
          style={{ height: (data?.length ?? 26) * 24 + 40 }}
          notMerge
          lazyUpdate={false}
        />
      </div>

      <div style={{ marginTop: 6, fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--text-muted)" }}>
        方块面积 = 成分股权重占比，颜色代表申万一级行业。悬停查看公司名称、行业与权重。数据来源：中证指数公司。
      </div>
    </div>
  );
}

function Placeholder({ h, msg }: { h: number; msg: string }) {
  return (
    <div
      style={{ height: h, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-muted)", fontFamily: "var(--font-mono)", fontSize: 13 }}
    >
      {msg}
    </div>
  );
}
