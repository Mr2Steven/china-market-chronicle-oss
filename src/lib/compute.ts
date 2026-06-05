/**
 * compute.ts — 前端衍生计算
 * 部分面板的数据在前端从 daily.json 实时计算，避免生成过大的 JSON。
 *
 * CC 实现图表组件时直接调用这些函数。
 */

import type { DailyPoint, AnnualReturn } from "@/types/data";

/**
 * 从日线数据提取每年末收盘价。
 */
export function yearEndCloses(daily: DailyPoint[]): Map<number, number> {
  const map = new Map<number, number>();
  for (const d of daily) {
    const year = parseInt(d.date.substring(0, 4));
    map.set(year, d.close); // 最后一条自然覆盖为年末值
  }
  return map;
}

/**
 * 计算年化矩阵 (Panel A03)
 * 返回 { buyYear, sellYear, cagr }[] 的扁平数组。
 */
export function computeAnnualizedMatrix(
  daily: DailyPoint[]
): Array<{ buyYear: number; sellYear: number; cagr: number }> {
  const closes = yearEndCloses(daily);
  const years = Array.from(closes.keys()).sort();
  const results: Array<{ buyYear: number; sellYear: number; cagr: number }> = [];

  for (let i = 0; i < years.length; i++) {
    for (let j = i + 1; j < years.length; j++) {
      const buyYear = years[i];
      const sellYear = years[j];
      const startPrice = closes.get(buyYear)!;
      const endPrice = closes.get(sellYear)!;
      const holdYears = sellYear - buyYear;

      if (startPrice <= 0 || holdYears <= 0) continue;

      const cagr = (Math.pow(endPrice / startPrice, 1 / holdYears) - 1) * 100;

      results.push({
        buyYear,
        sellYear,
        cagr: Math.round(cagr * 100) / 100,
      });
    }
  }

  return results;
}

/**
 * 计算回报分布直方图 (Panel A02)
 * 将年度回报按区间分桶。
 */
export function computeReturnDistribution(
  annualReturns: AnnualReturn[]
): Array<{ range: string; count: number; years: number[] }> {
  const buckets = [
    { range: "< -30%", min: -Infinity, max: -30 },
    { range: "-30~-20%", min: -30, max: -20 },
    { range: "-20~-10%", min: -20, max: -10 },
    { range: "-10~0%", min: -10, max: 0 },
    { range: "0~10%", min: 0, max: 10 },
    { range: "10~20%", min: 10, max: 20 },
    { range: "20~30%", min: 20, max: 30 },
    { range: "30~50%", min: 30, max: 50 },
    { range: "> 50%", min: 50, max: Infinity },
  ];

  return buckets.map((b) => {
    const matching = annualReturns.filter(
      (r) => r.return_pct >= b.min && r.return_pct < b.max
    );
    return {
      range: b.range,
      count: matching.length,
      years: matching.map((r) => r.year),
    };
  });
}

/**
 * 计算滚动波动率 (Panel A08)
 * 从日线数据计算 20/60 日年化波动率。
 */
export function computeRollingVolatility(
  daily: DailyPoint[],
  window: number
): Array<{ date: string; volatility: number }> {
  if (daily.length < window + 1) return [];

  // 计算日收益率
  const returns: number[] = [];
  for (let i = 1; i < daily.length; i++) {
    if (daily[i - 1].close > 0) {
      returns.push(Math.log(daily[i].close / daily[i - 1].close));
    } else {
      returns.push(0);
    }
  }

  const results: Array<{ date: string; volatility: number }> = [];

  for (let i = window; i < returns.length; i++) {
    const slice = returns.slice(i - window, i);
    const mean = slice.reduce((a, b) => a + b, 0) / slice.length;
    const variance =
      slice.reduce((sum, r) => sum + (r - mean) ** 2, 0) / (slice.length - 1);
    const annualizedVol = Math.sqrt(variance) * Math.sqrt(252) * 100;

    results.push({
      date: daily[i + 1]?.date ?? daily[i].date,
      volatility: Math.round(annualizedVol * 100) / 100,
    });
  }

  // 降采样到周频
  return results.filter((_, i) => i % 5 === 0);
}

/**
 * 计算对数同比 (Panel A05)
 * ln(当日 / 252个交易日前)
 */
export function computeLogYoY(
  daily: DailyPoint[]
): Array<{ date: string; logYoY: number }> {
  const lag = 252;
  if (daily.length <= lag) return [];

  const results: Array<{ date: string; logYoY: number }> = [];

  for (let i = lag; i < daily.length; i++) {
    if (daily[i - lag].close > 0) {
      const logYoY = Math.log(daily[i].close / daily[i - lag].close) * 100;
      results.push({
        date: daily[i].date,
        logYoY: Math.round(logYoY * 100) / 100,
      });
    }
  }

  return results.filter((_, i) => i % 5 === 0);
}
