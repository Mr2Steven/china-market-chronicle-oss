"""
中国股市编年史 — 数据管道配置
所有指数代码、名称、颜色、AkShare 调用参数的唯一真相源。
"""

from dataclasses import dataclass, field
from datetime import datetime
from typing import Optional
import json
import os

# ─── 输出路径 ─────────────────────────────────────────────
OUTPUT_DIR = os.path.join(os.path.dirname(__file__), "..", "public", "api")


def current_update_date() -> str:
    """Return the pipeline update date in YYYY-MM-DD format."""
    return datetime.now().strftime("%Y-%m-%d")


def touch_manifest_last_updated(last_updated: str | None = None) -> None:
    """Update the shared API manifest timestamp without changing data shapes."""
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    manifest_path = os.path.join(OUTPUT_DIR, "_manifest.json")

    if os.path.exists(manifest_path):
        with open(manifest_path, encoding="utf-8") as f:
            manifest = json.load(f)
    else:
        manifest = {
            "project": "中国股市编年史 · History of China Market",
            "indices": [],
        }

    manifest["last_updated"] = last_updated or current_update_date()
    with open(manifest_path, "w", encoding="utf-8") as f:
        json.dump(manifest, f, ensure_ascii=False, indent=2)

# ─── 指数定义 ─────────────────────────────────────────────

@dataclass
class IndexDef:
    """一个指数的完整定义，包含所有 AkShare 调用所需参数。"""
    code: str                       # 数字代码，如 "000001"
    name_cn: str                    # 中文名
    name_en: str                    # 英文名
    slug: str                       # URL slug / JSON 目录名
    start_date: str                 # 数据起始日期 YYYYMMDD
    market: str                     # "a" 或 "hk"

    # AkShare 函数参数（不同函数用不同参数格式，这里都记录清楚）
    akshare_hist_symbol: str = ""   # index_zh_a_hist() 的 symbol 参数
    akshare_daily_symbol: str = ""  # stock_zh_index_daily() 的 symbol (带 sh/sz 前缀)
    akshare_pe_symbol: str = ""     # stock_index_pe_lg() 的 symbol (中文名)
    akshare_pb_symbol: str = ""     # stock_index_pb_lg() 的 symbol (中文名)
    akshare_hk_symbol: str = ""     # stock_hk_index_daily_em() 的 symbol

    color: str = "#C41E3A"          # 主题色


# ─── A 股指数 ─────────────────────────────────────────────

SHANGHAI = IndexDef(
    code="000001",
    name_cn="上证综指",
    name_en="SSE Composite",
    slug="shanghai",
    start_date="19901219",
    market="a",
    akshare_hist_symbol="000001",
    akshare_daily_symbol="sh000001",
    akshare_pe_symbol="上证A股",     # stock_market_pe_lg 用这个
    akshare_pb_symbol="上证A股",
    color="#C41E3A",
)

HS300 = IndexDef(
    code="000300",
    name_cn="沪深300",
    name_en="CSI 300",
    slug="hs300",
    start_date="20050104",
    market="a",
    akshare_hist_symbol="000300",
    akshare_daily_symbol="sh000300",
    akshare_pe_symbol="沪深300",
    akshare_pb_symbol="沪深300",
    color="#D4380D",
)

GEM = IndexDef(
    code="399006",
    name_cn="创业板指",
    name_en="ChiNext",
    slug="gem",
    start_date="20100601",
    market="a",
    akshare_hist_symbol="399006",
    akshare_daily_symbol="sz399006",
    akshare_pe_symbol="创业板指",
    akshare_pb_symbol="创业板指",
    color="#FA541C",
)

SSE50 = IndexDef(
    code="000016",
    name_cn="上证50",
    name_en="SSE 50",
    slug="sse50",
    start_date="20040102",
    market="a",
    akshare_hist_symbol="000016",
    akshare_daily_symbol="sh000016",
    akshare_pe_symbol="上证50",
    akshare_pb_symbol="上证50",
    color="#CF1322",
)

STAR50 = IndexDef(
    code="000688",
    name_cn="科创50",
    name_en="STAR 50",
    slug="star50",
    start_date="20200723",
    market="a",
    akshare_hist_symbol="000688",
    akshare_daily_symbol="sh000688",
    akshare_pe_symbol="",            # 乐咕乐股可能没有科创50，需要回退
    akshare_pb_symbol="",
    color="#EB2F96",
)

CSI500 = IndexDef(
    code="000905",
    name_cn="中证500",
    name_en="CSI 500",
    slug="csi500",
    start_date="20050104",
    market="a",
    akshare_hist_symbol="000905",
    akshare_daily_symbol="sh000905",
    akshare_pe_symbol="中证500",
    akshare_pb_symbol="中证500",
    color="#13C2C2",
)

# ─── 港股指数 ─────────────────────────────────────────────

HSI = IndexDef(
    code="HSI",
    name_cn="恒生指数",
    name_en="Hang Seng Index",
    slug="hsi",
    start_date="19691124",
    market="hk",
    akshare_hk_symbol="HSI",
    color="#722ED1",
)

HSTECH = IndexDef(
    code="HSTECH",
    name_cn="恒生科技",
    name_en="Hang Seng TECH",
    slug="hstech",
    start_date="20200727",
    market="hk",
    akshare_hk_symbol="HSTECH",
    color="#2F54EB",
)

HSCEI = IndexDef(
    code="HSCEI",
    name_cn="恒生国企",
    name_en="Hang Seng China Enterprises",
    slug="hscei",
    start_date="20000103",
    market="hk",
    akshare_hk_symbol="HSCEI",
    color="#1890FF",
)

# ─── 聚合列表 ─────────────────────────────────────────────

A_SHARE_INDICES = [SHANGHAI, HS300, GEM, SSE50, STAR50, CSI500]
HK_INDICES = [HSI, HSTECH, HSCEI]
ALL_INDICES = A_SHARE_INDICES + HK_INDICES

# 核心指数（Phase 1 先实现这几个）
CORE_INDICES = [SHANGHAI, HS300, HSI]

# ─── A 股七巨头 ─────────────────────────────────────────────

A7_STOCKS = {
    "300750": "宁德时代",
    "600519": "贵州茅台",
    "002594": "比亚迪",
    "600036": "招商银行",
    "000333": "美的集团",
    "688981": "中芯国际",
    "002415": "海康威视",
}

# ─── 回撤事件名册（硬编码，Python 负责标注到 drawdown 数据上）─────

NAMED_DRAWDOWNS_SHANGHAI = [
    {
        "name": "1992 价格闯关泡沫",
        "peak_approx": "1992-05",
        "category": "泡沫破裂",
    },
    {
        "name": "1993–1994 泡沫破裂与紧缩",
        "peak_approx": "1993-02",
        "category": "货币紧缩",
    },
    {
        "name": "1997 亚洲金融风暴",
        "peak_approx": "1997-05",
        "category": "外部冲击",
    },
    {
        "name": "2001–2005 国有股减持熊市",
        "peak_approx": "2001-06",
        "category": "政策冲击",
    },
    {
        "name": "2007–2008 全球金融危机",
        "peak_approx": "2007-10",
        "category": "信用危机",
    },
    {
        "name": "2009–2014 漫长调整",
        "peak_approx": "2009-08",
        "category": "结构调整",
    },
    {
        "name": "2015 股灾 (去杠杆)",
        "peak_approx": "2015-06",
        "category": "去杠杆",
    },
    {
        "name": "2018 贸易战 + 去杠杆",
        "peak_approx": "2018-01",
        "category": "外部冲击+政策",
    },
    {
        "name": "2020 新冠冲击",
        "peak_approx": "2020-01",
        "category": "外生冲击",
    },
    {
        "name": "2021–2024 调整",
        "peak_approx": "2021-02",
        "category": "结构调整",
    },
]

NAMED_DRAWDOWNS_HSI = [
    {"name": "1973 股灾", "peak_approx": "1973-03", "category": "泡沫破裂"},
    {"name": "1981–1982 利率冲击", "peak_approx": "1981-07", "category": "货币紧缩"},
    {"name": "1987 黑色星期一", "peak_approx": "1987-10", "category": "程序化交易"},
    {"name": "1997 亚洲金融风暴", "peak_approx": "1997-08", "category": "货币危机"},
    {"name": "2000 互联网泡沫", "peak_approx": "2000-03", "category": "泡沫破裂"},
    {"name": "2003 SARS", "peak_approx": "2003-01", "category": "外生冲击"},
    {"name": "2007–2008 金融危机", "peak_approx": "2007-10", "category": "信用危机"},
    {"name": "2015 A 股联动暴跌", "peak_approx": "2015-04", "category": "去杠杆"},
    {"name": "2018 贸易战", "peak_approx": "2018-01", "category": "外部冲击"},
    {"name": "2019–2020 社运+新冠", "peak_approx": "2019-04", "category": "多重冲击"},
    {"name": "2021–2022 监管风暴", "peak_approx": "2021-02", "category": "政策冲击"},
]
