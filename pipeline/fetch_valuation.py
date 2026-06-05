"""
fetch_valuation.py
抓取指数 PE/PB 历史估值数据，输出 JSON 到 public/api/。
数据源：乐咕乐股 via AkShare。
"""

import os
import json
import time
import pandas as pd
import akshare as ak

from config import A_SHARE_INDICES, IndexDef, OUTPUT_DIR, touch_manifest_last_updated


def fetch_pe(idx: IndexDef):
    """抓取指数 PE-TTM 历史序列。"""
    if not idx.akshare_pe_symbol:
        print(f"  ⚠ {idx.name_cn} 无 PE 数据源，跳过")
        return

    print(f"  抓取 {idx.name_cn} PE ({idx.akshare_pe_symbol})...")
    try:
        # 尝试指数PE接口
        df = ak.stock_index_pe_lg(symbol=idx.akshare_pe_symbol)
        col_date = "日期" if "日期" in df.columns else df.columns[0]
        # 优先选滚动市盈率，其次静态市盈率，最后才取 columns[1]
        if "滚动市盈率" in df.columns:
            col_pe = "滚动市盈率"
        elif "市盈率" in df.columns:
            col_pe = "市盈率"
        else:
            col_pe = df.columns[1]
        df = df.rename(columns={col_date: "date", col_pe: "pe"})
        df["date"] = pd.to_datetime(df["date"]).dt.strftime("%Y-%m-%d")
        df["pe"] = df["pe"].round(2)

        data = df[["date", "pe"]].to_dict("records")

        out_dir = os.path.join(OUTPUT_DIR, idx.slug)
        os.makedirs(out_dir, exist_ok=True)
        path = os.path.join(out_dir, "pe.json")
        with open(path, "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False)
        print(f"    ✓ {len(data)} 行 → {path}")
    except Exception as e:
        print(f"    ✗ 失败: {e}")
        # 回退：尝试主板PE接口
        if idx.akshare_pe_symbol in ["上证A股", "深证A股"]:
            try:
                print(f"    → 尝试 stock_market_pe_lg 回退...")
                df = ak.stock_market_pe_lg(symbol=idx.akshare_pe_symbol)
                col_date = df.columns[0]
                col_pe = "市盈率" if "市盈率" in df.columns else df.columns[2]
                df = df.rename(columns={col_date: "date", col_pe: "pe"})
                df["date"] = pd.to_datetime(df["date"]).dt.strftime("%Y-%m-%d")
                df["pe"] = df["pe"].round(2)
                data = df[["date", "pe"]].to_dict("records")
                out_dir = os.path.join(OUTPUT_DIR, idx.slug)
                os.makedirs(out_dir, exist_ok=True)
                path = os.path.join(out_dir, "pe.json")
                with open(path, "w", encoding="utf-8") as f:
                    json.dump(data, f, ensure_ascii=False)
                print(f"    ✓ (回退) {len(data)} 行 → {path}")
            except Exception as e2:
                print(f"    ✗ 回退也失败: {e2}")

    time.sleep(1)


def fetch_pb(idx: IndexDef):
    """抓取指数 PB 历史序列。"""
    if not idx.akshare_pb_symbol:
        print(f"  ⚠ {idx.name_cn} 无 PB 数据源，跳过")
        return

    print(f"  抓取 {idx.name_cn} PB ({idx.akshare_pb_symbol})...")
    try:
        df = ak.stock_index_pb_lg(symbol=idx.akshare_pb_symbol)
        col_date = "日期" if "日期" in df.columns else df.columns[0]
        col_pb = "市净率" if "市净率" in df.columns else df.columns[1]
        df = df.rename(columns={col_date: "date", col_pb: "pb"})
        df["date"] = pd.to_datetime(df["date"]).dt.strftime("%Y-%m-%d")
        df["pb"] = df["pb"].round(2)

        data = df[["date", "pb"]].to_dict("records")

        out_dir = os.path.join(OUTPUT_DIR, idx.slug)
        os.makedirs(out_dir, exist_ok=True)
        path = os.path.join(out_dir, "pb.json")
        with open(path, "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False)
        print(f"    ✓ {len(data)} 行 → {path}")
    except Exception as e:
        print(f"    ✗ 失败: {e}")

    time.sleep(1)


def main():
    print("=" * 60)
    print("抓取估值数据 (PE/PB)...")
    print("=" * 60)

    for idx in A_SHARE_INDICES:
        fetch_pe(idx)
        fetch_pb(idx)

    touch_manifest_last_updated()
    print("\n估值数据抓取完成。")


if __name__ == "__main__":
    main()
