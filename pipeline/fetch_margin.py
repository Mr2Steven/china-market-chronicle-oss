"""
fetch_margin.py
抓取 A 股融资融券余额历史数据，输出到 public/api/margin/balance.json。

输出格式:
  [{date, margin_balance, short_balance, total}]

金额单位统一为亿元。
"""

import json
import os
import sys
from typing import Any


def ensure_runtime():
    """Use the project Python with AkShare when the default python3 lacks deps."""
    try:
        import akshare  # noqa: F401
        import pandas  # noqa: F401
    except ModuleNotFoundError:
        fallback = "/opt/homebrew/bin/python3.12"
        if os.path.exists(fallback) and os.path.realpath(sys.executable) != os.path.realpath(fallback):
            os.execv(fallback, [fallback, *sys.argv])
        raise


ensure_runtime()

import pandas as pd
import akshare as ak

from config import OUTPUT_DIR, touch_manifest_last_updated


YUAN_PER_YI = 100_000_000


def to_number(value: Any) -> float | None:
    if value is None or pd.isna(value):
        return None
    text = str(value).replace(",", "").strip()
    if text in {"", "-", "--", "nan", "None"}:
        return None
    try:
        return float(text)
    except ValueError:
        return None


def normalize_market(df: pd.DataFrame, market: str) -> pd.DataFrame:
    df = df.copy()
    df.columns = [str(col).strip() for col in df.columns]

    required = ["日期", "融资余额", "融券余额", "融资融券余额"]
    missing = [col for col in required if col not in df.columns]
    if missing:
        raise RuntimeError(f"{market} 缺少字段 {missing}，实际字段: {list(df.columns)}")

    normalized = pd.DataFrame({
        "date": pd.to_datetime(df["日期"], errors="coerce"),
        "margin_balance": df["融资余额"].map(to_number),
        "short_balance": df["融券余额"].map(to_number),
        "total": df["融资融券余额"].map(to_number),
    }).dropna(subset=["date", "margin_balance", "short_balance", "total"])

    normalized = normalized.sort_values("date")
    normalized["date"] = normalized["date"].dt.strftime("%Y-%m-%d")
    return normalized


def fetch_margin() -> list[dict]:
    print("  抓取上交所融资融券汇总...")
    sh = normalize_market(ak.macro_china_market_margin_sh(), "上交所")
    print(f"    ✓ 上交所 {len(sh)} 行")

    print("  抓取深交所融资融券汇总...")
    sz = normalize_market(ak.macro_china_market_margin_sz(), "深交所")
    print(f"    ✓ 深交所 {len(sz)} 行")

    merged = pd.concat([sh, sz], ignore_index=True)
    grouped = (
        merged
        .groupby("date", as_index=False)[["margin_balance", "short_balance", "total"]]
        .sum()
        .sort_values("date")
    )

    for column in ["margin_balance", "short_balance", "total"]:
        grouped[column] = (grouped[column] / YUAN_PER_YI).round(2)

    return grouped.to_dict("records")


def main():
    print("=" * 60)
    print("抓取 A 股融资融券余额...")
    print("=" * 60)

    out_dir = os.path.join(OUTPUT_DIR, "margin")
    os.makedirs(out_dir, exist_ok=True)
    path = os.path.join(out_dir, "balance.json")

    try:
        data = fetch_margin()
    except Exception as exc:
        print(f"  ✗ 融资融券余额抓取失败: {exc}")
        print("  → 保留现有 public/api/margin/balance.json，不覆盖")
        return

    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False)
    touch_manifest_last_updated()
    print(f"  ✓ {len(data)} 行 → {path}")


if __name__ == "__main__":
    main()
