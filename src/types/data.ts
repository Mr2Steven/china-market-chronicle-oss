/**
 * 中国股市编年史 — 数据类型定义
 * 与 pipeline 输出的 JSON 格式一一对应，CC 写组件时直接 import 使用。
 */

// ─── 指数定义 ─────────────────────────────────────────

export interface IndexMeta {
  code: string;
  slug: string;
  nameCn: string;
  nameEn: string;
  market: "a" | "hk";
  color: string;
  startYear: number;
}

// ─── 日线数据 (daily.json) ────────────────────────────

export interface DailyPoint {
  date: string; // "YYYY-MM-DD"
  close: number;
}

// ─── 年度回报 (annual-returns.json) ──────────────────

export interface AnnualReturn {
  year: number;
  return_pct: number;
  close: number;
}

// ─── 回撤数据 (drawdowns.json) ──────────────────────

export interface DrawdownPoint {
  date: string;
  drawdown_pct: number;
}

export interface NamedDrawdown {
  name: string;
  category: string;
  peak_date: string;
  trough_date: string;
  recovery_date: string | null;
  drawdown_pct: number;
  recovery_days: number | null;
}

export interface DrawdownData {
  daily_drawdown: DrawdownPoint[];
  named_events: NamedDrawdown[];
}

// ─── 滚动收益 (rolling-5y.json) ─────────────────────

export interface RollingReturn {
  date: string;
  cagr_5y: number;
}

// ─── 年内回撤 (intrayear-dd.json) ───────────────────

export interface IntrayearDD {
  year: number;
  full_year_return: number;
  max_intrayear_dd: number;
}

// ─── 月度收益 (monthly.json) ────────────────────────

export interface MonthlyMatrix {
  matrix: Array<{
    year: number;
    months: (number | null)[];
  }>;
  summary: {
    avg: (number | null)[];
    win_rate: (number | null)[];
  };
}

// ─── 估值数据 (pe.json / pb.json) ───────────────────

export interface ValuationPoint {
  date: string;
  pe?: number;
  pb?: number;
}

// ─── 成分股 (constituents.json) ─────────────────────

export interface ConstituentStock {
  code: string;
  name: string;
  weight: number;
}

export interface ConstituentsData {
  date: string;
  count: number;
  stocks: ConstituentStock[];
}

// ─── 北向资金 (northbound/flow.json) ────────────────

export interface NorthboundFlow {
  date: string;
  net_flow: number;
  cumulative: number;
}

// ─── Manifest (_manifest.json) ──────────────────────

export interface Manifest {
  project: string;
  last_updated: string;
  indices: Array<{
    slug: string;
    name: string;
    code: string;
  }>;
}
