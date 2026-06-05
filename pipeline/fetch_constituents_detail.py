"""
fetch_constituents_detail.py
为 HS300 成分股补充行业分类和市值数据，用于 A17 行业树形图和 A18 成分股散点图。

输出：
  public/api/hs300/industry-weights.json  — 申万一级行业权重汇总（A17）
  public/api/hs300/constituents-detail.json — 带行业+市值+YTD的明细（A18）
"""

import os
import json
import time
import pandas as pd
import akshare as ak

from config import OUTPUT_DIR, touch_manifest_last_updated

HS300_CONSTITUENTS_PATH = os.path.join(OUTPUT_DIR, "hs300", "constituents.json")


def load_constituents() -> dict[str, dict]:
    """加载 constituents.json，返回 {code: {name, weight}} 映射。"""
    with open(HS300_CONSTITUENTS_PATH, encoding="utf-8") as f:
        data = json.load(f)
    return {s["code"]: {"name": s["name"], "weight": s["weight"]} for s in data["stocks"]}


def fetch_industry_mapping(hs300_codes: set[str]) -> dict[str, str]:
    """
    用申万行业成分接口逐行业抓取，反向建立 code→industry 映射。
    只记录属于 HS300 的股票。
    """
    print("  获取申万一级行业列表...")
    try:
        industry_df = ak.stock_board_industry_name_em()
        # 通常有 "板块名称" 列
        col = "板块名称" if "板块名称" in industry_df.columns else industry_df.columns[0]
        industries = industry_df[col].tolist()
    except Exception as e:
        print(f"  ✗ 获取行业列表失败: {e}")
        return {}

    print(f"  共 {len(industries)} 个行业板块")
    code_to_industry: dict[str, str] = {}

    for ind in industries:
        try:
            cons_df = ak.stock_board_industry_cons_em(symbol=ind)
            code_col = "代码" if "代码" in cons_df.columns else cons_df.columns[1]
            codes = cons_df[code_col].astype(str).tolist()
            for code in codes:
                code_stripped = code.lstrip("0") if False else code  # 保留原始代码格式
                if code in hs300_codes:
                    code_to_industry[code] = ind
            time.sleep(0.5)
        except Exception as e:
            print(f"    ✗ {ind}: {e}")
            time.sleep(1)

    matched = len(code_to_industry)
    print(f"  匹配到 {matched}/{len(hs300_codes)} 只 HS300 成分股行业")
    return code_to_industry


def fetch_spot_data() -> dict[str, dict]:
    """
    用 stock_zh_a_spot_em 一次性获取所有 A 股现货数据（市值、YTD 涨跌幅）。
    返回 {code: {market_cap_bn, ytd_return}} 映射。
    """
    print("  获取 A 股现货数据（市值/YTD）...")
    try:
        df = ak.stock_zh_a_spot_em()
        # 标准化列名
        col_code = "代码" if "代码" in df.columns else df.columns[1]
        col_cap = next((c for c in df.columns if "总市值" in c), None)
        col_ytd = next((c for c in df.columns if "年初至今" in c), None)

        df[col_code] = df[col_code].astype(str)
        result: dict[str, dict] = {}
        for _, row in df.iterrows():
            code = row[col_code]
            market_cap = float(row[col_cap]) / 1e8 if col_cap and pd.notna(row[col_cap]) else None  # 转为亿
            # 年初至今涨跌幅直接是百分比数值（如 15.3 = 15.3%）
            ytd = float(row[col_ytd]) if col_ytd and pd.notna(row[col_ytd]) else None
            result[code] = {"market_cap_bn": round(market_cap, 1) if market_cap else None, "ytd_return": round(ytd, 2) if ytd is not None else None}
        print(f"  ✓ 获取 {len(result)} 只股票现货数据")
        return result
    except Exception as e:
        print(f"  ✗ 获取现货数据失败: {e}")
        return {}


def load_existing_detail() -> dict[str, dict]:
    """加载已有明细，作为上游失败时的字段兜底。"""
    detail_path = os.path.join(OUTPUT_DIR, "hs300", "constituents-detail.json")
    if not os.path.exists(detail_path):
        return {}
    try:
        with open(detail_path, encoding="utf-8") as f:
            data = json.load(f)
        return {str(item["code"]): item for item in data}
    except Exception as e:
        print(f"  ⚠ 读取已有成分股明细失败: {e}")
        return {}


def main():
    print("=" * 60)
    print("补充 HS300 成分股行业与市值数据...")
    print("=" * 60)

    constituents = load_constituents()
    hs300_codes = set(constituents.keys())
    print(f"HS300 成分股：{len(hs300_codes)} 只")

    # 1. 获取行业映射
    code_to_industry = fetch_industry_mapping(hs300_codes)

    # 2. 获取市值 + YTD
    spot_data = fetch_spot_data()
    existing_detail = load_existing_detail()

    if not code_to_industry and not spot_data and existing_detail:
        print("  ⚠ 行业和现货接口均失败，保留现有明细与行业权重，不覆盖")
        return

    # 3. 合并明细数据
    detail_list = []
    for code, info in constituents.items():
        existing = existing_detail.get(code, {})
        industry = code_to_industry.get(code) or existing.get("industry") or "其他"
        spot = spot_data.get(code, {})
        detail_list.append({
            "code": code,
            "name": info["name"],
            "weight": info["weight"],
            "industry": industry,
            "market_cap_bn": spot.get("market_cap_bn") if spot.get("market_cap_bn") is not None else existing.get("market_cap_bn"),
            "ytd_return": spot.get("ytd_return") if spot.get("ytd_return") is not None else existing.get("ytd_return"),
        })

    # 按权重降序
    detail_list.sort(key=lambda x: x["weight"], reverse=True)

    out_dir = os.path.join(OUTPUT_DIR, "hs300")
    os.makedirs(out_dir, exist_ok=True)

    detail_path = os.path.join(out_dir, "constituents-detail.json")
    with open(detail_path, "w", encoding="utf-8") as f:
        json.dump(detail_list, f, ensure_ascii=False)
    print(f"\n✓ 成分股明细 → {detail_path}")

    # 4. 按行业汇总权重 → industry-weights.json
    industry_agg: dict[str, dict] = {}
    for item in detail_list:
        ind = item["industry"]
        if ind not in industry_agg:
            industry_agg[ind] = {"industry": ind, "weight": 0.0, "count": 0, "stocks": []}
        industry_agg[ind]["weight"] = round(industry_agg[ind]["weight"] + item["weight"], 3)
        industry_agg[ind]["count"] += 1
        industry_agg[ind]["stocks"].append({
            "code": item["code"],
            "name": item["name"],
            "weight": item["weight"],
        })

    industry_list = sorted(industry_agg.values(), key=lambda x: x["weight"], reverse=True)

    weights_path = os.path.join(out_dir, "industry-weights.json")
    with open(weights_path, "w", encoding="utf-8") as f:
        json.dump(industry_list, f, ensure_ascii=False)
    touch_manifest_last_updated()
    print(f"✓ 行业权重 → {weights_path}（{len(industry_list)} 个行业）")


if __name__ == "__main__":
    main()
