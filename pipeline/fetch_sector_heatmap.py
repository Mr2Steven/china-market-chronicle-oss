"""
fetch_sector_heatmap.py
抓取申万一级行业指数，计算行业轮动热力图所需区间涨跌幅。

输出:
  public/api/sector_heatmap/data.json
"""

import json
import os
import sys


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

from config import OUTPUT_DIR, current_update_date, touch_manifest_last_updated


SECTORS = [
    ("801010", "农林牧渔"),
    ("801020", "采掘"),
    ("801030", "化工"),
    ("801040", "钢铁"),
    ("801050", "有色金属"),
    ("801080", "电子"),
    ("801110", "家用电器"),
    ("801120", "食品饮料"),
    ("801130", "纺织服装"),
    ("801140", "轻工制造"),
    ("801150", "医药生物"),
    ("801160", "公用事业"),
    ("801170", "交通运输"),
    ("801180", "房地产"),
    ("801200", "商业贸易"),
    ("801210", "休闲服务"),
    ("801230", "综合"),
    ("801710", "建筑材料"),
    ("801720", "建筑装饰"),
    ("801730", "电气设备"),
    ("801740", "国防军工"),
    ("801750", "计算机"),
    ("801760", "传媒"),
    ("801770", "通信"),
    ("801780", "银行"),
    ("801790", "非银金融"),
    ("801880", "汽车"),
    ("801890", "机械设备"),
    ("801950", "煤炭"),
    ("801960", "石油石化"),
    ("801970", "环保"),
    ("801980", "美容护理"),
]


def fetch_sector_daily(code: str, name: str) -> pd.DataFrame:
    if hasattr(ak, "sw_index_daily_indicator"):
        try:
            df = ak.sw_index_daily_indicator(symbol=code, indicator="收盘价")
            print(f"  {code} {name}: sw_index_daily_indicator")
        except Exception as exc:
            print(f"  {code} {name}: sw_index_daily_indicator 失败: {exc}")
        else:
            return normalize_daily(df, code, name)

    if hasattr(ak, "index_hist_sw"):
        try:
            df = ak.index_hist_sw(symbol=code, period="day")
            print(f"  {code} {name}: index_hist_sw")
        except Exception as exc:
            print(f"  {code} {name}: index_hist_sw 失败: {exc}")
        else:
            return normalize_daily(df, code, name)

    if hasattr(ak, "stock_board_industry_hist_em"):
        try:
            df = ak.stock_board_industry_hist_em(symbol=name, period="日k")
            print(f"  {code} {name}: stock_board_industry_hist_em")
        except Exception as exc:
            print(f"  {code} {name}: stock_board_industry_hist_em 失败: {exc}")
        else:
            return normalize_daily(df, code, name)

    raise RuntimeError(f"{code} {name} 无可用数据源")


def normalize_daily(df: pd.DataFrame, code: str, name: str) -> pd.DataFrame:
    df = df.copy()
    df.columns = [str(col).strip() for col in df.columns]
    date_col = next((col for col in df.columns if col in ["日期", "date", "交易日期"]), df.columns[1])
    close_col = next((col for col in df.columns if col in ["收盘", "收盘价", "close"]), None)
    if close_col is None:
        raise RuntimeError(f"{code} {name} 无法识别收盘字段: {list(df.columns)}")

    normalized = pd.DataFrame({
        "date": pd.to_datetime(df[date_col], errors="coerce"),
        "close": pd.to_numeric(df[close_col], errors="coerce"),
    }).dropna()
    normalized = normalized.sort_values("date")
    return normalized


def calc_return(df: pd.DataFrame, days: int) -> float:
    if len(df) <= days:
        return float("nan")
    latest = df["close"].iloc[-1]
    base = df["close"].iloc[-days - 1]
    return latest / base - 1


def calc_ytd(df: pd.DataFrame) -> float:
    latest_date = df["date"].iloc[-1]
    current_year = latest_date.year
    year_df = df[df["date"].dt.year == current_year]
    if year_df.empty:
        return float("nan")
    base = year_df["close"].iloc[0]
    latest = df["close"].iloc[-1]
    return latest / base - 1


def round_ret(value: float) -> float | None:
    if pd.isna(value):
        return None
    return round(float(value), 4)


def main():
    print("=" * 60)
    print("抓取申万一级行业轮动热力图数据...")
    print("=" * 60)

    probe_code, probe_name = SECTORS[0]
    probe = fetch_sector_daily(probe_code, probe_name)
    print(f"\n接口字段确认：{probe_code} {probe_name}")
    print(probe.head(3).to_string(index=False))
    print(probe.tail(3).to_string(index=False))

    sectors = []
    for code, name in SECTORS:
        try:
            df = probe if code == probe_code else fetch_sector_daily(code, name)
            item = {
                "code": code,
                "name": name,
                "ret_5d": round_ret(calc_return(df, 5)),
                "ret_1m": round_ret(calc_return(df, 21)),
                "ret_3m": round_ret(calc_return(df, 63)),
                "ret_ytd": round_ret(calc_ytd(df)),
            }
            sectors.append(item)
        except Exception as exc:
            print(f"  ✗ {code} {name} 失败: {exc}")

    if not sectors:
        print("  ✗ 没有生成任何行业数据，保留现有文件")
        return

    payload = {
        "updated": current_update_date(),
        "sectors": sectors,
    }

    out_dir = os.path.join(OUTPUT_DIR, "sector_heatmap")
    os.makedirs(out_dir, exist_ok=True)
    path = os.path.join(out_dir, "data.json")
    with open(path, "w", encoding="utf-8") as f:
        json.dump(payload, f, ensure_ascii=False)
    touch_manifest_last_updated()

    print(f"\n✓ {len(sectors)} 个行业 → {path}")
    print("\n近1月涨跌幅排名:")
    ranked = sorted(sectors, key=lambda item: item["ret_1m"] if item["ret_1m"] is not None else -999, reverse=True)
    for rank, item in enumerate(ranked, start=1):
        value = item["ret_1m"]
        text = "N/A" if value is None else f"{value * 100:+.2f}%"
        print(f"{rank:02d}. {item['code']} {item['name']}: {text}")


if __name__ == "__main__":
    main()
