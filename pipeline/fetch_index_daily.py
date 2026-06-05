"""
fetch_index_daily.py
抓取所有指数的日线历史数据，保存为 CSV 到 pipeline/raw/ 目录。
CC 执行时先运行此脚本，确认数据正常后再运行 compute_derived.py。
"""

import os
import sys
import time
import pandas as pd
import akshare as ak

from config import ALL_INDICES, IndexDef, OUTPUT_DIR

RAW_DIR = os.path.join(os.path.dirname(__file__), "raw")
os.makedirs(RAW_DIR, exist_ok=True)


def fetch_a_share_index(idx: IndexDef) -> pd.DataFrame:
    """
    抓取 A 股指数日线数据。
    优先用 index_zh_a_hist (东方财富源)，失败则回退 stock_zh_index_daily (新浪源)。
    """
    print(f"  [A股] 抓取 {idx.name_cn} ({idx.code})...")
    try:
        df = ak.index_zh_a_hist(
            symbol=idx.akshare_hist_symbol,
            period="daily",
            start_date=idx.start_date,
            end_date="21000101",  # 未来日期，AkShare 会自动截断到最新
        )
        df = df.rename(columns={
            "日期": "date",
            "开盘": "open",
            "收盘": "close",
            "最高": "high",
            "最低": "low",
            "成交量": "volume",
            "成交额": "amount",
            "涨跌幅": "change_pct",
        })
        df["date"] = pd.to_datetime(df["date"]).dt.strftime("%Y-%m-%d")
        print(f"    ✓ {len(df)} 行，{df['date'].iloc[0]} → {df['date'].iloc[-1]}")
        return df[["date", "open", "close", "high", "low", "volume", "amount", "change_pct"]]
    except Exception as e:
        print(f"    ✗ index_zh_a_hist 失败: {e}")
        print(f"    → 尝试 stock_zh_index_daily 回退...")
        try:
            df = ak.stock_zh_index_daily(symbol=idx.akshare_daily_symbol)
            df = df.reset_index()
            df = df.rename(columns={"date": "date"})
            df["date"] = pd.to_datetime(df["date"]).dt.strftime("%Y-%m-%d")
            df["change_pct"] = df["close"].pct_change() * 100
            print(f"    ✓ (回退) {len(df)} 行")
            return df[["date", "open", "close", "high", "low", "volume"]]
        except Exception as e2:
            print(f"    ✗ 回退也失败: {e2}")
            return pd.DataFrame()


def fetch_hk_index(idx: IndexDef) -> pd.DataFrame:
    """
    抓取港股指数日线数据。
    优先使用 stock_hk_index_daily_em (东方财富源)，失败则回退 Sina。
    """
    print(f"  [港股] 抓取 {idx.name_cn} ({idx.akshare_hk_symbol})...")
    try:
        df = ak.stock_hk_index_daily_em(symbol=idx.akshare_hk_symbol)
        df = df.rename(columns={"date": "date"})
        df["date"] = pd.to_datetime(df["date"]).dt.strftime("%Y-%m-%d")
        df["change_pct"] = df["close"].pct_change() * 100
        print(f"    ✓ {len(df)} 行，{df['date'].iloc[0]} → {df['date'].iloc[-1]}")
        return df[["date", "open", "close", "high", "low", "volume", "change_pct"]]
    except Exception as e:
        print(f"    ✗ 失败: {e}")
        print(f"    → 尝试 stock_hk_index_daily_sina 回退...")
        try:
            df = ak.stock_hk_index_daily_sina(symbol=idx.akshare_hk_symbol)
            df["date"] = pd.to_datetime(df["date"]).dt.strftime("%Y-%m-%d")
            df["change_pct"] = df["close"].pct_change() * 100
            print(f"    ✓ (Sina) {len(df)} 行，{df['date'].iloc[0]} → {df['date'].iloc[-1]}")
            return df[["date", "open", "close", "high", "low", "volume", "change_pct"]]
        except Exception as e2:
            print(f"    ✗ Sina 回退也失败: {e2}")
            return pd.DataFrame()


def fetch_all():
    """抓取全部指数并保存。"""
    print("=" * 60)
    print("开始抓取全部指数日线数据...")
    print("=" * 60)

    for idx in ALL_INDICES:
        if idx.market == "a":
            df = fetch_a_share_index(idx)
        elif idx.market == "hk":
            df = fetch_hk_index(idx)
        else:
            continue

        if df.empty:
            print(f"  ⚠ {idx.name_cn} 无数据，跳过")
            continue

        path = os.path.join(RAW_DIR, f"{idx.slug}_daily.csv")
        df.to_csv(path, index=False)
        print(f"    → 已保存: {path}")

        # AkShare 有频率限制，间隔 1 秒
        time.sleep(1)

    print("\n全部抓取完成。")


if __name__ == "__main__":
    fetch_all()
