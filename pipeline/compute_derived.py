"""
compute_derived.py
从 raw/ 目录的 CSV 日线数据，计算所有衍生指标，输出 JSON 到 public/api/。
这是整个管道的核心计算引擎。

计算内容:
1. annual-returns.json   — 年度涨跌幅
2. drawdowns.json        — 每日回撤 + 命名事件
3. rolling-5y.json       — 5 年滚动年化收益
4. intrayear-dd.json     — 年内最大回撤 vs 全年涨跌
5. monthly.json          — 月度收益矩阵 + 季节性统计
6. daily.json            — 精简版日线（仅 date + close，供前端计算矩阵/波动率）
"""

import os
import json
import math
import numpy as np
import pandas as pd
from typing import Optional

from config import (
    ALL_INDICES, CORE_INDICES, IndexDef, OUTPUT_DIR,
    NAMED_DRAWDOWNS_SHANGHAI, NAMED_DRAWDOWNS_HSI,
    current_update_date,
)

RAW_DIR = os.path.join(os.path.dirname(__file__), "raw")


def load_daily(idx: IndexDef) -> pd.DataFrame:
    """加载原始日线 CSV。"""
    path = os.path.join(RAW_DIR, f"{idx.slug}_daily.csv")
    if not os.path.exists(path):
        print(f"  ⚠ {path} 不存在，跳过 {idx.name_cn}")
        return pd.DataFrame()
    df = pd.read_csv(path, parse_dates=["date"])
    df = df.sort_values("date").reset_index(drop=True)
    return df


def save_json(data, idx: IndexDef, filename: str):
    """保存 JSON 到 public/api/{slug}/{filename}。"""
    out_dir = os.path.join(OUTPUT_DIR, idx.slug)
    os.makedirs(out_dir, exist_ok=True)
    path = os.path.join(out_dir, filename)

    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=None, default=str)
    print(f"    → {path} ({len(json.dumps(data, default=str)) // 1024}KB)")


# ─── 1. 年度回报 ─────────────────────────────────────────

def compute_annual_returns(df: pd.DataFrame) -> list[dict]:
    """计算每年收盘涨跌幅。"""
    df = df.copy()
    df["year"] = df["date"].dt.year

    # 取每年最后一个交易日的收盘价
    yearly = df.groupby("year").agg(
        close=("close", "last"),
        first_close=("close", "first"),
    ).reset_index()

    results = []
    for i, row in yearly.iterrows():
        if i == 0:
            # 第一年用年内涨跌
            ret = (row["close"] / row["first_close"] - 1) * 100
        else:
            prev_close = yearly.iloc[i - 1]["close"]
            ret = (row["close"] / prev_close - 1) * 100

        results.append({
            "year": int(row["year"]),
            "return_pct": round(ret, 2),
            "close": round(row["close"], 2),
        })

    return results


# ─── 2. 回撤序列 ─────────────────────────────────────────

def compute_drawdowns(df: pd.DataFrame, named_events: list[dict]) -> dict:
    """
    计算每日回撤百分比 + 匹配命名事件。
    回撤 = (当前价 / 历史最高价 - 1) × 100
    """
    df = df.copy()
    df["cum_max"] = df["close"].cummax()
    df["drawdown_pct"] = ((df["close"] / df["cum_max"]) - 1) * 100

    # 精简日线回撤（每 5 个交易日取一个点，减小 JSON 体积）
    sampled = df.iloc[::5][["date", "drawdown_pct"]].copy()
    sampled["date"] = sampled["date"].dt.strftime("%Y-%m-%d")
    sampled["drawdown_pct"] = sampled["drawdown_pct"].round(2)

    # 检测回撤事件（>10% 的连续回撤段）
    detected_events = detect_drawdown_events(df)

    # 匹配命名事件
    matched = match_named_events(detected_events, named_events)

    return {
        "daily_drawdown": sampled.to_dict("records"),
        "named_events": matched,
    }


def detect_drawdown_events(df: pd.DataFrame, threshold: float = -10.0) -> list[dict]:
    """自动检测所有 > threshold% 的回撤事件。"""
    df = df.copy()
    df["cum_max"] = df["close"].cummax()
    df["dd"] = ((df["close"] / df["cum_max"]) - 1) * 100

    events = []
    in_drawdown = False
    peak_idx = 0

    for i in range(len(df)):
        if df.iloc[i]["dd"] < threshold and not in_drawdown:
            in_drawdown = True
            # 回溯找峰值点
            peak_idx = df.iloc[:i+1]["close"].idxmax()

        if in_drawdown and df.iloc[i]["dd"] >= -0.1:
            # 恢复到前高
            trough_idx = df.iloc[peak_idx:i+1]["close"].idxmin()
            trough_dd = df.iloc[trough_idx]["dd"]

            events.append({
                "peak_date": df.iloc[peak_idx]["date"].strftime("%Y-%m-%d"),
                "trough_date": df.iloc[trough_idx]["date"].strftime("%Y-%m-%d"),
                "recovery_date": df.iloc[i]["date"].strftime("%Y-%m-%d"),
                "drawdown_pct": round(trough_dd, 1),
                "recovery_days": (df.iloc[i]["date"] - df.iloc[peak_idx]["date"]).days,
            })
            in_drawdown = False

    # 处理尚未恢复的当前回撤
    if in_drawdown:
        trough_idx = df.iloc[peak_idx:]["close"].idxmin()
        events.append({
            "peak_date": df.iloc[peak_idx]["date"].strftime("%Y-%m-%d"),
            "trough_date": df.iloc[trough_idx]["date"].strftime("%Y-%m-%d"),
            "recovery_date": None,
            "drawdown_pct": round(df.iloc[trough_idx]["dd"], 1),
            "recovery_days": None,
        })

    return events


def match_named_events(detected: list[dict], named: list[dict]) -> list[dict]:
    """将自动检测的事件与硬编码的命名事件匹配（按峰值日期年月匹配）。"""
    result = []
    for evt in detected:
        peak_ym = evt["peak_date"][:7]  # "YYYY-MM"
        matched_name = None
        matched_cat = "其他"
        for n in named:
            if n["peak_approx"] == peak_ym:
                matched_name = n["name"]
                matched_cat = n["category"]
                break

        result.append({
            "name": matched_name or f"回撤 ({evt['peak_date'][:4]})",
            "category": matched_cat,
            **evt,
        })

    return result


# ─── 3. 滚动年化收益 ─────────────────────────────────────

def compute_rolling_returns(df: pd.DataFrame, years: int = 5) -> list[dict]:
    """计算 N 年滚动年化收益率 (CAGR)。"""
    df = df.copy()
    window = years * 252  # 约 252 个交易日/年

    if len(df) < window:
        return []

    results = []
    for i in range(window, len(df)):
        start_close = df.iloc[i - window]["close"]
        end_close = df.iloc[i]["close"]

        if start_close <= 0:
            continue

        cagr = ((end_close / start_close) ** (1 / years) - 1) * 100
        results.append({
            "date": df.iloc[i]["date"].strftime("%Y-%m-%d"),
            "cagr_5y": round(cagr, 2),
        })

    # 降采样到周频（减小 JSON 体积）
    return results[::5]


# ─── 4. 年内回撤 vs 全年 ─────────────────────────────────

def compute_intrayear_drawdowns(df: pd.DataFrame) -> list[dict]:
    """每年的年内最大回撤 vs 全年涨跌幅。"""
    df = df.copy()
    df["year"] = df["date"].dt.year
    results = []

    for year, group in df.groupby("year"):
        if len(group) < 10:
            continue
        closes = group["close"].values
        year_return = (closes[-1] / closes[0] - 1) * 100

        # 年内最大回撤
        cum_max = np.maximum.accumulate(closes)
        drawdowns = (closes / cum_max - 1) * 100
        max_dd = float(np.min(drawdowns))

        results.append({
            "year": int(year),
            "full_year_return": round(year_return, 2),
            "max_intrayear_dd": round(max_dd, 2),
        })

    return results


# ─── 5. 月度收益矩阵 ─────────────────────────────────────

def compute_monthly_returns(df: pd.DataFrame) -> dict:
    """月度收益矩阵 + 每月统计。"""
    df = df.copy()
    df["year"] = df["date"].dt.year
    df["month"] = df["date"].dt.month

    # 每月最后一个交易日收盘价
    monthly = df.groupby(["year", "month"]).agg(close=("close", "last")).reset_index()
    monthly = monthly.sort_values(["year", "month"])

    # 计算月度回报
    monthly["prev_close"] = monthly["close"].shift(1)
    monthly["return_pct"] = ((monthly["close"] / monthly["prev_close"]) - 1) * 100

    # 构建矩阵
    matrix = []
    for year, group in monthly.groupby("year"):
        months = [None] * 12
        for _, row in group.iterrows():
            m = int(row["month"]) - 1
            if pd.notna(row["return_pct"]):
                months[m] = round(row["return_pct"], 2)
        matrix.append({"year": int(year), "months": months})

    # 汇总统计
    all_months = {i: [] for i in range(12)}
    for row in matrix:
        for i, v in enumerate(row["months"]):
            if v is not None:
                all_months[i].append(v)

    summary_avg = []
    summary_win_rate = []
    for i in range(12):
        vals = all_months[i]
        if vals:
            summary_avg.append(round(np.mean(vals), 2))
            summary_win_rate.append(round(sum(1 for v in vals if v > 0) / len(vals), 2))
        else:
            summary_avg.append(None)
            summary_win_rate.append(None)

    return {
        "matrix": matrix,
        "summary": {
            "avg": summary_avg,
            "win_rate": summary_win_rate,
        },
    }


# ─── 6. 精简日线 ─────────────────────────────────────────

def compute_daily_slim(df: pd.DataFrame) -> list[dict]:
    """输出精简日线（仅 date + close），供前端计算矩阵/波动率。"""
    slim = df[["date", "close"]].copy()
    slim["date"] = slim["date"].dt.strftime("%Y-%m-%d")
    slim["close"] = slim["close"].round(2)
    return slim.to_dict("records")


# ─── 主入口 ─────────────────────────────────────────────

def process_index(idx: IndexDef):
    """处理单个指数的所有衍生计算。"""
    print(f"\n{'='*50}")
    print(f"处理 {idx.name_cn} ({idx.code})")
    print(f"{'='*50}")

    df = load_daily(idx)
    if df.empty:
        return

    # 选择命名事件
    if idx.slug == "shanghai":
        named = NAMED_DRAWDOWNS_SHANGHAI
    elif idx.slug == "hsi":
        named = NAMED_DRAWDOWNS_HSI
    else:
        named = []

    # 1. 年度回报
    annual = compute_annual_returns(df)
    save_json(annual, idx, "annual-returns.json")

    # 2. 回撤
    drawdowns = compute_drawdowns(df, named)
    save_json(drawdowns, idx, "drawdowns.json")

    # 3. 滚动收益
    rolling = compute_rolling_returns(df, years=5)
    if rolling:
        save_json(rolling, idx, "rolling-5y.json")

    # 4. 年内回撤
    intrayear = compute_intrayear_drawdowns(df)
    save_json(intrayear, idx, "intrayear-dd.json")

    # 5. 月度收益
    monthly = compute_monthly_returns(df)
    save_json(monthly, idx, "monthly.json")

    # 6. 精简日线
    daily_slim = compute_daily_slim(df)
    save_json(daily_slim, idx, "daily.json")

    print(f"  ✓ {idx.name_cn} 全部计算完成")


def main():
    """处理所有指数。"""
    # 确保输出目录存在
    os.makedirs(OUTPUT_DIR, exist_ok=True)

    for idx in ALL_INDICES:
        process_index(idx)

    # 输出 manifest
    manifest = {
        "project": "中国股市编年史 · History of China Market",
        "last_updated": current_update_date(),
        "indices": [
            {"slug": idx.slug, "name": idx.name_cn, "code": idx.code}
            for idx in ALL_INDICES
        ],
    }
    manifest_path = os.path.join(OUTPUT_DIR, "_manifest.json")
    with open(manifest_path, "w", encoding="utf-8") as f:
        json.dump(manifest, f, ensure_ascii=False, indent=2)
    print(f"\n✓ Manifest: {manifest_path}")


if __name__ == "__main__":
    main()
