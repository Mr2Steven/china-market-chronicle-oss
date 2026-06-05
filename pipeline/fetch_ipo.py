"""
fetch_ipo.py
抓取 A 股 IPO 明细并汇总月度发行节奏，输出到 public/api/ipo/。

输出：
  detail.json  — [{code, name, date, price, amount}]
  monthly.json — [{month, count, amount}]
"""

import os
import json
import time
from typing import Any

import pandas as pd
import akshare as ak

from config import OUTPUT_DIR, touch_manifest_last_updated


def first_existing(columns: list[str], candidates: list[str]) -> str | None:
    """Return the first matching column, accepting substring matches."""
    for candidate in candidates:
        if candidate in columns:
            return candidate
    for candidate in candidates:
        for column in columns:
            if candidate in column:
                return column
    return None


def to_float(value: Any) -> float | None:
    """Convert AkShare numeric strings such as '-' or '12.3' to float."""
    if value is None or pd.isna(value):
        return None
    text = str(value).replace(",", "").strip()
    if text in {"", "-", "--", "nan", "None"}:
        return None
    try:
        return round(float(text), 2)
    except ValueError:
        return None


def fetch_raw_ipo() -> pd.DataFrame:
    """Fetch IPO data from the best available AkShare IPO endpoint."""
    endpoints = [
        ("stock_new_ipo_cninfo", lambda: ak.stock_new_ipo_cninfo()),
        ("stock_ipo_ths", lambda: ak.stock_ipo_ths()),
        ("stock_em_ipo", lambda: ak.stock_em_ipo()),
        ("stock_ipo_info", lambda: ak.stock_ipo_info()),
    ]

    last_error: Exception | None = None
    for name, loader in endpoints:
        if not hasattr(ak, name):
            continue
        try:
            print(f"  尝试 AkShare {name}...")
            df = loader()
            if df is not None and not df.empty:
                print(f"    ✓ {name}: {len(df)} 行")
                return df
        except Exception as exc:
            last_error = exc
            print(f"    ✗ {name} 失败: {exc}")
            time.sleep(1)

    if last_error:
        raise last_error
    raise RuntimeError("当前 AkShare 版本没有可用 IPO 接口")


def normalize_ipo(df: pd.DataFrame) -> list[dict]:
    """Normalize IPO rows to the frontend contract."""
    columns = [str(c).strip() for c in df.columns]
    df = df.copy()
    df.columns = columns

    code_col = first_existing(columns, ["股票代码", "证券代码", "证劵代码", "代码", "申购代码"])
    name_col = first_existing(columns, ["股票简称", "证券简称", "名称", "简称"])
    date_col = first_existing(columns, ["上市日期", "发行日期", "申购日期", "日期"])
    price_col = first_existing(columns, ["发行价格", "发行价", "价格"])
    amount_col = first_existing(columns, ["募集资金", "募资", "融资额", "发行总额"])

    if date_col is None:
        raise RuntimeError(f"无法识别 IPO 日期列，实际列名: {columns}")

    rows: list[dict] = []
    for _, row in df.iterrows():
        raw_date = row.get(date_col)
        date = pd.to_datetime(raw_date, errors="coerce")
        if pd.isna(date) and isinstance(raw_date, str):
            date = pd.to_datetime(f"{pd.Timestamp.today().year}-{raw_date.split()[0]}", errors="coerce")
        if pd.isna(date):
            continue

        rows.append({
            "code": str(row.get(code_col, "")).strip() if code_col else "",
            "name": str(row.get(name_col, "")).strip() if name_col else "",
            "date": date.strftime("%Y-%m-%d"),
            "price": to_float(row.get(price_col)) if price_col else None,
            "amount": to_float(row.get(amount_col)) if amount_col else None,
        })

    rows.sort(key=lambda item: item["date"])
    return rows


def compute_monthly(detail: list[dict]) -> list[dict]:
    """Aggregate normalized IPO rows by listing/issue month."""
    if not detail:
        return []

    df = pd.DataFrame(detail)
    df["month"] = pd.to_datetime(df["date"]).dt.strftime("%Y-%m")
    monthly = []
    for month, group in df.groupby("month", sort=True):
        amounts = [v for v in group["amount"].tolist() if v is not None]
        monthly.append({
            "month": month,
            "count": int(len(group)),
            "amount": round(sum(amounts), 2) if amounts else None,
        })
    return monthly


def main():
    print("=" * 60)
    print("抓取 A 股 IPO 数据...")
    print("=" * 60)

    out_dir = os.path.join(OUTPUT_DIR, "ipo")
    os.makedirs(out_dir, exist_ok=True)

    try:
        raw = fetch_raw_ipo()
        detail = normalize_ipo(raw)
        monthly = compute_monthly(detail)
    except Exception as exc:
        print(f"  ✗ IPO 数据抓取失败: {exc}")
        print("  → 保留现有 public/api/ipo/*.json，不覆盖")
        return

    detail_path = os.path.join(out_dir, "detail.json")
    with open(detail_path, "w", encoding="utf-8") as f:
        json.dump(detail, f, ensure_ascii=False)
    print(f"  ✓ 明细 {len(detail)} 行 → {detail_path}")

    monthly_path = os.path.join(out_dir, "monthly.json")
    with open(monthly_path, "w", encoding="utf-8") as f:
        json.dump(monthly, f, ensure_ascii=False)
    touch_manifest_last_updated()
    print(f"  ✓ 月度汇总 {len(monthly)} 行 → {monthly_path}")


if __name__ == "__main__":
    main()
