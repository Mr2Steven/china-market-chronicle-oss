"""
fetch_commodities.py
抓取铜、原油、黄金与上证综指数据，输出归一化对比面板所需原始价格。

输出:
  public/api/commodities/data.json
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


START_DATE = "2010-01-01"
START_TOLERANCE_DAYS = 10
SHANGHAI_DAILY_PATH = os.path.join(OUTPUT_DIR, "shanghai", "daily.json")


def first_existing(columns: list[str], candidates: list[str]) -> str | None:
    for candidate in candidates:
        if candidate in columns:
            return candidate
    for candidate in candidates:
        for column in columns:
            if candidate in column:
                return column
    return None


def normalize_price(df: pd.DataFrame, label: str) -> pd.DataFrame:
    df = df.copy()
    df.columns = [str(col).strip() for col in df.columns]
    print(f"  {label} columns: {list(df.columns)}")
    print(df.head(3).to_string(index=False))

    date_col = first_existing(list(df.columns), ["date", "日期", "交易时间", "时间"])
    value_col = first_existing(list(df.columns), ["close", "收盘", "收盘价", "最新价", "晚盘价", "value"])
    if date_col is None or value_col is None:
        raise RuntimeError(f"{label} 无法识别日期/价格字段: {list(df.columns)}")

    normalized = pd.DataFrame({
        "date": pd.to_datetime(df[date_col], errors="coerce"),
        "value": pd.to_numeric(df[value_col], errors="coerce"),
    }).dropna()
    normalized = normalized[normalized["date"] >= pd.to_datetime(START_DATE)]
    normalized = normalized.sort_values("date")
    normalized["date"] = normalized["date"].dt.strftime("%Y-%m-%d")
    return normalized[["date", "value"]]


def fetch_with_candidates(label: str, candidates: list[tuple[str, Any]], min_start: str = START_DATE) -> pd.DataFrame:
    fallback: pd.DataFrame | None = None
    fallback_name = ""
    target_start = pd.to_datetime(min_start)
    latest_acceptable_start = target_start + pd.Timedelta(days=START_TOLERANCE_DAYS)

    for name, loader in candidates:
        try:
            print(f"\n抓取 {label}: {name}")
            data = normalize_price(loader(), f"{label}/{name}")
            if data.empty:
                raise RuntimeError("无有效数据")
            first_date = data["date"].iloc[0]
            last_date = data["date"].iloc[-1]
            print(f"  ✓ {len(data)} 行，{first_date} → {last_date}")
            if pd.to_datetime(first_date) <= latest_acceptable_start:
                return data
            if fallback is None or first_date < fallback["date"].iloc[0]:
                fallback = data
                fallback_name = name
                print(f"  ⚠ {name} 起始日 {first_date} 晚于 {min_start}，继续寻找更长历史")
        except Exception as exc:
            print(f"  ✗ {name} 失败: {exc}")

    if fallback is not None:
        print(f"  → 使用可用 fallback: {fallback_name}")
        return fallback

    raise RuntimeError(f"{label} 没有可用数据源")


def fetch_copper() -> pd.DataFrame:
    candidates = []
    if hasattr(ak, "macro_euro_copper_spot"):
        candidates.append(("macro_euro_copper_spot", lambda: ak.macro_euro_copper_spot()))
    if hasattr(ak, "futures_foreign_hist"):
        candidates.extend([
            ("futures_foreign_hist(CAD)", lambda: ak.futures_foreign_hist(symbol="CAD")),
            ("futures_foreign_hist(HG)", lambda: ak.futures_foreign_hist(symbol="HG")),
        ])
    if hasattr(ak, "macro_cons_copper"):
        candidates.append(("macro_cons_copper", lambda: ak.macro_cons_copper()))
    if hasattr(ak, "futures_zh_daily_sina"):
        candidates.append(("futures_zh_daily_sina(CU0)", lambda: ak.futures_zh_daily_sina(symbol="CU0")))
    return fetch_with_candidates("铜价", candidates)


def fetch_oil() -> pd.DataFrame:
    candidates = []
    if hasattr(ak, "macro_cons_oil_market"):
        candidates.append(("macro_cons_oil_market", lambda: ak.macro_cons_oil_market()))
    if hasattr(ak, "oil_price_hist"):
        candidates.append(("oil_price_hist", lambda: ak.oil_price_hist()))
    if hasattr(ak, "futures_foreign_hist"):
        candidates.append(("futures_foreign_hist(CL)", lambda: ak.futures_foreign_hist(symbol="CL")))
    if hasattr(ak, "macro_euro_brent_spot"):
        candidates.append(("macro_euro_brent_spot", lambda: ak.macro_euro_brent_spot()))
    return fetch_with_candidates("原油", candidates)


def fetch_gold() -> pd.DataFrame:
    candidates = []
    if hasattr(ak, "macro_cons_gold"):
        candidates.append(("macro_cons_gold", lambda: ak.macro_cons_gold()))
    if hasattr(ak, "spot_hist"):
        candidates.append(("spot_hist(黄金)", lambda: ak.spot_hist(symbol="黄金")))
    if hasattr(ak, "futures_foreign_hist"):
        candidates.append(("futures_foreign_hist(XAU)", lambda: ak.futures_foreign_hist(symbol="XAU")))
    if hasattr(ak, "spot_golden_benchmark_sge"):
        candidates.append(("spot_golden_benchmark_sge", lambda: ak.spot_golden_benchmark_sge()))
    if hasattr(ak, "macro_euro_gold_spot"):
        candidates.append(("macro_euro_gold_spot", lambda: ak.macro_euro_gold_spot()))
    return fetch_with_candidates("黄金", candidates)


def load_shanghai() -> pd.DataFrame:
    with open(SHANGHAI_DAILY_PATH, encoding="utf-8") as f:
        data = json.load(f)
    df = pd.DataFrame(data)
    normalized = pd.DataFrame({
        "date": pd.to_datetime(df["date"], errors="coerce"),
        "sh_close": pd.to_numeric(df["close"], errors="coerce"),
    }).dropna()
    normalized = normalized[normalized["date"] >= pd.to_datetime(START_DATE)]
    normalized = normalized.sort_values("date")
    normalized["date"] = normalized["date"].dt.strftime("%Y-%m-%d")
    return normalized


def align_to_shanghai(shanghai: pd.DataFrame, series: dict[str, pd.DataFrame]) -> pd.DataFrame:
    aligned = shanghai.copy()
    for name, df in series.items():
        values = df.rename(columns={"value": name})
        aligned = pd.merge(aligned, values, on="date", how="left")
        aligned[name] = aligned[name].ffill()
    return aligned.dropna(subset=list(series.keys()))


def main():
    print("=" * 60)
    print("抓取大宗商品联动数据...")
    print("=" * 60)

    try:
        shanghai = load_shanghai()
        copper = fetch_copper()
        oil = fetch_oil()
        gold = fetch_gold()
        aligned = align_to_shanghai(shanghai, {"copper": copper, "oil": oil, "gold": gold})
    except Exception as exc:
        print(f"  ✗ 大宗商品数据生成失败: {exc}")
        print("  → 保留现有 public/api/commodities/data.json，不覆盖")
        return

    payload = {
        "dates": aligned["date"].tolist(),
        "copper": aligned["copper"].round(4).tolist(),
        "oil": aligned["oil"].round(4).tolist(),
        "gold": aligned["gold"].round(4).tolist(),
        "sh_close": aligned["sh_close"].round(4).tolist(),
    }

    out_dir = os.path.join(OUTPUT_DIR, "commodities")
    os.makedirs(out_dir, exist_ok=True)
    path = os.path.join(out_dir, "data.json")
    with open(path, "w", encoding="utf-8") as f:
        json.dump(payload, f, ensure_ascii=False)
    touch_manifest_last_updated()

    print(f"\n✓ {len(payload['dates'])} 行 → {path}")
    print("最近 3 条:")
    for idx in range(max(0, len(payload["dates"]) - 3), len(payload["dates"])):
        print({
            "date": payload["dates"][idx],
            "copper": payload["copper"][idx],
            "oil": payload["oil"][idx],
            "gold": payload["gold"][idx],
            "sh_close": payload["sh_close"][idx],
        })


if __name__ == "__main__":
    main()
