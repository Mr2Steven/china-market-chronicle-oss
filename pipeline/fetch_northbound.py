"""
fetch_northbound.py
抓取北向资金（沪股通 + 深股通）每日净买入，并叠加上证综指收盘价。

输出:
  public/api/northbound/data.json
"""

import json
import os
import re
import sys
from datetime import datetime
from typing import Callable


def ensure_runtime():
    """Use the project Python with AkShare when the default python3 lacks deps."""
    try:
        import akshare  # noqa: F401
        import pandas  # noqa: F401
        import requests  # noqa: F401
    except ModuleNotFoundError:
        fallback = "/opt/homebrew/bin/python3.12"
        if os.path.exists(fallback) and os.path.realpath(sys.executable) != os.path.realpath(fallback):
            os.execv(fallback, [fallback, *sys.argv])
        raise


ensure_runtime()

import akshare as ak
import pandas as pd
import requests

from config import OUTPUT_DIR, touch_manifest_last_updated


START_DATE = "2016-01-01"
SHANGHAI_DAILY_PATH = os.path.join(OUTPUT_DIR, "shanghai", "daily.json")


def print_probe(name: str, df: pd.DataFrame) -> None:
    df = df.copy()
    df.columns = [str(col).strip() for col in df.columns]
    print(f"\n接口: {name}")
    print(f"  shape: {df.shape}")
    print(f"  columns: {list(df.columns)}")
    if "date" in df.columns:
        latest = pd.to_datetime(df["date"], errors="coerce").max()
    elif "日期" in df.columns:
        latest = pd.to_datetime(df["日期"], errors="coerce").max()
    else:
        latest = None
    if pd.notna(latest):
        print(f"  latest: {latest.strftime('%Y-%m-%d')}")
    print(df.head(3).to_string(index=False))
    if len(df) > 3:
        print(df.tail(3).to_string(index=False))


def try_call(name: str, loader: Callable[[], pd.DataFrame]) -> pd.DataFrame | None:
    try:
        df = loader()
        print_probe(name, df)
        return df
    except Exception as exc:
        print(f"\n接口: {name}")
        print(f"  ✗ 不可用: {type(exc).__name__}: {exc}")
        return None


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


def normalize_long_df(df: pd.DataFrame, date_col: str, total_col: str) -> pd.DataFrame:
    normalized = pd.DataFrame({
        "date": pd.to_datetime(df[date_col], errors="coerce"),
        "total_net": pd.to_numeric(df[total_col], errors="coerce"),
    }).dropna()
    normalized = normalized[normalized["date"] >= pd.to_datetime(START_DATE)]
    normalized = normalized.sort_values("date")
    normalized["date"] = normalized["date"].dt.strftime("%Y-%m-%d")
    normalized["sh_net"] = 0.0
    normalized["sz_net"] = 0.0
    return normalized[["date", "sh_net", "sz_net", "total_net"]]


def normalize_channel(df: pd.DataFrame, label: str) -> pd.DataFrame:
    df = df.copy()
    df.columns = [str(col).strip() for col in df.columns]
    if "日期" not in df.columns or "当日成交净买额" not in df.columns:
        raise RuntimeError(f"{label} 缺少必要字段: {list(df.columns)}")
    normalized = pd.DataFrame({
        "date": pd.to_datetime(df["日期"], errors="coerce"),
        label: pd.to_numeric(df["当日成交净买额"], errors="coerce"),
    }).dropna(subset=["date", label])
    normalized = normalized[normalized["date"] >= pd.to_datetime(START_DATE)]
    normalized = normalized.sort_values("date")
    normalized["date"] = normalized["date"].dt.strftime("%Y-%m-%d")
    return normalized[["date", label]]


def fetch_ak_north_net_flow() -> pd.DataFrame | None:
    if not hasattr(ak, "stock_em_hsgt_north_net_flow_in"):
        print("\n接口: stock_em_hsgt_north_net_flow_in(indicator='北向资金')")
        print("  ✗ 当前 AkShare 版本无此接口")
        return None
    df = try_call(
        "stock_em_hsgt_north_net_flow_in(indicator='北向资金')",
        lambda: ak.stock_em_hsgt_north_net_flow_in(indicator="北向资金"),
    )
    if df is None or df.empty:
        return None
    cols = [str(c).strip() for c in df.columns]
    date_col = next((c for c in cols if "日期" in c or c.lower() == "date"), cols[0])
    value_col = next((c for c in cols if "净" in c or "flow" in c.lower()), cols[-1])
    return normalize_long_df(df, date_col, value_col)


def fetch_ak_north_net_flow_em() -> pd.DataFrame | None:
    if not hasattr(ak, "stock_hsgt_north_net_flow_in_em"):
        print("\n接口: stock_hsgt_north_net_flow_in_em()")
        print("  ✗ 当前 AkShare 版本无此接口")
        return None
    df = try_call("stock_hsgt_north_net_flow_in_em()", lambda: ak.stock_hsgt_north_net_flow_in_em())
    if df is None or df.empty:
        return None
    cols = [str(c).strip() for c in df.columns]
    date_col = next((c for c in cols if "日期" in c or c.lower() == "date"), cols[0])
    value_col = next((c for c in cols if "净" in c or "flow" in c.lower()), cols[-1])
    return normalize_long_df(df, date_col, value_col)


def probe_position_minute() -> None:
    if not hasattr(ak, "stock_connect_position_minute"):
        print("\n接口: stock_connect_position_minute()")
        print("  ✗ 当前 AkShare 版本无此接口")
        return
    try_call("stock_connect_position_minute()", lambda: ak.stock_connect_position_minute())


def parse_eastmoney_kline_response(text: str) -> dict:
    stripped = text.strip()
    if stripped.startswith("jQuery"):
        stripped = re.sub(r"^\w+\(", "", stripped)
        stripped = re.sub(r"\);?$", "", stripped)
    return json.loads(stripped)


def fetch_eastmoney_kline_direct() -> pd.DataFrame | None:
    """Try the direct East Money kline URL requested by the task."""
    url = "https://push2his.eastmoney.com/api/qt/kline/get"
    params = {
        "cb": "jQuery",
        "secid": "90.BK0600",
        "klt": "101",
        "fqt": "0",
        "beg": "20160101",
        "end": "20991231",
    }
    print(f"\n接口: EastMoney kline direct {url}")
    try:
        response = requests.get(url, params=params, timeout=20, headers={"User-Agent": "Mozilla/5.0"})
        print(f"  status: {response.status_code}")
        response.raise_for_status()
        data = parse_eastmoney_kline_response(response.text)
        klines = (data.get("data") or {}).get("klines") or []
        rows = []
        for item in klines:
            parts = str(item).split(",")
            if len(parts) <= 6:
                continue
            rows.append({
                "date": parts[0],
                "sh_net": 0.0,
                "sz_net": 0.0,
                "total_net": float(parts[6]) / 1e8,
            })
        df = pd.DataFrame(rows)
        if not df.empty:
            print_probe("EastMoney kline direct parsed", df)
        return df if not df.empty else None
    except Exception as exc:
        print(f"  ✗ 不可用: {type(exc).__name__}: {exc}")
        return None


def fetch_eastmoney_datacenter_history(symbol: str) -> pd.DataFrame:
    symbol_map = {"北向资金": "5", "沪股通": "1", "深股通": "3"}
    url = "https://datacenter-web.eastmoney.com/api/data/v1/get"
    params = {
        "sortColumns": "TRADE_DATE",
        "sortTypes": "-1",
        "pageSize": "1000",
        "pageNumber": "1",
        "reportName": "RPT_MUTUAL_DEAL_HISTORY",
        "columns": "ALL",
        "source": "WEB",
        "client": "WEB",
        "filter": f'(MUTUAL_TYPE="00{symbol_map[symbol]}")',
    }
    response = requests.get(url, params=params, timeout=20)
    response.raise_for_status()
    first = response.json()
    pages = int(first["result"]["pages"])
    frames = []
    for page in range(1, pages + 1):
        params["pageNumber"] = str(page)
        page_response = requests.get(url, params=params, timeout=20)
        page_response.raise_for_status()
        frames.append(pd.DataFrame(page_response.json()["result"]["data"]))
    raw = pd.concat(frames, ignore_index=True)
    raw = raw.rename(columns={"TRADE_DATE": "日期", "NET_DEAL_AMT": "当日成交净买额"})
    raw["日期"] = pd.to_datetime(raw["日期"], errors="coerce").dt.strftime("%Y-%m-%d")
    raw["当日成交净买额"] = pd.to_numeric(raw["当日成交净买额"], errors="coerce") / 100
    return raw[["日期", "当日成交净买额"]]


def fetch_eastmoney_summary_latest() -> pd.DataFrame | None:
    if hasattr(ak, "stock_hsgt_fund_flow_summary_em"):
        summary = try_call("stock_hsgt_fund_flow_summary_em()", lambda: ak.stock_hsgt_fund_flow_summary_em())
    else:
        summary = None
    if summary is None or summary.empty:
        return None
    north = summary[(summary["资金方向"] == "北向") & (summary["板块"].isin(["沪股通", "深股通"]))].copy()
    if north.empty:
        return None
    latest_date = pd.to_datetime(north["交易日"], errors="coerce").max().strftime("%Y-%m-%d")
    sh_net = float(north.loc[north["板块"] == "沪股通", "成交净买额"].sum())
    sz_net = float(north.loc[north["板块"] == "深股通", "成交净买额"].sum())
    latest = pd.DataFrame([{
        "date": latest_date,
        "sh_net": sh_net,
        "sz_net": sz_net,
        "total_net": sh_net + sz_net,
    }])
    print_probe("EastMoney summary latest parsed", latest)
    return latest


def fetch_eastmoney_datacenter_split() -> pd.DataFrame | None:
    try:
        sh_raw = fetch_eastmoney_datacenter_history("沪股通")
        sz_raw = fetch_eastmoney_datacenter_history("深股通")
        total_raw = fetch_eastmoney_datacenter_history("北向资金")
        print_probe("EastMoney datacenter 沪股通", sh_raw)
        print_probe("EastMoney datacenter 深股通", sz_raw)
        print_probe("EastMoney datacenter 北向资金", total_raw)
    except Exception as exc:
        print(f"\n接口: EastMoney datacenter RPT_MUTUAL_DEAL_HISTORY")
        print(f"  ✗ 不可用: {type(exc).__name__}: {exc}")
        return None

    sh = normalize_channel(sh_raw, "sh_net")
    sz = normalize_channel(sz_raw, "sz_net")
    total = normalize_channel(total_raw, "total_net_source")
    merged = pd.merge(sh, sz, on="date", how="outer").sort_values("date")
    merged["sh_net"] = merged["sh_net"].fillna(0)
    merged["sz_net"] = merged["sz_net"].fillna(0)
    merged["total_net"] = (merged["sh_net"] + merged["sz_net"]).round(4)
    merged = pd.merge(merged, total, on="date", how="left")
    has_total = merged["total_net_source"].notna()
    merged.loc[has_total, "total_net"] = merged.loc[has_total, "total_net_source"]
    merged = merged.drop(columns=["total_net_source"])

    latest = fetch_eastmoney_summary_latest()
    if latest is not None and not latest.empty:
        merged = pd.concat([merged, latest], ignore_index=True)
        merged = merged.sort_values("date").drop_duplicates(subset=["date"], keep="last")
    return merged


def fetch_hist_fallback() -> pd.DataFrame | None:
    if not hasattr(ak, "stock_hsgt_hist_em"):
        print("\n接口: stock_hsgt_hist_em fallback")
        print("  ✗ 当前 AkShare 版本无此接口")
        return None
    sh_raw = try_call("stock_hsgt_hist_em(symbol='沪股通')", lambda: ak.stock_hsgt_hist_em(symbol="沪股通"))
    sz_raw = try_call("stock_hsgt_hist_em(symbol='深股通')", lambda: ak.stock_hsgt_hist_em(symbol="深股通"))
    total_raw = try_call("stock_hsgt_hist_em(symbol='北向资金')", lambda: ak.stock_hsgt_hist_em(symbol="北向资金"))
    if sh_raw is None or sz_raw is None:
        return None
    sh = normalize_channel(sh_raw, "sh_net")
    sz = normalize_channel(sz_raw, "sz_net")
    merged = pd.merge(sh, sz, on="date", how="outer").sort_values("date")
    merged["sh_net"] = merged["sh_net"].fillna(0)
    merged["sz_net"] = merged["sz_net"].fillna(0)
    merged["total_net"] = (merged["sh_net"] + merged["sz_net"]).round(4)
    if total_raw is not None:
        total = normalize_channel(total_raw, "total_net_source")
        merged = pd.merge(merged, total, on="date", how="left")
        has_total = merged["total_net_source"].notna()
        merged.loc[has_total, "total_net"] = merged.loc[has_total, "total_net_source"]
        merged = merged.drop(columns=["total_net_source"])
    return merged


def choose_best(candidates: list[tuple[str, pd.DataFrame | None]]) -> pd.DataFrame:
    valid = []
    for name, df in candidates:
        if df is None or df.empty:
            continue
        normalized = df.copy()
        normalized["date"] = pd.to_datetime(normalized["date"], errors="coerce")
        normalized["total_net"] = pd.to_numeric(normalized["total_net"], errors="coerce")
        normalized = normalized.dropna(subset=["date", "total_net"])
        normalized = normalized[normalized["date"] >= pd.to_datetime(START_DATE)]
        if normalized.empty:
            continue
        normalized["date"] = normalized["date"].dt.strftime("%Y-%m-%d")
        normalized["sh_net"] = pd.to_numeric(normalized.get("sh_net", 0), errors="coerce").fillna(0)
        normalized["sz_net"] = pd.to_numeric(normalized.get("sz_net", 0), errors="coerce").fillna(0)
        latest = normalized["date"].max()
        print(f"  候选 {name}: {len(normalized)} 行，最新 {latest}")
        valid.append((latest, len(normalized), name, normalized[["date", "sh_net", "sz_net", "total_net"]]))
    if not valid:
        raise RuntimeError("没有可用北向资金数据源")
    valid.sort(key=lambda item: (item[0], item[1]), reverse=True)
    latest, _, name, selected = valid[0]
    print(f"\n使用数据源: {name}，最新日期 {latest}")
    selected = selected.sort_values("date").drop_duplicates(subset=["date"], keep="last")
    selected["cumulative"] = selected["total_net"].cumsum().round(4)
    return selected


def fetch_northbound_data() -> pd.DataFrame:
    probe_position_minute()
    candidates = [
        ("ak.stock_em_hsgt_north_net_flow_in", fetch_ak_north_net_flow()),
        ("ak.stock_hsgt_north_net_flow_in_em", fetch_ak_north_net_flow_em()),
        ("EastMoney kline direct", fetch_eastmoney_kline_direct()),
        ("EastMoney datacenter split + summary", fetch_eastmoney_datacenter_split()),
        ("ak.stock_hsgt_hist_em fallback", fetch_hist_fallback()),
    ]
    return choose_best(candidates)


def main():
    print("=" * 60)
    print("抓取北向资金净流入数据...")
    print("=" * 60)

    try:
        northbound = fetch_northbound_data()
        shanghai = load_shanghai()
        aligned = pd.merge(northbound, shanghai, on="date", how="inner").sort_values("date")
        if aligned.empty:
            raise RuntimeError("北向资金与上证综指无可对齐日期")
    except Exception as exc:
        print(f"  ✗ 北向资金数据生成失败: {exc}")
        print("  → 保留现有 public/api/northbound/data.json，不覆盖")
        return

    payload = {
        "dates": aligned["date"].tolist(),
        "sh_net": aligned["sh_net"].round(4).tolist(),
        "sz_net": aligned["sz_net"].round(4).tolist(),
        "total_net": aligned["total_net"].round(4).tolist(),
        "cumulative": aligned["cumulative"].round(4).tolist(),
        "sh_close": aligned["sh_close"].round(4).tolist(),
    }

    out_dir = os.path.join(OUTPUT_DIR, "northbound")
    os.makedirs(out_dir, exist_ok=True)
    path = os.path.join(out_dir, "data.json")
    with open(path, "w", encoding="utf-8") as f:
        json.dump(payload, f, ensure_ascii=False)
    touch_manifest_last_updated()

    print(f"\n✓ {len(payload['dates'])} 行 → {path}")
    print(f"最新数据日期: {payload['dates'][-1]}")
    print(f"累计总净买入: {payload['cumulative'][-1]:.2f} 亿元")
    print("最近 5 条:")
    for idx in range(max(0, len(payload["dates"]) - 5), len(payload["dates"])):
        print({
            "date": payload["dates"][idx],
            "sh_net": payload["sh_net"][idx],
            "sz_net": payload["sz_net"][idx],
            "total_net": payload["total_net"][idx],
            "cumulative": payload["cumulative"][idx],
            "sh_close": payload["sh_close"][idx],
        })


if __name__ == "__main__":
    main()
