"""
fetch_bond_equity.py
计算股债性价比：沪深300隐含收益率 vs 10年期国债收益率。

输出:
  public/api/bond_equity/data.json

收益率单位:
  0.035 表示 3.5%
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


START_DATE = "2005-01-01"
HS300_PE_PATH = os.path.join(OUTPUT_DIR, "hs300", "pe.json")


def first_existing(columns: list[str], candidates: list[str]) -> str | None:
    for candidate in candidates:
        if candidate in columns:
            return candidate
    for candidate in candidates:
        for column in columns:
            if candidate in column:
                return column
    return None


def to_decimal_yield(value: Any) -> float | None:
    if value is None or pd.isna(value):
        return None
    number = float(value)
    # AkShare bond yield endpoints usually return percent values, e.g. 2.4.
    return number / 100 if abs(number) > 1 else number


def normalize_bond_yield(df: pd.DataFrame) -> pd.DataFrame:
    df = df.copy()
    df.columns = [str(col).strip() for col in df.columns]
    date_col = first_existing(list(df.columns), ["日期", "date", "时间"])
    yield_col = first_existing(list(df.columns), ["中国国债收益率10年", "10年期国债", "10年", "收益率"])
    if date_col is None or yield_col is None:
        raise RuntimeError(f"无法识别 10 年期国债收益率字段: {list(df.columns)}")

    normalized = pd.DataFrame({
        "date": pd.to_datetime(df[date_col], errors="coerce"),
        "yield_10y": df[yield_col].map(to_decimal_yield),
    }).dropna()
    normalized = normalized[normalized["date"] >= pd.to_datetime(START_DATE)]
    normalized = normalized.sort_values("date")
    normalized["date"] = normalized["date"].dt.strftime("%Y-%m-%d")
    return normalized


def fetch_bond_yield() -> pd.DataFrame:
    if hasattr(ak, "bond_zh_us_rate"):
        try:
            print("  尝试 bond_zh_us_rate(start_date='19900101')...")
            return normalize_bond_yield(ak.bond_zh_us_rate(start_date="19900101"))
        except Exception as exc:
            print(f"    ✗ bond_zh_us_rate 失败: {exc}")

    if hasattr(ak, "bond_china_close_return"):
        print("  尝试 bond_china_close_return(symbol='10年期国债')...")
        return normalize_bond_yield(ak.bond_china_close_return(symbol="10年期国债"))

    raise RuntimeError("当前 AkShare 版本没有可用的中国 10 年期国债收益率接口")


def load_hs300_pe() -> pd.DataFrame:
    with open(HS300_PE_PATH, encoding="utf-8") as f:
        data = json.load(f)
    df = pd.DataFrame(data)
    normalized = pd.DataFrame({
        "date": pd.to_datetime(df["date"], errors="coerce"),
        "pe": pd.to_numeric(df["pe"], errors="coerce"),
    }).dropna()
    normalized = normalized[(normalized["date"] >= pd.to_datetime(START_DATE)) & (normalized["pe"] > 0)]
    normalized["date"] = normalized["date"].dt.strftime("%Y-%m-%d")
    normalized["earnings_yield"] = 1 / normalized["pe"]
    return normalized[["date", "earnings_yield"]].sort_values("date")


def compute_payload() -> dict[str, Any]:
    bond = fetch_bond_yield()
    equity = load_hs300_pe()
    merged = pd.merge(equity, bond, on="date", how="inner").sort_values("date")
    if merged.empty:
        raise RuntimeError("沪深300 PE 与 10 年期国债收益率没有可对齐日期")

    merged["erp"] = merged["earnings_yield"] - merged["yield_10y"]
    erp_mean = float(merged["erp"].mean())
    erp_std = float(merged["erp"].std(ddof=0))

    return {
        "dates": merged["date"].tolist(),
        "yield_10y": merged["yield_10y"].round(4).tolist(),
        "earnings_yield": merged["earnings_yield"].round(4).tolist(),
        "erp": merged["erp"].round(4).tolist(),
        "erp_mean": round(erp_mean, 4),
        "erp_std": round(erp_std, 4),
        "erp_plus1std": round(erp_mean + erp_std, 4),
        "erp_minus1std": round(erp_mean - erp_std, 4),
    }


def main():
    print("=" * 60)
    print("计算股债性价比 ERP...")
    print("=" * 60)

    out_dir = os.path.join(OUTPUT_DIR, "bond_equity")
    os.makedirs(out_dir, exist_ok=True)
    path = os.path.join(out_dir, "data.json")

    try:
        payload = compute_payload()
    except Exception as exc:
        print(f"  ✗ 股债性价比数据生成失败: {exc}")
        print("  → 保留现有 public/api/bond_equity/data.json，不覆盖")
        return

    with open(path, "w", encoding="utf-8") as f:
        json.dump(payload, f, ensure_ascii=False)
    touch_manifest_last_updated()

    print(f"  ✓ {len(payload['dates'])} 行 → {path}")
    print(f"  erp_mean: {payload['erp_mean']}")
    print("  最近 5 条:")
    for idx in range(max(0, len(payload["dates"]) - 5), len(payload["dates"])):
        print({
            "date": payload["dates"][idx],
            "yield_10y": payload["yield_10y"][idx],
            "earnings_yield": payload["earnings_yield"][idx],
            "erp": payload["erp"][idx],
        })


if __name__ == "__main__":
    main()
