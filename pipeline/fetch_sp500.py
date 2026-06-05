"""
fetch_sp500.py
抓取 S&P 500 日线数据，输出到 public/api/sp500/daily.json。

优先使用 AkShare 的全球指数接口；若当前 AkShare 版本接口不可用，则保留
现有 JSON，避免全量刷新中断。
"""

import os
import json
import datetime as dt
from typing import Callable

import pandas as pd
import akshare as ak

from config import OUTPUT_DIR, touch_manifest_last_updated


START_DATE = "2005-01-01"


def first_existing(columns: list[str], candidates: list[str]) -> str | None:
    for candidate in candidates:
        if candidate in columns:
            return candidate
    for candidate in candidates:
        for column in columns:
            if candidate in column:
                return column
    return None


def normalize_daily(df: pd.DataFrame) -> list[dict]:
    columns = [str(c).strip() for c in df.columns]
    df = df.copy()
    df.columns = columns

    date_col = first_existing(columns, ["日期", "date", "时间"])
    close_col = first_existing(columns, ["收盘", "close", "最新价", "收盘价"])
    if date_col is None or close_col is None:
        raise RuntimeError(f"无法识别日期/收盘列，实际列名: {columns}")

    normalized = pd.DataFrame({
        "date": pd.to_datetime(df[date_col], errors="coerce"),
        "close": pd.to_numeric(df[close_col], errors="coerce"),
    }).dropna()
    normalized = normalized[normalized["date"] >= pd.to_datetime(START_DATE)]
    normalized = normalized.sort_values("date")
    normalized["date"] = normalized["date"].dt.strftime("%Y-%m-%d")
    normalized["close"] = normalized["close"].round(2)
    return normalized.to_dict("records")


def fetch_candidates() -> list[tuple[str, Callable[[], pd.DataFrame]]]:
    today = dt.date.today().strftime("%Y-%m-%d")
    compact_start = START_DATE.replace("-", "")
    compact_end = today.replace("-", "")

    candidates: list[tuple[str, Callable[[], pd.DataFrame]]] = []

    if hasattr(ak, "index_investing_global"):
        candidates.append((
            "index_investing_global",
            lambda: ak.index_investing_global(
                country="美国",
                index_name="标普500指数",
                period="每日",
                start_date=START_DATE,
                end_date=today,
            ),
        ))

    if hasattr(ak, "index_global_hist_em"):
        candidates.append((
            "index_global_hist_em",
            lambda: ak.index_global_hist_em(symbol="标普500"),
        ))

    if hasattr(ak, "index_us_stock_sina"):
        candidates.append((
            "index_us_stock_sina:.INX",
            lambda: ak.index_us_stock_sina(symbol=".INX"),
        ))

    if hasattr(ak, "stock_us_hist"):
        candidates.extend([
            ("stock_us_hist:.INX", lambda: ak.stock_us_hist(
                symbol=".INX",
                period="daily",
                start_date=compact_start,
                end_date=compact_end,
                adjust="",
            )),
            ("stock_us_hist:105.SPX", lambda: ak.stock_us_hist(
                symbol="105.SPX",
                period="daily",
                start_date=compact_start,
                end_date=compact_end,
                adjust="",
            )),
        ])

    return candidates


def fetch_sp500() -> list[dict]:
    last_error: Exception | None = None
    for name, loader in fetch_candidates():
        try:
            print(f"  尝试 AkShare {name}...")
            data = normalize_daily(loader())
            if data:
                print(f"    ✓ {name}: {len(data)} 行")
                return data
        except Exception as exc:
            last_error = exc
            print(f"    ✗ {name} 失败: {exc}")

    if last_error:
        raise last_error
    raise RuntimeError("当前 AkShare 版本没有可用 S&P 500 接口")


def main():
    print("=" * 60)
    print("抓取 S&P 500 日线数据...")
    print("=" * 60)

    out_dir = os.path.join(OUTPUT_DIR, "sp500")
    os.makedirs(out_dir, exist_ok=True)

    try:
        data = fetch_sp500()
    except Exception as exc:
        print(f"  ✗ S&P 500 数据抓取失败: {exc}")
        print("  → 保留现有 public/api/sp500/daily.json，不覆盖")
        return

    path = os.path.join(out_dir, "daily.json")
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False)
    touch_manifest_last_updated()
    print(f"  ✓ {len(data)} 行 → {path}")


if __name__ == "__main__":
    main()
