"""
fetch_return_decomp.py
抓取并计算年度回报拆分：PE 估值驱动 vs EPS 盈利驱动。

输出:
  public/api/return_decomp/data.json

数值单位:
  0.12 表示 12%
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

import akshare as ak
import pandas as pd

from config import OUTPUT_DIR, touch_manifest_last_updated


START_YEAR = 2010

INDEX_CONFIG = {
    "sh000001": {
        "name": "上证综指",
        "hist_symbol": "sh000001",
        "eastmoney_symbol": "000001",
        "funddb_symbol": "上证指数",
        "pe_symbol": "上证",
        "pe_loader": "stock_market_pe_lg",
    },
    "sh000300": {
        "name": "沪深300",
        "hist_symbol": "sh000300",
        "eastmoney_symbol": "000300",
        "funddb_symbol": "沪深300",
        "pe_symbol": "沪深300",
        "pe_loader": "stock_index_pe_lg",
    },
}


def first_existing(columns: list[str], candidates: list[str]) -> str | None:
    for candidate in candidates:
        if candidate in columns:
            return candidate
    for candidate in candidates:
        for column in columns:
            if candidate in column:
                return column
    return None


def normalize_price_frame(df: pd.DataFrame) -> pd.DataFrame:
    df = df.copy()
    df.columns = [str(col).strip() for col in df.columns]
    date_col = first_existing(list(df.columns), ["日期", "date", "时间"])
    close_col = first_existing(list(df.columns), ["收盘", "close", "收盘价"])
    if date_col is None or close_col is None:
        raise RuntimeError(f"无法识别指数价格字段: {list(df.columns)}")

    normalized = pd.DataFrame({
        "date": pd.to_datetime(df[date_col], errors="coerce"),
        "close": pd.to_numeric(df[close_col], errors="coerce"),
    }).dropna()
    normalized = normalized.sort_values("date")
    normalized["year"] = normalized["date"].dt.year
    return normalized


def normalize_pe_frame(df: pd.DataFrame) -> pd.DataFrame:
    df = df.copy()
    df.columns = [str(col).strip() for col in df.columns]
    date_col = first_existing(list(df.columns), ["日期", "date", "时间"])
    pe_col = first_existing(list(df.columns), ["滚动市盈率", "市盈率", "PE", "pe"])
    if date_col is None or pe_col is None:
        raise RuntimeError(f"无法识别 PE 字段: {list(df.columns)}")

    normalized = pd.DataFrame({
        "date": pd.to_datetime(df[date_col], errors="coerce"),
        "pe": pd.to_numeric(df[pe_col], errors="coerce"),
    }).dropna()
    normalized = normalized[normalized["pe"] > 0].sort_values("date")
    normalized["year"] = normalized["date"].dt.year
    return normalized


def fetch_yearly_price(config: dict[str, str]) -> pd.DataFrame:
    if hasattr(ak, "stock_zh_index_hist"):
        try:
            print(f"  尝试 stock_zh_index_hist({config['hist_symbol']}, yearly)...")
            return normalize_price_frame(ak.stock_zh_index_hist(symbol=config["hist_symbol"], period="yearly"))
        except Exception as exc:
            print(f"    ✗ stock_zh_index_hist 失败: {exc}")

    try:
        print(f"  尝试 stock_zh_index_daily({config['hist_symbol']})...")
        daily = normalize_price_frame(ak.stock_zh_index_daily(symbol=config["hist_symbol"]))
    except Exception as exc:
        print(f"    ✗ stock_zh_index_daily 失败: {exc}")
        print(f"  尝试 index_zh_a_hist({config['eastmoney_symbol']})...")
        daily = normalize_price_frame(ak.index_zh_a_hist(
            symbol=config["eastmoney_symbol"],
            period="daily",
            start_date="20090101",
            end_date="21000101",
        ))

    return daily.groupby("year", as_index=False).tail(1).reset_index(drop=True)


def fetch_pe(config: dict[str, str]) -> pd.DataFrame:
    if hasattr(ak, "index_value_hist_funddb"):
        try:
            print(f"  尝试 index_value_hist_funddb({config['funddb_symbol']}, 市盈率)...")
            return normalize_pe_frame(ak.index_value_hist_funddb(symbol=config["funddb_symbol"], indicator="市盈率"))
        except Exception as exc:
            print(f"    ✗ index_value_hist_funddb 失败: {exc}")

    loader_name = config["pe_loader"]
    print(f"  尝试 {loader_name}({config['pe_symbol']})...")
    loader = getattr(ak, loader_name)
    return normalize_pe_frame(loader(symbol=config["pe_symbol"]))


def compute_index(config: dict[str, str]) -> dict[str, dict[str, float]]:
    price = fetch_yearly_price(config)
    pe = fetch_pe(config)

    price_by_year = {
        int(row.year): float(row.close)
        for row in price.itertuples(index=False)
    }
    pe_by_year = {
        int(row.year): float(row.pe)
        for row in pe.groupby("year", as_index=False).tail(1).itertuples(index=False)
    }

    rows: dict[str, dict[str, float]] = {}
    candidate_years = sorted(set(price_by_year) & set(pe_by_year))
    for year in candidate_years:
        prev_year = year - 1
        if year < START_YEAR or prev_year not in price_by_year or prev_year not in pe_by_year:
            continue

        prev_close = price_by_year[prev_year]
        prev_pe = pe_by_year[prev_year]
        if prev_close <= 0 or prev_pe <= 0:
            continue

        total_return = (price_by_year[year] - prev_close) / prev_close
        pe_contribution = (pe_by_year[year] - prev_pe) / prev_pe
        eps_contribution = total_return - pe_contribution

        rows[str(year)] = {
            "total_return": round(total_return, 4),
            "pe_contribution": round(pe_contribution, 4),
            "eps_contribution": round(eps_contribution, 4),
        }

    return rows


def build_payload(index_rows: dict[str, dict[str, dict[str, float]]]) -> dict[str, Any]:
    years = sorted(set.intersection(*(set(rows.keys()) for rows in index_rows.values())))
    return {
        "years": years,
        "indices": {
            code: {
                "total_return": [rows[year]["total_return"] for year in years],
                "pe_contribution": [rows[year]["pe_contribution"] for year in years],
                "eps_contribution": [rows[year]["eps_contribution"] for year in years],
            }
            for code, rows in index_rows.items()
        },
    }


def main():
    print("=" * 60)
    print("抓取并计算回报拆分数据...")
    print("=" * 60)

    index_rows = {}
    for code, config in INDEX_CONFIG.items():
        print(f"\n{config['name']} ({code})")
        index_rows[code] = compute_index(config)

    payload = build_payload(index_rows)

    out_dir = os.path.join(OUTPUT_DIR, "return_decomp")
    os.makedirs(out_dir, exist_ok=True)
    path = os.path.join(out_dir, "data.json")
    with open(path, "w", encoding="utf-8") as f:
        json.dump(payload, f, ensure_ascii=False)
    touch_manifest_last_updated()

    print(f"\n✓ {len(payload['years'])} 年 → {path}")
    for code in INDEX_CONFIG:
        print(f"\n{INDEX_CONFIG[code]['name']} 最近 3 年:")
        series = payload["indices"][code]
        for idx, year in enumerate(payload["years"][-3:]):
            source_idx = len(payload["years"]) - 3 + idx
            print({
                "year": year,
                "total_return": series["total_return"][source_idx],
                "pe_contribution": series["pe_contribution"][source_idx],
                "eps_contribution": series["eps_contribution"][source_idx],
            })


if __name__ == "__main__":
    main()
