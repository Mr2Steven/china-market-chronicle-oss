/**
 * ECharts 主题配置 — 编年史风格
 * CC 写图表组件时，统一使用这个主题，不要自己配样式。
 */

import type { EChartsOption } from "echarts";
import { COLORS, FONTS } from "./constants";

/**
 * 基础图表配置，所有图表组件都应该 merge 这个配置。
 * 用法: const option = { ...BASE_CHART_OPTION, series: [...] }
 */
export const BASE_CHART_OPTION: Partial<EChartsOption> = {
  backgroundColor: "transparent",
  textStyle: {
    fontFamily: FONTS.sans,
    color: COLORS.text,
    fontSize: 12,
  },
  title: {
    textStyle: {
      fontFamily: FONTS.serif,
      fontSize: 18,
      fontWeight: 600,
      color: COLORS.text,
    },
    subtextStyle: {
      fontFamily: FONTS.sans,
      fontSize: 13,
      color: COLORS.muted,
    },
  },
  tooltip: {
    backgroundColor: COLORS.tooltip,
    borderColor: COLORS.grid,
    borderWidth: 1,
    textStyle: {
      fontFamily: FONTS.sans,
      fontSize: 13,
      color: COLORS.text,
    },
    extraCssText: "box-shadow: 0 2px 8px rgba(0,0,0,0.1); border-radius: 4px;",
  },
  grid: {
    left: 60,
    right: 20,
    top: 40,
    bottom: 40,
    containLabel: true,
  },
  xAxis: {
    axisLine: { lineStyle: { color: COLORS.grid } },
    axisTick: { lineStyle: { color: COLORS.grid } },
    axisLabel: {
      fontFamily: FONTS.mono,
      fontSize: 11,
      color: COLORS.muted,
    },
    splitLine: { show: false },
  },
  yAxis: {
    axisLine: { show: false },
    axisTick: { show: false },
    axisLabel: {
      fontFamily: FONTS.mono,
      fontSize: 11,
      color: COLORS.muted,
      formatter: (v: number) => `${v}%`,
    },
    splitLine: {
      lineStyle: {
        color: COLORS.grid,
        type: "dashed",
      },
    },
  },
  // dataZoom 缩放（大数据集面板启用）
  dataZoom: [
    {
      type: "inside",
      start: 0,
      end: 100,
    },
  ],
};

/**
 * 柱状图上涨/下跌颜色映射函数
 * 用法: itemStyle: { color: barColor(value) }
 */
export function barColor(value: number): string {
  return value >= 0 ? COLORS.up : COLORS.down;
}

/**
 * 热力图色阶配置
 */
export const HEATMAP_VISUAL_MAP = {
  min: -30,
  max: 30,
  calculable: true,
  orient: "horizontal" as const,
  left: "center",
  bottom: 0,
  inRange: {
    color: [COLORS.heatmapMin, COLORS.heatmapMid, COLORS.heatmapMax],
  },
  textStyle: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: COLORS.muted,
  },
};

/**
 * 面积图正/负区域样式
 */
export const AREA_POSITIVE_STYLE = {
  color: {
    type: "linear" as const,
    x: 0, y: 0, x2: 0, y2: 1,
    colorStops: [
      { offset: 0, color: "rgba(196, 30, 58, 0.3)" },
      { offset: 1, color: "rgba(196, 30, 58, 0.02)" },
    ],
  },
};

export const AREA_NEGATIVE_STYLE = {
  color: {
    type: "linear" as const,
    x: 0, y: 0, x2: 0, y2: 1,
    colorStops: [
      { offset: 0, color: "rgba(45, 106, 79, 0.02)" },
      { offset: 1, color: "rgba(45, 106, 79, 0.3)" },
    ],
  },
};

/**
 * 暗色主题覆盖
 * 用法: const option = isDark ? deepMerge(BASE_CHART_OPTION, DARK_OVERRIDES) : BASE_CHART_OPTION
 */
export const DARK_OVERRIDES: Partial<EChartsOption> = {
  textStyle: { color: COLORS.textDark },
  title: {
    textStyle: { color: COLORS.textDark },
    subtextStyle: { color: "#999999" },
  },
  tooltip: {
    backgroundColor: COLORS.tooltipDark,
    borderColor: "#444444",
    textStyle: { color: COLORS.textDark },
  },
  xAxis: {
    axisLine: { lineStyle: { color: COLORS.gridDark } },
    axisTick: { lineStyle: { color: COLORS.gridDark } },
    axisLabel: { color: "#999999" },
  },
  yAxis: {
    axisLabel: { color: "#999999" },
    splitLine: { lineStyle: { color: COLORS.gridDark } },
  },
};
