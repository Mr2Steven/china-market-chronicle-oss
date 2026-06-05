"""
fetch_extras.py
抓取中国特色数据：北向资金、沪深300成分股、A/H溢价。
"""

import os
import json
import time
import pandas as pd
import akshare as ak

from config import OUTPUT_DIR, touch_manifest_last_updated


def fetch_northbound():
    """抓取北向资金（沪深港通）日度净流入。"""
    print("抓取北向资金...")
    try:
        if hasattr(ak, "stock_hsgt_north_net_flow_in_em"):
            df = ak.stock_hsgt_north_net_flow_in_em(symbol="北向资金")
        else:
            df = ak.stock_hsgt_hist_em(symbol="北向资金")
        # 列名可能随版本变化，做兼容处理
        df.columns = [c.strip() for c in df.columns]

        # 尝试识别日期列和净流入列
        date_col = None
        flow_col = None
        for c in df.columns:
            if "日期" in c or "date" in c.lower():
                date_col = c
            if "成交净买额" in c or "净流入" in c or "净买入" in c or "flow" in c.lower():
                flow_col = c

        if date_col is None:
            date_col = df.columns[0]
        if flow_col is None:
            flow_col = df.columns[1]

        df = df.rename(columns={date_col: "date", flow_col: "net_flow"})
        df["date"] = pd.to_datetime(df["date"]).dt.strftime("%Y-%m-%d")
        df["net_flow"] = pd.to_numeric(df["net_flow"], errors="coerce").round(2)

        # 计算累计
        df["cumulative"] = df["net_flow"].cumsum().round(2)

        data = df[["date", "net_flow", "cumulative"]].dropna().to_dict("records")

        out_dir = os.path.join(OUTPUT_DIR, "northbound")
        os.makedirs(out_dir, exist_ok=True)
        path = os.path.join(out_dir, "flow.json")
        with open(path, "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False)
        print(f"  ✓ {len(data)} 行 → {path}")
    except Exception as e:
        print(f"  ✗ 失败: {e}")
        print("  → 保留现有 public/api/northbound/flow.json，不覆盖")


def fetch_constituents():
    """抓取沪深300当前成分股及权重。"""
    print("抓取沪深300成分股...")
    try:
        df = ak.index_stock_cons_weight_csindex(symbol="000300")
        # 取最新日期的数据
        latest_date = df["日期"].max()
        df = df[df["日期"] == latest_date]

        data = []
        for _, row in df.iterrows():
            data.append({
                "code": str(row.get("成分券代码", row.get("股票代码", ""))),
                "name": str(row.get("成分券名称", row.get("股票名称", ""))),
                "weight": round(float(row.get("权重", 0)), 4),
            })

        # 按权重降序排列
        data.sort(key=lambda x: x["weight"], reverse=True)

        out_dir = os.path.join(OUTPUT_DIR, "hs300")
        os.makedirs(out_dir, exist_ok=True)
        path = os.path.join(out_dir, "constituents.json")
        with open(path, "w", encoding="utf-8") as f:
            json.dump({
                "date": str(latest_date),
                "count": len(data),
                "stocks": data,
            }, f, ensure_ascii=False, indent=None)
        print(f"  ✓ {len(data)} 只成分股 → {path}")
    except Exception as e:
        print(f"  ✗ 失败: {e}")
        print(f"  提示: 如果此接口不可用，尝试 ak.index_stock_cons(symbol='000300')")


def fetch_ah_premium():
    """抓取 A/H 溢价指数（恒生沪深港通AH股溢价指数）。"""
    print("抓取 A/H 溢价指数...")
    try:
        # HSAHP 恒生AH溢价指数
        df = ak.stock_hk_index_daily_em(symbol="HSAHP")
        df["date"] = pd.to_datetime(df["date"]).dt.strftime("%Y-%m-%d")
        df["premium"] = pd.to_numeric(df["close"], errors="coerce").round(2)

        data = df[["date", "premium"]].dropna().to_dict("records")

        out_dir = os.path.join(OUTPUT_DIR, "ah-premium")
        os.makedirs(out_dir, exist_ok=True)
        path = os.path.join(out_dir, "index.json")
        with open(path, "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False)
        print(f"  ✓ {len(data)} 行 → {path}")
    except Exception as e:
        print(f"  ✗ 失败: {e}")
        print("  → 保留现有 public/api/ah-premium/index.json，不覆盖")


def main():
    print("=" * 60)
    print("抓取中国特色数据...")
    print("=" * 60)

    fetch_northbound()
    time.sleep(1)
    fetch_constituents()
    time.sleep(1)
    fetch_ah_premium()
    touch_manifest_last_updated()

    print("\n中国特色数据抓取完成。")


if __name__ == "__main__":
    main()
