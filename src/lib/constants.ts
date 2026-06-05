/**
 * 中国股市编年史 — 前端常量
 */

import type { IndexMeta } from "@/types/data";

// ─── 指数定义（与 pipeline/config.py 保持同步）─────────

export const INDICES: Record<string, IndexMeta> = {
  shanghai: {
    code: "000001",
    slug: "shanghai",
    nameCn: "上证综指",
    nameEn: "SSE Composite",
    market: "a",
    color: "#C41E3A",
    startYear: 1990,
  },
  hs300: {
    code: "000300",
    slug: "hs300",
    nameCn: "沪深300",
    nameEn: "CSI 300",
    market: "a",
    color: "#D4380D",
    startYear: 2005,
  },
  gem: {
    code: "399006",
    slug: "gem",
    nameCn: "创业板指",
    nameEn: "ChiNext",
    market: "a",
    color: "#FA541C",
    startYear: 2010,
  },
  sse50: {
    code: "000016",
    slug: "sse50",
    nameCn: "上证50",
    nameEn: "SSE 50",
    market: "a",
    color: "#CF1322",
    startYear: 2004,
  },
  star50: {
    code: "000688",
    slug: "star50",
    nameCn: "科创50",
    nameEn: "STAR 50",
    market: "a",
    color: "#EB2F96",
    startYear: 2020,
  },
  csi500: {
    code: "000905",
    slug: "csi500",
    nameCn: "中证500",
    nameEn: "CSI 500",
    market: "a",
    color: "#13C2C2",
    startYear: 2005,
  },
  hsi: {
    code: "HSI",
    slug: "hsi",
    nameCn: "恒生指数",
    nameEn: "Hang Seng",
    market: "hk",
    color: "#722ED1",
    startYear: 1969,
  },
  hstech: {
    code: "HSTECH",
    slug: "hstech",
    nameCn: "恒生科技",
    nameEn: "HS TECH",
    market: "hk",
    color: "#2F54EB",
    startYear: 2020,
  },
  hscei: {
    code: "HSCEI",
    slug: "hscei",
    nameCn: "恒生国企",
    nameEn: "HSCEI",
    market: "hk",
    color: "#1890FF",
    startYear: 2000,
  },
};

// Phase 1 优先实现的指数
export const CORE_INDEX_SLUGS = ["shanghai", "hs300", "hsi"] as const;

// ─── 色板 ────────────────────────────────────────────

export const COLORS = {
  // 中国红涨绿跌（与原站美国绿涨红跌相反！）
  up: "#C41E3A",       // 上涨 · 中国红
  down: "#2D6A4F",     // 下跌 · 墨绿
  upLight: "#FF4D4F",
  downLight: "#52C41A",

  // 主题色
  bg: "#F5F0E8",       // 宣纸暖白
  bgDark: "#1A1A1A",   // 墨色
  text: "#2C2C2C",
  textDark: "#E8E5DC",
  accent: "#C41E3A",
  muted: "#8C8C8C",

  // 图表专用
  grid: "#E0DDD6",
  gridDark: "#333333",
  tooltip: "#FFFFFF",
  tooltipDark: "#2C2C2C",

  // 热力图色阶（绿到白到红）
  heatmapMin: "#2D6A4F",
  heatmapMid: "#F5F0E8",
  heatmapMax: "#C41E3A",
} as const;

// ─── 字体 ────────────────────────────────────────────

export const FONTS = {
  serif: '"Noto Serif SC", "Source Han Serif CN", "STSong", serif',
  sans: '"Noto Sans SC", "PingFang SC", "Microsoft YaHei", sans-serif',
  mono: '"JetBrains Mono", "Fira Code", "Consolas", monospace',
} as const;

// ─── 面板分节 ────────────────────────────────────────

export const SECTIONS = [
  {
    id: "shape",
    titleCn: "§ I 回报的形状",
    titleEn: "The Shape of History",
    panels: ["annual", "annual-dist", "annualized-matrix", "rolling", "logyoy"],
  },
  {
    id: "crisis",
    titleCn: "§ II 危机的节奏",
    titleEn: "The Rhythm of Crisis",
    panels: ["drawdown", "intrayear-dd", "volatility", "ivix", "monthly"],
  },
  {
    id: "valuation",
    titleCn: "§ III 估值的锚点",
    titleEn: "Anchors of Valuation",
    panels: ["pe", "pb", "equity-bond", "market-pe", "return-details"],
  },
  {
    id: "structure",
    titleCn: "§ IV 结构与规则",
    titleEn: "Structure & Rules",
    panels: ["a7", "sectors", "scatter", "changes", "rules"],
  },
  {
    id: "hk",
    titleCn: "§ V 恒生指数",
    titleEn: "Hang Seng",
    panels: ["hsi-annual", "hsi-drawdown", "hsi-monthly", "hsi-pe", "hstech"],
  },
  {
    id: "china",
    titleCn: "§ VI 中国特色",
    titleEn: "China-Specific",
    panels: ["northbound", "ah-premium", "ipo", "cn-vs-us"],
  },
] as const;

// ─── API 路径 ────────────────────────────────────────

export const API_BASE = "/api";

export function apiUrl(slug: string, file: string): string {
  return `${API_BASE}/${slug}/${file}`;
}
