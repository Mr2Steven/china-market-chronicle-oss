"""
fetch_a7.py
抓取 A 股七巨头个股日线并合成等权指数，输出到 public/api/a7/。

个股：宁德时代 300750、贵州茅台 600519、比亚迪 002594、
      招商银行 600036、美的集团 000333、中芯国际 688981、海康威视 002415
"""

import os
import json
import time
import pandas as pd
import akshare as ak

from config import OUTPUT_DIR, touch_manifest_last_updated

A7_STOCKS = {
    "300750": "宁德时代",
    "600519": "贵州茅台",
    "002594": "比亚迪",
    "600036": "招商银行",
    "000333": "美的集团",
    "688981": "中芯国际",
    "002415": "海康威视",
}

# Sina Finance 前缀：sh = 上交所，sz = 深交所
SINA_PREFIX = {
    "300750": "sz300750",
    "600519": "sh600519",
    "002594": "sz002594",
    "600036": "sh600036",
    "000333": "sz000333",
    "688981": "sh688981",
    "002415": "sz002415",
}

COLORS = {
    "300750": "#C41E3A",
    "600519": "#8B4513",
    "002594": "#2D6A4F",
    "600036": "#1890FF",
    "000333": "#FA541C",
    "688981": "#722ED1",
    "002415": "#13C2C2",
}

START_DATE = "20200101"


def fetch_stock(symbol: str, retries: int = 4) -> pd.DataFrame | None:
    print(f"  抓取 {symbol} {A7_STOCKS[symbol]}...")
    for attempt in range(retries):
        try:
            df = ak.stock_zh_a_hist(
                symbol=symbol,
                period="daily",
                start_date=START_DATE,
                adjust="qfq",
            )
            col_date = "日期" if "日期" in df.columns else df.columns[0]
            col_close = "收盘" if "收盘" in df.columns else df.columns[4]
            df = df[[col_date, col_close]].copy()
            df.columns = ["date", "close"]
            df["date"] = pd.to_datetime(df["date"]).dt.strftime("%Y-%m-%d")
            df["close"] = df["close"].astype(float).round(4)
            df = df.dropna().reset_index(drop=True)
            print(f"    ✓ {len(df)} 行")
            return df
        except Exception as e:
            wait = (attempt + 1) * 4
            print(f"    ✗ 第 {attempt+1} 次失败: {e!s:.120}")
            if attempt < retries - 1:
                print(f"    → 等待 {wait}s 重试...")
                time.sleep(wait)
    # 回退：Sina Finance 接口
    sina_sym = SINA_PREFIX.get(symbol)
    if sina_sym:
        print(f"    → 尝试 Sina 回退 ({sina_sym})...")
        try:
            df = ak.stock_zh_a_daily(symbol=sina_sym, start_date=START_DATE.replace("-", ""), end_date="20501231", adjust="qfq")
            df["date"] = pd.to_datetime(df["date"]).dt.strftime("%Y-%m-%d")
            df["close"] = df["close"].astype(float).round(4)
            df = df[["date", "close"]].dropna().reset_index(drop=True)
            print(f"    ✓ (Sina) {len(df)} 行")
            return df
        except Exception as e2:
            print(f"    ✗ Sina 也失败: {e2!s:.120}")
    return None


def main():
    print("=" * 60)
    print("抓取 A 股七巨头日线数据...")
    print("=" * 60)

    out_dir = os.path.join(OUTPUT_DIR, "a7")
    os.makedirs(out_dir, exist_ok=True)

    all_dfs: dict[str, pd.DataFrame] = {}

    for code in A7_STOCKS:
        df = fetch_stock(code)
        if df is not None and len(df) > 0:
            all_dfs[code] = df
        time.sleep(3)

    if not all_dfs:
        print("✗ 没有成功抓取任何股票，退出")
        return

    # 找公共起始日期 — 所有股票都有数据的最早日期
    first_dates = [df["date"].min() for df in all_dfs.values()]
    common_start = max(first_dates)
    print(f"\n公共起始日期：{common_start}（{len(all_dfs)} 只股票）")

    # 以公共起始日为 100 归一化
    dates_set: set[str] = set()
    for df in all_dfs.values():
        df_trimmed = df[df["date"] >= common_start]
        dates_set.update(df_trimmed["date"].tolist())
    all_dates = sorted(dates_set)

    normed: dict[str, dict[str, float]] = {}
    for code, df in all_dfs.items():
        df_trimmed = df[df["date"] >= common_start].copy()
        base_price = df_trimmed.iloc[0]["close"]
        if base_price == 0:
            continue
        price_map = dict(zip(df_trimmed["date"], df_trimmed["close"]))
        normed[code] = {
            d: round((price_map[d] / base_price) * 100, 3)
            for d in all_dates
            if d in price_map
        }

    # 等权合成指数 — 每个交易日取可用股票归一化价格的均值
    index_series: dict[str, float] = {}
    for d in all_dates:
        vals = [normed[c][d] for c in normed if d in normed[c]]
        if vals:
            index_series[d] = round(sum(vals) / len(vals), 3)

    # 构造输出 JSON
    meta = [
        {"code": code, "name": name, "color": COLORS.get(code, "#999")}
        for code, name in A7_STOCKS.items()
        if code in normed
    ]

    series: dict[str, list[float | None]] = {}
    for code in normed:
        series[code] = [normed[code].get(d) for d in all_dates]
    series["index"] = [index_series.get(d) for d in all_dates]

    combined = {
        "start_date": common_start,
        "meta": meta,
        "dates": all_dates,
        "series": series,
    }

    path = os.path.join(out_dir, "combined.json")
    with open(path, "w", encoding="utf-8") as f:
        json.dump(combined, f, ensure_ascii=False)
    touch_manifest_last_updated()
    print(f"\n✓ 合并输出 → {path}（{len(all_dates)} 个交易日）")


if __name__ == "__main__":
    main()
