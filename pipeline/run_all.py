"""
run_all.py
一键执行全部数据管道。
GitHub Actions 和本地开发都调用这个脚本。

使用方法:
  cd pipeline
  pip install -r requirements.txt
  python run_all.py
"""

import sys
import os
import time
import traceback

# 确保当前目录在 path 中
sys.path.insert(0, os.path.dirname(__file__))


def run_step(step_no: int, total_steps: int, title: str, loader):
    """Run one pipeline step without aborting the whole refresh."""
    print(f"\n▶ Step {step_no}/{total_steps}: {title}...")
    step_start = time.time()
    try:
        loader()
    except Exception as exc:
        elapsed = time.time() - step_start
        print(f"✗ Step {step_no}/{total_steps} 失败：{title}")
        print(f"  耗时 {elapsed:.1f} 秒")
        print(f"  错误: {exc}")
        traceback.print_exc()
        return False

    elapsed = time.time() - step_start
    print(f"✓ Step {step_no}/{total_steps} 完成：{title}，耗时 {elapsed:.1f} 秒")
    return True


def main():
    start = time.time()
    total_steps = 14
    results: list[tuple[str, bool]] = []

    print("╔══════════════════════════════════════════════════════════╗")
    print("║       中国股市编年史 · 数据管道                           ║")
    print("║       History of China Market · Data Pipeline           ║")
    print("╚══════════════════════════════════════════════════════════╝")
    print()

    def step_index_daily():
        from fetch_index_daily import fetch_all
        fetch_all()

    def step_compute_derived():
        from compute_derived import main as compute_main
        compute_main()

    def step_valuation():
        from fetch_valuation import main as valuation_main
        valuation_main()

    def step_extras():
        from fetch_extras import main as extras_main
        extras_main()

    def step_constituents_detail():
        from fetch_constituents_detail import main as constituents_detail_main
        constituents_detail_main()

    def step_a7():
        from fetch_a7 import main as a7_main
        a7_main()

    def step_ipo():
        from fetch_ipo import main as ipo_main
        ipo_main()

    def step_sp500():
        from fetch_sp500 import main as sp500_main
        sp500_main()

    def step_margin():
        from fetch_margin import main as margin_main
        margin_main()

    def step_return_decomp():
        from fetch_return_decomp import main as return_decomp_main
        return_decomp_main()

    def step_bond_equity():
        from fetch_bond_equity import main as bond_equity_main
        bond_equity_main()

    def step_commodities():
        from fetch_commodities import main as commodities_main
        commodities_main()

    def step_northbound():
        from fetch_northbound import main as northbound_main
        northbound_main()

    def step_sector_heatmap():
        from fetch_sector_heatmap import main as sector_heatmap_main
        sector_heatmap_main()

    steps = [
        ("抓取指数日线数据", step_index_daily),
        ("计算衍生指标", step_compute_derived),
        ("抓取估值数据", step_valuation),
        ("抓取中国特色数据", step_extras),
        ("补充沪深300成分股行业与市值", step_constituents_detail),
        ("抓取 A 股七巨头等权指数", step_a7),
        ("抓取 IPO 数据", step_ipo),
        ("抓取 S&P 500 日线数据", step_sp500),
        ("抓取融资融券余额", step_margin),
        ("计算回报拆分", step_return_decomp),
        ("计算股债性价比 ERP", step_bond_equity),
        ("抓取大宗商品联动数据", step_commodities),
        ("抓取北向资金净流入数据", step_northbound),
        ("抓取申万行业轮动热力图数据", step_sector_heatmap),
    ]

    for index, (title, loader) in enumerate(steps, start=1):
        results.append((title, run_step(index, total_steps, title, loader)))

    elapsed = time.time() - start
    failed = [title for title, ok in results if not ok]
    print(f"\n{'='*60}")
    if failed:
        print(f"⚠️ 数据管道完成，但有 {len(failed)} 个步骤失败，耗时 {elapsed:.1f} 秒")
        for title in failed:
            print(f"   - {title}")
    else:
        print(f"✅ 全部完成！耗时 {elapsed:.1f} 秒")
    print(f"   输出目录: public/api/")
    print(f"{'='*60}")


if __name__ == "__main__":
    main()
