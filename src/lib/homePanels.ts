import type { PanelDef, SectionDef } from "@/lib/panelRegistry";

type ChartSpec =
  | { type: "annualReturns"; indexSlug: string }
  | { type: "returnDistribution"; indexSlug: string }
  | { type: "annualizedMatrix"; indexSlug: string }
  | { type: "rollingReturns"; indexSlug: string }
  | { type: "logYoy"; indexSlug: string }
  | { type: "drawdown"; indexSlug: string }
  | { type: "intrayearDd"; indexSlug: string }
  | { type: "volatility"; indexSlug: string }
  | { type: "realizedVol"; indexSlug: string }
  | { type: "monthlyHeatmap"; indexSlug: string }
  | { type: "valuationArea"; indexSlug: string; filename: string; fieldKey: "pe" | "pb"; label: string; colorUp?: string }
  | { type: "stockBondRatio" }
  | { type: "bondEquity" }
  | { type: "indexComparison" }
  | { type: "a7Index" }
  | { type: "industryTreemap" }
  | { type: "constituentScatter" }
  | { type: "indexChangelog" }
  | { type: "indexRules" }
  | { type: "hsTech" }
  | { type: "hsiVsHs300" }
  | { type: "northboundFlow" }
  | { type: "northbound" }
  | { type: "sectorHeatmap" }
  | { type: "ahPremium" }
  | { type: "chinaVsSp500" }
  | { type: "ipoRhythm" }
  | { type: "policyTimeline" }
  | { type: "marginBalance" }
  | { type: "returnDecomp" }
  | { type: "commodities" };

export interface HomePanelDef {
  id: string;
  panelId: PanelDef["id"];
  titleCn: string;
  titleEn: string;
  source: string;
  chart: ChartSpec;
}

export interface HomeSectionDef {
  sectionId: SectionDef["id"];
  index: string;
  titleCn: string;
  titleEn: string;
  panels: HomePanelDef[];
}

export const HOME_SECTIONS: HomeSectionDef[] = [
  {
    sectionId: "returns",
    index: "I",
    titleCn: "回报的形状",
    titleEn: "The Shape of History",
    panels: [
      { id: "panel-annual", panelId: "annual-return", titleCn: "三十五年的年度涨跌", titleEn: "Annual Returns since 1990", source: "AkShare · 上证综指 000001", chart: { type: "annualReturns", indexSlug: "shanghai" } },
      { id: "panel-annual-dist", panelId: "return-distribution", titleCn: "年度回报的真实长相", titleEn: "What Annual Returns Actually Look Like", source: "计算自 annual-returns.json", chart: { type: "returnDistribution", indexSlug: "shanghai" } },
      { id: "panel-annualized-matrix", panelId: "annualized-matrix", titleCn: "任选买入年份与卖出年份", titleEn: "Pick Any Entry & Exit Year — Annualized Returns Matrix", source: "计算自 daily.json", chart: { type: "annualizedMatrix", indexSlug: "shanghai" } },
      { id: "panel-rolling", panelId: "rolling-5y", titleCn: "五年之后，年化回报通常是多少", titleEn: "5-Year Rolling Annualized Returns", source: "rolling-5y.json", chart: { type: "rollingReturns", indexSlug: "shanghai" } },
      { id: "panel-logyoy", panelId: "log-yoy", titleCn: "穿越零线的牛熊边界", titleEn: "Log Year-over-Year", source: "计算自 daily.json", chart: { type: "logYoy", indexSlug: "shanghai" } },
    ],
  },
  {
    sectionId: "crisis",
    index: "II",
    titleCn: "危机的节奏",
    titleEn: "The Rhythm of Crisis",
    panels: [
      { id: "panel-drawdown", panelId: "drawdown", titleCn: "每一次深跌都有名字", titleEn: "Named Drawdowns since 1990", source: "drawdowns.json", chart: { type: "drawdown", indexSlug: "shanghai" } },
      { id: "panel-intrayear-dd", panelId: "intrayear-dd", titleCn: "年内最大回撤 vs 全年涨跌", titleEn: "Intra-Year Decline vs Full-Year Return", source: "intrayear-dd.json", chart: { type: "intrayearDd", indexSlug: "shanghai" } },
      { id: "panel-volatility", panelId: "volatility", titleCn: "市场的呼吸频率", titleEn: "20/60-Day Annualized Volatility", source: "计算自 daily.json", chart: { type: "volatility", indexSlug: "shanghai" } },
      { id: "panel-ivix", panelId: "realized-vol", titleCn: "已实现波动率 · 60日年化", titleEn: "60-Day Realized Volatility", source: "计算自 daily.json", chart: { type: "realizedVol", indexSlug: "shanghai" } },
      { id: "panel-monthly", panelId: "monthly-seasonality", titleCn: "一年十二个月的季节性", titleEn: "Monthly Win Rates & Average Returns", source: "monthly.json", chart: { type: "monthlyHeatmap", indexSlug: "shanghai" } },
    ],
  },
  {
    sectionId: "valuation",
    index: "III",
    titleCn: "估值的锚点",
    titleEn: "The Valuation Anchor",
    panels: [
      { id: "panel-pe", panelId: "hs300-pe", titleCn: "沪深300 市盈率 PE-TTM", titleEn: "HS300 Price/Earnings (TTM)", source: "hs300/pe.json · 乐咕乐股", chart: { type: "valuationArea", indexSlug: "hs300", filename: "pe.json", fieldKey: "pe", label: "PE-TTM" } },
      { id: "panel-pb", panelId: "hs300-pb", titleCn: "沪深300 市净率 PB", titleEn: "HS300 Price/Book Ratio", source: "hs300/pb.json · 乐咕乐股", chart: { type: "valuationArea", indexSlug: "hs300", filename: "pb.json", fieldKey: "pb", label: "PB" } },
      { id: "panel-stock-bond", panelId: "equity-bond", titleCn: "股债收益比（沪深300）", titleEn: "Stock-Bond Earnings Yield Ratio", source: "hs300/pe.json", chart: { type: "stockBondRatio" } },
      { id: "panel-bond-equity", panelId: "bond-equity", titleCn: "股债性价比", titleEn: "Equity Risk Premium — HS300 vs 10Y CGB", source: "bond_equity/data.json · AkShare · 中债登", chart: { type: "bondEquity" } },
      { id: "panel-pe-sh", panelId: "shanghai-pe", titleCn: "上证A股整体市盈率", titleEn: "Shanghai A-Share Market PE", source: "shanghai/pe.json · 乐咕乐股", chart: { type: "valuationArea", indexSlug: "shanghai", filename: "pe.json", fieldKey: "pe", label: "整体PE", colorUp: "#C41E3A" } },
      { id: "panel-index-compare", panelId: "hs300-vs-shanghai", titleCn: "沪深300 vs 上证综指 · 归一化对比", titleEn: "HS300 vs Shanghai Composite — Normalized", source: "hs300/daily.json · shanghai/daily.json", chart: { type: "indexComparison" } },
    ],
  },
  {
    sectionId: "structure",
    index: "IV",
    titleCn: "结构与规则",
    titleEn: "Structure & Rules",
    panels: [
      { id: "panel-a7", panelId: "china-m7", titleCn: "A股七巨头等权指数", titleEn: "China's 7 Giants — Equal-Weight Index", source: "AkShare · stock_zh_a_hist · qfq复权", chart: { type: "a7Index" } },
      { id: "panel-industry", panelId: "industry-weights", titleCn: "申万一级行业权重", titleEn: "Shenwan Level-1 Industry Weights in HS300", source: "hs300/industry-weights.json", chart: { type: "industryTreemap" } },
      { id: "panel-scatter", panelId: "constituents-scatter", titleCn: "成分股散点图", titleEn: "Constituents: Today's Return vs Market Cap", source: "hs300/constituents-detail.json · Sina Finance", chart: { type: "constituentScatter" } },
      { id: "panel-changelog", panelId: "index-changes", titleCn: "沪深300调入调出历史", titleEn: "HS300 Index Change History", source: "中证指数公司公告（静态）", chart: { type: "indexChangelog" } },
      { id: "panel-rules", panelId: "index-rules", titleCn: "编制规则说明", titleEn: "Index Construction Rules", source: "中证指数有限公司《沪深300指数编制方案》", chart: { type: "indexRules" } },
    ],
  },
  {
    sectionId: "hang-seng",
    index: "V",
    titleCn: "恒生指数",
    titleEn: "The Hang Seng",
    panels: [
      { id: "panel-hsi-annual", panelId: "hsi-annual-return", titleCn: "恒生指数年度涨跌", titleEn: "Hang Seng Annual Returns", source: "hsi/annual-returns.json · Sina Finance", chart: { type: "annualReturns", indexSlug: "hsi" } },
      { id: "panel-hsi-drawdown", panelId: "hsi-drawdown", titleCn: "恒生历史回撤", titleEn: "Hang Seng Named Drawdowns", source: "hsi/drawdowns.json", chart: { type: "drawdown", indexSlug: "hsi" } },
      { id: "panel-hsi-monthly", panelId: "hsi-monthly-seasonality", titleCn: "恒生月度季节性", titleEn: "Hang Seng Monthly Seasonality", source: "hsi/monthly.json", chart: { type: "monthlyHeatmap", indexSlug: "hsi" } },
      { id: "panel-hstech", panelId: "hstech-daily", titleCn: "恒生科技指数走势", titleEn: "Hang Seng TECH Index (2020–)", source: "hstech/daily.json · Sina Finance", chart: { type: "hsTech" } },
      { id: "panel-hsi-vs-hs300", panelId: "hsi-vs-hs300", titleCn: "恒生 vs 沪深300 · 归一化对比", titleEn: "HSI vs HS300 — Normalized Comparison", source: "hsi/daily.json · hs300/daily.json", chart: { type: "hsiVsHs300" } },
      { id: "panel-hscei-annual", panelId: "hscei-annual-return", titleCn: "恒生国企指数年度涨跌", titleEn: "Hang Seng China Enterprises Annual Returns", source: "hscei/annual-returns.json · Sina Finance", chart: { type: "annualReturns", indexSlug: "hscei" } },
      { id: "panel-hscei-drawdown", panelId: "hscei-drawdown", titleCn: "恒生国企历史回撤", titleEn: "Hang Seng China Enterprises Drawdowns", source: "hscei/drawdowns.json", chart: { type: "drawdown", indexSlug: "hscei" } },
    ],
  },
  {
    sectionId: "china-characteristics",
    index: "VI",
    titleCn: "中国特色",
    titleEn: "China Characteristics",
    panels: [
      { id: "panel-northbound", panelId: "northbound-flow", titleCn: "北向资金净流入", titleEn: "Northbound Capital Flow (Stock Connect)", source: "northbound/flow.json · AkShare · 东方财富", chart: { type: "northboundFlow" } },
      { id: "panel-northbound-v2", panelId: "northbound", titleCn: "北向资金", titleEn: "Northbound Flows — Daily & Cumulative", source: "northbound/data.json · AkShare · 沪深交易所", chart: { type: "northbound" } },
      { id: "panel-sector-heatmap", panelId: "sector-heatmap", titleCn: "行业轮动", titleEn: "Sector Rotation Heatmap", source: "sector_heatmap/data.json · AkShare · 申万研究", chart: { type: "sectorHeatmap" } },
      { id: "panel-ah-premium", panelId: "ah-premium", titleCn: "A/H 股溢价", titleEn: "A-Share vs H-Share Premium", source: "ah-premium/index.json · 7对AH蓝筹估算", chart: { type: "ahPremium" } },
      { id: "panel-china-vs-sp500", panelId: "hs300-vs-sp500", titleCn: "沪深300 vs 标普500 · 中美对比", titleEn: "HS300 vs S&P 500 — China vs USA", source: "hs300/daily.json · sp500/daily.json · Sina Finance", chart: { type: "chinaVsSp500" } },
      { id: "panel-ipo", panelId: "ipo-rhythm", titleCn: "A股 IPO 节奏", titleEn: "A-Share IPO Rhythm by Month", source: "ipo/monthly.json · AkShare · 巨潮资讯", chart: { type: "ipoRhythm" } },
      { id: "panel-policy-timeline", panelId: "policy-timeline", titleCn: "政策事件时间轴", titleEn: "Policy Event Timeline", source: "policy/events.json · shanghai/daily.json · 手工整理", chart: { type: "policyTimeline" } },
      { id: "panel-margin-balance", panelId: "margin-balance", titleCn: "融资融券余额", titleEn: "Margin Financing Balance", source: "margin/balance.json · AkShare · 沪深交易所", chart: { type: "marginBalance" } },
      { id: "panel-return-decomp", panelId: "return-decomp", titleCn: "回报拆分", titleEn: "Return Decomposition — PE vs EPS", source: "return_decomp/data.json · AkShare", chart: { type: "returnDecomp" } },
    ],
  },
  {
    sectionId: "global-linkage",
    index: "VII",
    titleCn: "全球联动",
    titleEn: "Global Linkages",
    panels: [
      { id: "panel-commodities", panelId: "commodities", titleCn: "大宗商品联动", titleEn: "Copper, Oil, Gold vs Shanghai Composite", source: "commodities/data.json · AkShare · LME · NYMEX", chart: { type: "commodities" } },
    ],
  },
  {
    sectionId: "broad-market",
    index: "VIII",
    titleCn: "宽基指数群",
    titleEn: "Broad Market Index Family",
    panels: [
      { id: "panel-csi500-annual", panelId: "csi500-annual-return", titleCn: "中证500年度涨跌", titleEn: "CSI 500 Annual Returns", source: "csi500/annual-returns.json", chart: { type: "annualReturns", indexSlug: "csi500" } },
      { id: "panel-csi500-drawdown", panelId: "csi500-drawdown", titleCn: "中证500历史回撤", titleEn: "CSI 500 Drawdown History", source: "csi500/drawdowns.json", chart: { type: "drawdown", indexSlug: "csi500" } },
      { id: "panel-csi500-pe", panelId: "csi500-pe", titleCn: "中证500 市盈率 PE-TTM", titleEn: "CSI 500 Price/Earnings (TTM)", source: "csi500/pe.json · 乐咕乐股", chart: { type: "valuationArea", indexSlug: "csi500", filename: "pe.json", fieldKey: "pe", label: "PE-TTM", colorUp: "#13C2C2" } },
      { id: "panel-gem-annual", panelId: "gem-annual-return", titleCn: "创业板指年度涨跌", titleEn: "ChiNext Annual Returns", source: "gem/annual-returns.json", chart: { type: "annualReturns", indexSlug: "gem" } },
      { id: "panel-gem-drawdown", panelId: "gem-drawdown", titleCn: "创业板指历史回撤", titleEn: "ChiNext Drawdown History", source: "gem/drawdowns.json", chart: { type: "drawdown", indexSlug: "gem" } },
      { id: "panel-sse50-annual", panelId: "sse50-annual-return", titleCn: "上证50年度涨跌", titleEn: "SSE 50 Annual Returns", source: "sse50/annual-returns.json", chart: { type: "annualReturns", indexSlug: "sse50" } },
      { id: "panel-sse50-drawdown", panelId: "sse50-drawdown", titleCn: "上证50历史回撤", titleEn: "SSE 50 Drawdown History", source: "sse50/drawdowns.json", chart: { type: "drawdown", indexSlug: "sse50" } },
      { id: "panel-sse50-pe", panelId: "sse50-pe", titleCn: "上证50 市盈率 PE-TTM", titleEn: "SSE 50 Price/Earnings (TTM)", source: "sse50/pe.json · 乐咕乐股", chart: { type: "valuationArea", indexSlug: "sse50", filename: "pe.json", fieldKey: "pe", label: "PE-TTM", colorUp: "#CF1322" } },
      { id: "panel-sse50-pb", panelId: "sse50-pb", titleCn: "上证50 市净率 PB", titleEn: "SSE 50 Price/Book Ratio", source: "sse50/pb.json · 乐咕乐股", chart: { type: "valuationArea", indexSlug: "sse50", filename: "pb.json", fieldKey: "pb", label: "PB", colorUp: "#CF1322" } },
      { id: "panel-star50-annual", panelId: "star50-annual-return", titleCn: "科创50年度涨跌", titleEn: "STAR 50 Annual Returns", source: "star50/annual-returns.json", chart: { type: "annualReturns", indexSlug: "star50" } },
      { id: "panel-star50-drawdown", panelId: "star50-drawdown", titleCn: "科创50历史回撤", titleEn: "STAR 50 Drawdown History", source: "star50/drawdowns.json", chart: { type: "drawdown", indexSlug: "star50" } },
    ],
  },
];

export const HOME_NAV_SECTIONS = HOME_SECTIONS.map((section) => ({
  label: `§ ${section.index}  ${section.titleCn}`,
  anchor: section.panels[0]?.id ?? "",
})).filter((section) => section.anchor);

export const HOME_PANEL_ANCHORS: Record<string, string> = Object.fromEntries(
  HOME_SECTIONS.flatMap((section) => section.panels.map((panel) => [panel.panelId, panel.id]))
);

export function getHomeAnchorByPanelId(panelId: string): string | undefined {
  return HOME_PANEL_ANCHORS[panelId];
}
