/**
 * Panel Registry — 全站面板注册表
 *
 * 单一事实来源。所有下游产出从此文件自动生成：
 * - 路由 (generateStaticParams)
 * - metadata (title / description / keywords)
 * - sitemap.xml
 * - OG image
 * - JSON-LD (Article schema)
 * - FAQ schema
 * - llms-full.txt
 * - 数据可信度区块
 *
 * 新增面板只需在此文件追加一条记录。
 */

// ─── Types ───────────────────────────────────────────────────────────

export interface PanelFAQ {
  question: string;
  answer: string;
}

export interface PanelDef {
  /** 唯一标识，用于组件映射和 API 路径 */
  id: string;
  /** 所属 Section */
  section: SectionId;
  /** URL 路径（不含域名），用于 generateStaticParams */
  slug: string;
  /** 面板中文标题 */
  title: string;
  /** 面板英文副标题 */
  titleEn: string;
  /** 300-600 字中文描述，用于 meta description 和页面正文 */
  description: string;
  /** SEO 关键词（中英混合） */
  keywords: string[];
  /** 数据来源列表 */
  dataSources: string[];
  /** 数据更新频率 */
  updateFrequency: "daily" | "weekly" | "monthly" | "yearly" | "static";
  /** 数据处理说明（复权方式、口径等） */
  dataProcessing: string;
  /** 图表类型 */
  chartType: string;
  /** FAQ 列表（3-5 条，用于 JSON-LD 和 AI Search） */
  faq: PanelFAQ[];
  /** 对应的数据文件路径 */
  dataFile: string;
  /** API 端点 */
  apiEndpoint: string;
  /** 是否生成 OG image */
  ogImage: boolean;
  /** 关联面板 id 列表 */
  relatedPanels: string[];
}

export type SectionId =
  | "returns"
  | "crisis"
  | "valuation"
  | "structure"
  | "hang-seng"
  | "china-characteristics"
  | "global-linkage"
  | "broad-market";

export interface SectionDef {
  id: SectionId;
  index: string;       // "I", "II", ...
  title: string;
  titleEn: string;
  slug: string;        // URL prefix
}

// ─── Sections ────────────────────────────────────────────────────────

export const SECTIONS: SectionDef[] = [
  { id: "returns",                index: "I",   title: "回报的形状",  titleEn: "The Shape of Returns",      slug: "returns" },
  { id: "crisis",                 index: "II",  title: "危机的节奏",  titleEn: "The Rhythm of Crisis",      slug: "crisis" },
  { id: "valuation",              index: "III", title: "估值的锚点",  titleEn: "The Valuation Anchor",      slug: "valuation" },
  { id: "structure",              index: "IV",  title: "结构与规则",  titleEn: "Structure & Rules",         slug: "structure" },
  { id: "hang-seng",              index: "V",   title: "恒生指数",   titleEn: "Hang Seng Index",           slug: "hang-seng" },
  { id: "china-characteristics",  index: "VI",  title: "中国特色",   titleEn: "China Characteristics",     slug: "china-characteristics" },
  { id: "global-linkage",         index: "VII", title: "全球联动",   titleEn: "Global Linkages",           slug: "global-linkage" },
  { id: "broad-market",           index: "VIII", title: "宽基指数群", titleEn: "Broad Market Index Family", slug: "broad-market" },
];

type IndexPanelMeta = {
  idPrefix: string;
  section: SectionId;
  sectionSlug: string;
  indexSlug: string;
  titleCn: string;
  titleEn: string;
  indexNameCn: string;
  indexNameEn: string;
  dataSource: string;
  color?: string;
  relatedPanels: string[];
};

function annualIndexPanel(meta: IndexPanelMeta): PanelDef {
  return {
    id: `${meta.idPrefix}-annual-return`,
    section: meta.section,
    slug: `/${meta.sectionSlug}/${meta.idPrefix}-annual-return`,
    title: `${meta.titleCn}年度涨跌`,
    titleEn: `${meta.titleEn} Annual Returns`,
    description: `${meta.indexNameCn}年度涨跌面板展示该宽基指数每个自然年的收盘涨跌幅和年末点位，适合快速比较不同市场风格在牛熊周期中的收益弹性。年度柱状图可以直接看出上涨年份、下跌年份、极端收益年份和长期均值，是观察 ${meta.indexNameCn} 历史回报特征的入口。`,
    keywords: [`${meta.indexNameCn}年度涨跌`, `${meta.indexNameCn}历史回报`, `${meta.indexNameCn}年收益`, `${meta.indexNameEn} annual returns`],
    dataSources: [`${meta.indexSlug}/annual-returns.json`, meta.dataSource],
    updateFrequency: "daily",
    dataProcessing: "基于日线收盘价取每年最后一个交易日，计算年度涨跌幅和年末收盘点位。",
    chartType: "bar",
    faq: [
      { question: `${meta.indexNameCn}年度涨跌怎么看？`, answer: "红色柱代表上涨年份，绿色柱代表下跌年份；柱高表示当年涨跌幅，折线表示年末指数点位。" },
      { question: `${meta.indexNameCn}适合和哪些指数比较？`, answer: "可以和上证综指、沪深300、上证50、中证500、创业板指、科创50等宽基指数比较，观察大盘、成长、中小盘和科技风格的差异。" },
    ],
    dataFile: `${meta.indexSlug}/annual-returns.json`,
    apiEndpoint: `/api/${meta.sectionSlug}/${meta.idPrefix}-annual-return.json`,
    ogImage: true,
    relatedPanels: meta.relatedPanels,
  };
}

function drawdownIndexPanel(meta: IndexPanelMeta): PanelDef {
  return {
    id: `${meta.idPrefix}-drawdown`,
    section: meta.section,
    slug: `/${meta.sectionSlug}/${meta.idPrefix}-drawdown`,
    title: `${meta.titleCn}历史回撤`,
    titleEn: `${meta.titleEn} Drawdown History`,
    description: `${meta.indexNameCn}历史回撤面板从每一个历史高点开始计算指数下跌幅度，展示该指数在不同市场压力阶段的最大回撤、恢复节奏和深跌区间。相比年度涨跌，回撤曲线更适合观察持有体验：投资者真正承受的是从高点下来的损失幅度和恢复时间。`,
    keywords: [`${meta.indexNameCn}回撤`, `${meta.indexNameCn}最大回撤`, `${meta.indexNameCn}熊市`, `${meta.indexNameEn} drawdown`],
    dataSources: [`${meta.indexSlug}/drawdowns.json`, meta.dataSource],
    updateFrequency: "daily",
    dataProcessing: "从历史最高收盘价计算每日回撤，并筛选重大回撤事件。",
    chartType: "area",
    faq: [
      { question: `${meta.indexNameCn}回撤是什么意思？`, answer: "回撤是当前点位相对此前历史高点的跌幅，用来衡量买在高点后可能经历的最大账面损失。" },
      { question: "为什么回撤比单年涨跌更重要？", answer: "年度涨跌按自然年切分，而回撤按真实高点和低点切分，更接近投资者实际持有过程中的风险体验。" },
    ],
    dataFile: `${meta.indexSlug}/drawdowns.json`,
    apiEndpoint: `/api/${meta.sectionSlug}/${meta.idPrefix}-drawdown.json`,
    ogImage: true,
    relatedPanels: meta.relatedPanels,
  };
}

function valuationIndexPanel(meta: IndexPanelMeta, field: "pe" | "pb", label: string): PanelDef {
  const suffix = field;
  const titleMetric = field === "pe" ? "市盈率 PE-TTM" : "市净率 PB";
  return {
    id: `${meta.idPrefix}-${suffix}`,
    section: meta.section,
    slug: `/${meta.sectionSlug}/${meta.idPrefix}-${suffix}`,
    title: `${meta.titleCn} ${titleMetric}`,
    titleEn: `${meta.titleEn} ${label}`,
    description: `${meta.indexNameCn}${titleMetric}面板展示该指数历史估值序列、当前估值、历史均值、均值标准差区间和历史分位。估值不是择时的唯一依据，但它能帮助判断指数处在历史相对便宜、正常还是偏贵的位置，尤其适合和年度回报、回撤面板一起使用。`,
    keywords: [`${meta.indexNameCn}${field.toUpperCase()}`, `${meta.indexNameCn}估值`, `${meta.indexNameCn}${titleMetric}`, `${meta.indexNameEn} valuation`],
    dataSources: [`${meta.indexSlug}/${field}.json`, "乐咕乐股", "AkShare"],
    updateFrequency: "daily",
    dataProcessing: `读取 ${meta.indexSlug}/${field}.json，计算当前值、历史均值、标准差区间和历史分位。`,
    chartType: "area",
    faq: [
      { question: `${meta.indexNameCn}${titleMetric}有什么用？`, answer: "它用于观察指数整体估值水平，和历史均值及历史分位比较后，可以辅助判断当前价格是否反映了较高或较低的预期。" },
      { question: "估值分位越低就一定能买吗？", answer: "不一定。估值分位只说明历史相对位置，还需要结合盈利趋势、流动性、政策环境和指数结构变化。" },
    ],
    dataFile: `${meta.indexSlug}/${field}.json`,
    apiEndpoint: `/api/${meta.sectionSlug}/${meta.idPrefix}-${suffix}.json`,
    ogImage: true,
    relatedPanels: meta.relatedPanels,
  };
}

// ─── Panels ──────────────────────────────────────────────────────────

export const PANELS: PanelDef[] = [

  // ═══════════════════════════════════════════════════════════════════
  // § I  回报的形状
  // ═══════════════════════════════════════════════════════════════════

  {
    id: "annual-return",
    section: "returns",
    slug: "/returns/annual-return",
    title: "三十五年的年度涨跌",
    titleEn: "Annual Returns since 1990",
    description: "上证综指自 1990 年开市以来每一年的涨跌幅。绿柱盈年，红柱亏年。A 股三十五年的年度涨跌一目了然——牛短熊长的格局、政策驱动的脉冲、以及少数几次翻倍行情，全部浓缩在这张图里。",
    keywords: ["上证综指年度涨跌", "A股年度回报", "A股历史涨跌", "Shanghai Composite annual returns", "A-share annual returns"],
    dataSources: ["AkShare", "上证综指 000001"],
    updateFrequency: "daily",
    dataProcessing: "前复权，年度收盘价同比计算",
    chartType: "bar",
    faq: [
      { question: "A股历史上涨幅最大的年份是哪一年？", answer: "2006 年上证综指全年上涨 130.4%，是 A 股开市以来涨幅最大的年份。" },
      { question: "A股历史上跌幅最大的年份是哪一年？", answer: "2008 年上证综指全年下跌 65.4%，是 A 股历史最大年度跌幅。" },
      { question: "A股长期年化收益率是多少？", answer: "上证综指自 1990 年至今的年化收益率约为 8-10%（含分红再投资），但波动极大，单年涨跌幅经常超过 ±30%。" },
    ],
    dataFile: "annual-returns.json",
    apiEndpoint: "/api/returns/annual-return.json",
    ogImage: true,
    relatedPanels: ["return-distribution", "annualized-matrix"],
  },

  {
    id: "return-distribution",
    section: "returns",
    slug: "/returns/distribution",
    title: "年度回报的真实长相",
    titleEn: "What Annual Returns Actually Look Like",
    description: "将每一年的回报按区间分组，看 A 股年度回报的分布形态。平均 10% 只是数字——真实年份极少落在均值附近，肥尾特征一眼可见。",
    keywords: ["A股回报分布", "年度回报直方图", "A-share return distribution"],
    dataSources: ["annual-returns.json"],
    updateFrequency: "daily",
    dataProcessing: "基于年度回报数据分组统计",
    chartType: "histogram",
    faq: [
      { question: "A股年度回报的分布是什么形状？", answer: "A 股年度回报呈现明显的肥尾分布，极端年份（大涨或大跌）出现的概率远高于正态分布预测。" },
      { question: "A股最常见的年度回报区间是什么？", answer: "最常见的年度回报落在 -10% 到 +20% 区间，但 A 股有大量年份涨跌幅超过 ±30%。" },
    ],
    dataFile: "annual-returns.json",
    apiEndpoint: "/api/returns/distribution.json",
    ogImage: true,
    relatedPanels: ["annual-return", "rolling-5y"],
  },

  {
    id: "annualized-matrix",
    section: "returns",
    slug: "/returns/matrix",
    title: "任选买入年份与卖出年份",
    titleEn: "Pick Any Entry & Exit Year — Annualized Returns Matrix",
    description: "对角线以下每一格，代表一次假设的持有期年化收益。选任意买入年份和卖出年份，立即看到年化回报。持有期越长，年化回报越向长期均值收敛。",
    keywords: ["A股年化收益矩阵", "买入卖出年化回报", "A-share annualized returns matrix", "holding period returns"],
    dataSources: ["daily.json"],
    updateFrequency: "daily",
    dataProcessing: "日线数据计算任意两年之间的年化复合收益率",
    chartType: "heatmap",
    faq: [
      { question: "A股持有 10 年一般能赚多少？", answer: "取决于买入时点。从历史数据看，持有 10 年的年化回报在 -5% 到 +20% 之间，买在估值低位（如 2005、2008、2014 年）的 10 年年化回报显著更高。" },
      { question: "A股最差的 10 年是哪一段？", answer: "2007 年高点买入并持有到 2017 年，年化回报约为负值，这是 A 股最著名的'套牢十年'案例。" },
    ],
    dataFile: "daily.json",
    apiEndpoint: "/api/returns/matrix.json",
    ogImage: true,
    relatedPanels: ["annual-return", "rolling-5y"],
  },

  {
    id: "rolling-5y",
    section: "returns",
    slug: "/returns/rolling-5y",
    title: "五年之后，年化回报通常是多少",
    titleEn: "5-Year Rolling Annualized Returns",
    description: "每一个五年滚动窗口的年化收益。负回报的窗口占比、正回报的中位数、以及长期持有的确定性，全部可视化。",
    keywords: ["A股滚动年化收益", "5年滚动回报", "A-share rolling returns", "5-year annualized"],
    dataSources: ["rolling-5y.json"],
    updateFrequency: "daily",
    dataProcessing: "日线数据计算滚动 5 年年化复合收益率",
    chartType: "area",
    faq: [
      { question: "A股持有 5 年亏损的概率有多大？", answer: "从历史数据看，上证综指任意 5 年滚动窗口中，约 25-30% 的窗口年化收益为负。" },
    ],
    dataFile: "rolling-5y.json",
    apiEndpoint: "/api/returns/rolling-5y.json",
    ogImage: true,
    relatedPanels: ["annualized-matrix", "annual-return"],
  },

  {
    id: "log-yoy",
    section: "returns",
    slug: "/returns/log-yoy",
    title: "穿越零线的牛熊边界",
    titleEn: "Log Year-over-Year",
    description: "对数同比下，正值代表牛市、负值代表熊市。每一次穿越零线都是市场周期的换挡。",
    keywords: ["A股牛熊周期", "对数同比", "A-share bull bear cycle", "log YoY"],
    dataSources: ["daily.json"],
    updateFrequency: "daily",
    dataProcessing: "日线收盘价的对数同比（ln(P_t / P_{t-252})）",
    chartType: "area",
    faq: [
      { question: "A股历史上有过多少次牛熊切换？", answer: "上证综指自 1990 年以来经历了约 7-8 次完整的牛熊周期，平均每轮周期约 4-5 年。" },
    ],
    dataFile: "daily.json",
    apiEndpoint: "/api/returns/log-yoy.json",
    ogImage: true,
    relatedPanels: ["drawdown", "annual-return"],
  },

  // ═══════════════════════════════════════════════════════════════════
  // § II  危机的节奏
  // ═══════════════════════════════════════════════════════════════════

  {
    id: "drawdown",
    section: "crisis",
    slug: "/crisis/drawdown",
    title: "每一次深跌都有名字",
    titleEn: "Named Drawdowns since 1990",
    description: "1990 年以来每一次超过 20% 的回撤，标注事件名称和持续时间。从 327 国债事件到 2015 股灾，每一次深跌都有名字。",
    keywords: ["A股历史回撤", "A股最大回撤", "A股熊市", "A-share drawdown history", "China stock market crash"],
    dataSources: ["drawdowns.json"],
    updateFrequency: "daily",
    dataProcessing: "从历史高点计算回撤幅度，标注超过 20% 的回撤事件",
    chartType: "area",
    faq: [
      { question: "A股历史最大回撤是多少？", answer: "上证综指在 2007-2008 年间从 6124 点跌至 1664 点，最大回撤约 72.8%。" },
      { question: "A股历史上有过几次超过 50% 的回撤？", answer: "A 股历史上有 3 次超过 50% 的回撤：2001-2005（约 55%）、2007-2008（约 73%）、2015（约 52%）。" },
    ],
    dataFile: "drawdowns.json",
    apiEndpoint: "/api/crisis/drawdown.json",
    ogImage: true,
    relatedPanels: ["intrayear-dd", "volatility"],
  },

  {
    id: "intrayear-dd",
    section: "crisis",
    slug: "/crisis/intrayear",
    title: "年内最大回撤 vs 全年涨跌",
    titleEn: "Intra-Year Decline vs Full-Year Return",
    description: "每一年的年内最深跌幅和全年最终涨跌。几乎每年都先经历两位数下跌，但多数年份年末仍收正——中段难受，年末多半还是赚的。",
    keywords: ["A股年内回撤", "年内最大跌幅", "A-share intra-year drawdown"],
    dataSources: ["intrayear-dd.json"],
    updateFrequency: "daily",
    dataProcessing: "日线数据计算每年年内最大回撤幅度",
    chartType: "bar-overlay",
    faq: [
      { question: "A股平均年内最大回撤是多少？", answer: "上证综指历年平均年内最大回撤约 20%，意味着几乎每年都会经历一次显著下跌。" },
    ],
    dataFile: "intrayear-dd.json",
    apiEndpoint: "/api/crisis/intrayear.json",
    ogImage: true,
    relatedPanels: ["drawdown", "annual-return"],
  },

  {
    id: "volatility",
    section: "crisis",
    slug: "/crisis/volatility",
    title: "市场的呼吸频率",
    titleEn: "20/60-Day Annualized Volatility",
    description: "20 日与 60 日年化波动率。A 股的长期波动率中位数约 20-25%，显著高于美股。每次波动率突破 40%，后面几乎都跟着一轮转折。",
    keywords: ["A股波动率", "年化波动率", "A-share volatility", "realized volatility China"],
    dataSources: ["daily.json"],
    updateFrequency: "daily",
    dataProcessing: "20日/60日滚动标准差年化",
    chartType: "line",
    faq: [
      { question: "A股的波动率通常是多少？", answer: "上证综指的长期年化波动率中位数约 20-25%，显著高于标普 500 的 15% 左右。" },
    ],
    dataFile: "daily.json",
    apiEndpoint: "/api/crisis/volatility.json",
    ogImage: true,
    relatedPanels: ["realized-vol", "drawdown"],
  },

  {
    id: "realized-vol",
    section: "crisis",
    slug: "/crisis/realized-vol",
    title: "已实现波动率 · 60日年化",
    titleEn: "60-Day Realized Volatility",
    description: "60 日窗口的已实现波动率。相比 20 日更平滑，能更清晰地看到波动率的周期性。",
    keywords: ["已实现波动率", "60日波动率", "realized volatility 60-day"],
    dataSources: ["daily.json"],
    updateFrequency: "daily",
    dataProcessing: "60日滚动标准差年化",
    chartType: "line",
    faq: [
      { question: "A股波动率最高的时期是什么时候？", answer: "2015 年 6-8 月股灾期间，上证综指 60 日年化波动率一度超过 60%，是近二十年最高水平。" },
    ],
    dataFile: "daily.json",
    apiEndpoint: "/api/crisis/realized-vol.json",
    ogImage: true,
    relatedPanels: ["volatility", "drawdown"],
  },

  {
    id: "monthly-seasonality",
    section: "crisis",
    slug: "/crisis/monthly",
    title: "一年十二个月的季节性",
    titleEn: "Monthly Win Rates & Average Returns",
    description: "每一个月的历史涨跌记录。A 股的季节性模式：春季躁动、年末行情、以及特定月份的规律性。",
    keywords: ["A股月度季节性", "A股月度回报", "A-share monthly seasonality", "A-share monthly returns"],
    dataSources: ["monthly.json"],
    updateFrequency: "monthly",
    dataProcessing: "月度收益率按月份分组统计胜率和均值",
    chartType: "heatmap",
    faq: [
      { question: "A股哪个月涨幅最大？", answer: "从历史统计看，2 月和 11 月的平均月度回报最高，这与'春季躁动'和'年末行情'的市场规律一致。" },
      { question: "A股哪个月最容易下跌？", answer: "6 月和 8 月历史上下跌概率较高，可能与半年末资金面紧张和夏季成交清淡有关。" },
    ],
    dataFile: "monthly.json",
    apiEndpoint: "/api/crisis/monthly.json",
    ogImage: true,
    relatedPanels: ["annual-return"],
  },

  // ═══════════════════════════════════════════════════════════════════
  // § III  估值的锚点
  // ═══════════════════════════════════════════════════════════════════

  {
    id: "hs300-pe",
    section: "valuation",
    slug: "/valuation/hs300-pe",
    title: "沪深300 市盈率 PE-TTM",
    titleEn: "HS300 Price/Earnings (TTM)",
    description: "沪深 300 指数的滚动 12 个月市盈率。当前估值处于历史什么分位？便宜还是贵？PE-TTM 是最直观的判断依据。",
    keywords: ["沪深300市盈率", "沪深300 PE", "CSI 300 PE ratio", "CSI 300 valuation"],
    dataSources: ["hs300/pe.json", "乐咕乐股"],
    updateFrequency: "daily",
    dataProcessing: "TTM 口径，加权平均",
    chartType: "line",
    faq: [
      { question: "沪深300当前市盈率是多少？", answer: "请查看图表最新数据。沪深 300 PE-TTM 历史中位数约 12-13 倍。" },
      { question: "沪深300估值处于历史什么分位？", answer: "可通过图表中的分位数标注直观判断。低于 10 倍 PE 通常被视为历史低估区间。" },
    ],
    dataFile: "hs300/pe.json",
    apiEndpoint: "/api/valuation/hs300-pe.json",
    ogImage: true,
    relatedPanels: ["hs300-pb", "equity-bond", "shanghai-pe"],
  },

  {
    id: "hs300-pb",
    section: "valuation",
    slug: "/valuation/hs300-pb",
    title: "沪深300 市净率 PB",
    titleEn: "HS300 Price/Book Ratio",
    description: "沪深 300 的市净率。PB 是衡量市场整体估值的另一把尺子，尤其对金融、地产等重资产行业的估值判断更有意义。",
    keywords: ["沪深300市净率", "沪深300 PB", "CSI 300 PB ratio"],
    dataSources: ["hs300/pb.json", "乐咕乐股"],
    updateFrequency: "daily",
    dataProcessing: "加权平均市净率",
    chartType: "line",
    faq: [
      { question: "沪深300 PB 破净意味着什么？", answer: "沪深 300 整体 PB 低于 1 倍（破净）极为罕见，历史上仅在 2008 年和 2014 年最悲观时刻短暂出现过，通常是极度低估的信号。" },
    ],
    dataFile: "hs300/pb.json",
    apiEndpoint: "/api/valuation/hs300-pb.json",
    ogImage: true,
    relatedPanels: ["hs300-pe", "equity-bond"],
  },

  {
    id: "equity-bond",
    section: "valuation",
    slug: "/valuation/equity-bond",
    title: "股债收益比（沪深300）",
    titleEn: "Stock-Bond Earnings Yield Ratio",
    description: "沪深 300 盈利收益率（1/PE）与十年期国债收益率的比值。这是格雷厄姆式的比较框架——当股票的盈利收益率显著高于国债时，市场可能被低估。",
    keywords: ["股债收益比", "股债性价比", "沪深300股债比", "equity bond ratio China"],
    dataSources: ["hs300/pe.json"],
    updateFrequency: "daily",
    dataProcessing: "1/PE 与十年国债收益率的比值",
    chartType: "line",
    faq: [
      { question: "股债收益比高意味着什么？", answer: "股债收益比越高，说明股票的盈利收益率相对债券越有吸引力。历史上该比值超过 2 倍时，未来 1-3 年股市回报大概率为正。" },
    ],
    dataFile: "hs300/pe.json",
    apiEndpoint: "/api/valuation/equity-bond.json",
    ogImage: true,
    relatedPanels: ["hs300-pe", "hs300-pb"],
  },

  {
    id: "bond-equity",
    section: "valuation",
    slug: "/valuation/bond-equity",
    title: "股债性价比",
    titleEn: "Equity Risk Premium — HS300 vs 10Y CGB",
    description: "股权风险溢价 ERP：沪深300隐含收益率 vs 10年期国债收益率。ERP 使用沪深300盈利收益率（1/PE）减去中国10年期国债收益率，衡量股票相对无风险利率的补偿水平。当 ERP 较高时，股票相对债券更便宜，长期配置价值通常更高；当 ERP 较低甚至为负时，股票估值相对债券缺乏吸引力。本面板展示 ERP 历史走势、均值和正负一倍标准差区间。",
    keywords: ["股债性价比", "ERP", "股权风险溢价", "国债收益率", "大类资产"],
    dataSources: ["bond_equity/data.json", "AkShare", "中债登", "沪深300 PE"],
    updateFrequency: "daily",
    dataProcessing: "读取沪深300 PE 计算隐含收益率 1/PE，抓取中国10年期国债收益率并换算为小数；按日期交集对齐后计算 ERP、历史均值和标准差区间。",
    chartType: "line",
    faq: [
      { question: "什么是股债性价比？", answer: "用股票的隐含收益率（1/PE）减去10年期国债收益率，得到股权风险溢价（ERP）。ERP越高说明股票相对债券越便宜，配置价值越高。" },
      { question: "现在股票贵还是便宜？", answer: "当ERP高于历史均值+1σ时，股票历史上通常处于低估区间；低于均值-1σ时，通常处于高估区间。但这只是参考，不构成投资建议。" },
      { question: "为什么用沪深300而不是全A？", answer: "沪深300 PE 序列更稳定、历史更长，适合作为 A 股核心资产的估值代表。未来如果万得全A股息率或 PE 数据稳定接入，可以扩展为全A口径。" },
    ],
    dataFile: "bond_equity/data.json",
    apiEndpoint: "/api/valuation/bond-equity.json",
    ogImage: true,
    relatedPanels: ["hs300-pe", "equity-bond", "hs300-pb"],
  },

  {
    id: "shanghai-pe",
    section: "valuation",
    slug: "/valuation/shanghai-pe",
    title: "上证A股整体市盈率",
    titleEn: "Shanghai A-Share Market PE",
    description: "上证所有 A 股的整体市盈率。与沪深 300 的差异反映了大盘股与中小盘的估值分化。",
    keywords: ["上证市盈率", "上证A股PE", "Shanghai A-share PE"],
    dataSources: ["shanghai/pe.json", "乐咕乐股"],
    updateFrequency: "daily",
    dataProcessing: "整体法市盈率",
    chartType: "line",
    faq: [
      { question: "上证整体PE和沪深300PE有什么区别？", answer: "上证整体 PE 包含所有上海上市 A 股（含中小盘），通常高于沪深 300（大盘蓝筹为主）。两者的差异反映了大盘与中小盘的估值分化。" },
    ],
    dataFile: "shanghai/pe.json",
    apiEndpoint: "/api/valuation/shanghai-pe.json",
    ogImage: true,
    relatedPanels: ["hs300-pe", "hs300-vs-shanghai"],
  },

  {
    id: "hs300-vs-shanghai",
    section: "valuation",
    slug: "/valuation/hs300-vs-shanghai",
    title: "沪深300 vs 上证综指 · 归一化对比",
    titleEn: "HS300 vs Shanghai Composite — Normalized",
    description: "两大核心指数的归一化走势对比。沪深 300 侧重大盘蓝筹，上证综指覆盖面更广——两者的分化与收敛，反映了市场风格的切换。",
    keywords: ["沪深300对比上证综指", "HS300 vs Shanghai Composite"],
    dataSources: ["hs300/daily.json", "shanghai/daily.json"],
    updateFrequency: "daily",
    dataProcessing: "基于日线数据归一化到同一基期",
    chartType: "line-dual",
    faq: [
      { question: "沪深300和上证综指哪个表现更好？", answer: "长期来看沪深 300 跑赢上证综指，因为成分股筛选机制剔除了低质量公司。但在中小盘行情中（如 2013-2015），上证综指阶段性跑赢。" },
    ],
    dataFile: "hs300/daily.json",
    apiEndpoint: "/api/valuation/hs300-vs-shanghai.json",
    ogImage: true,
    relatedPanels: ["shanghai-pe", "hs300-pe"],
  },

  // ═══════════════════════════════════════════════════════════════════
  // § IV  结构与规则
  // ═══════════════════════════════════════════════════════════════════

  {
    id: "china-m7",
    section: "structure",
    slug: "/structure/china-m7",
    title: "A股七巨头等权指数",
    titleEn: "China's 7 Giants — Equal-Weight Index",
    description: "中国版 Magnificent 7——A 股市值最大的 7 只股票等权组合。集中度、龙头效应和指数代表性的讨论，从这里开始。",
    keywords: ["A股七巨头", "中国版Magnificent 7", "A股龙头股", "China mega caps"],
    dataSources: ["AkShare", "stock_zh_a_hist", "qfq复权"],
    updateFrequency: "daily",
    dataProcessing: "等权重，前复权日线数据",
    chartType: "line",
    faq: [
      { question: "A股七巨头是哪几只股票？", answer: "通常指贵州茅台、宁德时代、中国移动、工商银行、建设银行、招商银行、比亚迪等 A 股市值最大的 7 只股票（具体成分可能随市值变化调整）。" },
    ],
    dataFile: "china-m7.json",
    apiEndpoint: "/api/structure/china-m7.json",
    ogImage: true,
    relatedPanels: ["industry-weights", "constituents-scatter"],
  },

  {
    id: "industry-weights",
    section: "structure",
    slug: "/structure/industry-weights",
    title: "申万一级行业权重",
    titleEn: "Shenwan Level-1 Industry Weights in HS300",
    description: "沪深 300 中各申万一级行业的权重分布。指数的行业结构就是中国经济的缩影——金融、消费、科技的此消彼长。",
    keywords: ["沪深300行业权重", "申万一级行业", "HS300 sector weights", "GICS China"],
    dataSources: ["hs300/industry-weights.json"],
    updateFrequency: "monthly",
    dataProcessing: "按申万一级行业分类汇总自由流通市值权重",
    chartType: "treemap",
    faq: [
      { question: "沪深300中哪个行业权重最大？", answer: "金融（银行+非银）长期占据最大权重，但近年来食品饮料、电力设备（新能源）和电子的权重显著上升。" },
    ],
    dataFile: "hs300/industry-weights.json",
    apiEndpoint: "/api/structure/industry-weights.json",
    ogImage: true,
    relatedPanels: ["constituents-scatter", "index-changes"],
  },

  {
    id: "constituents-scatter",
    section: "structure",
    slug: "/structure/scatter",
    title: "成分股散点图",
    titleEn: "Constituents: Today's Return vs Market Cap",
    description: "沪深 300 全部成分股的实时散点图：横轴市值，纵轴今日涨跌，气泡大小按权重缩放。五百家一图看全。",
    keywords: ["沪深300成分股", "成分股散点图", "HS300 constituents scatter"],
    dataSources: ["hs300/constituents-detail.json", "Sina Finance"],
    updateFrequency: "daily",
    dataProcessing: "实时行情数据",
    chartType: "scatter",
    faq: [
      { question: "沪深300有多少只成分股？", answer: "沪深 300 由 300 只 A 股组成，按自由流通市值加权，覆盖沪深两市约 60% 的总市值。" },
    ],
    dataFile: "hs300/constituents-detail.json",
    apiEndpoint: "/api/structure/scatter.json",
    ogImage: true,
    relatedPanels: ["industry-weights", "china-m7"],
  },

  {
    id: "index-changes",
    section: "structure",
    slug: "/structure/changes",
    title: "沪深300调入调出历史",
    titleEn: "HS300 Index Change History",
    description: "近年的成分变更记录。每一笔增删的背后都是一家上市公司的兴衰——指数靠这种新陈代谢跟住实体经济。",
    keywords: ["沪深300调整", "沪深300成分股变更", "HS300 rebalancing history"],
    dataSources: ["中证指数公司公告"],
    updateFrequency: "static",
    dataProcessing: "手工整理中证指数公司定期审核公告",
    chartType: "table",
    faq: [
      { question: "沪深300多久调整一次？", answer: "每年 6 月和 12 月定期审核，特殊情况（如退市、合并）可不定期调整。" },
    ],
    dataFile: "hs300/changes.json",
    apiEndpoint: "/api/structure/changes.json",
    ogImage: true,
    relatedPanels: ["index-rules", "industry-weights"],
  },

  {
    id: "index-rules",
    section: "structure",
    slug: "/structure/rules",
    title: "编制规则说明",
    titleEn: "Index Construction Rules",
    description: "沪深 300 指数的编制方法：入选门槛、权重计算、成分变更的治理流程。规则决定了哪些公司有资格代表中国大盘。",
    keywords: ["沪深300编制规则", "沪深300怎么选股", "CSI 300 index methodology"],
    dataSources: ["中证指数公司"],
    updateFrequency: "static",
    dataProcessing: "纯文字说明，无图表数据",
    chartType: "text",
    faq: [
      { question: "沪深300是怎么选股的？", answer: "在沪深 A 股中剔除 ST、上市不足一个季度和财务异常的股票后，按过去一年日均成交额排名，选取前 300 只，按自由流通市值加权。" },
    ],
    dataFile: "",
    apiEndpoint: "",
    ogImage: false,
    relatedPanels: ["index-changes", "industry-weights"],
  },

  // ═══════════════════════════════════════════════════════════════════
  // § V  恒生指数
  // ═══════════════════════════════════════════════════════════════════

  {
    id: "hsi-annual-return",
    section: "hang-seng",
    slug: "/hang-seng/annual-return",
    title: "恒生指数年度涨跌",
    titleEn: "Hang Seng Index Annual Returns",
    description: "恒生指数历年涨跌幅。港股作为离岸中国资产的定价场，走势同时受中国基本面和全球流动性双重影响。",
    keywords: ["恒生指数年度涨跌", "港股历史回报", "Hang Seng annual returns"],
    dataSources: ["hsi/annual-returns.json", "Sina Finance"],
    updateFrequency: "daily",
    dataProcessing: "年度收盘价同比",
    chartType: "bar",
    faq: [
      { question: "恒生指数长期年化收益率是多少？", answer: "恒生指数自 1964 年创立以来的长期年化收益率约 9-10%（含股息），但近十年表现显著弱于全球主要指数。" },
    ],
    dataFile: "hsi/annual-returns.json",
    apiEndpoint: "/api/hang-seng/annual-return.json",
    ogImage: true,
    relatedPanels: ["hsi-drawdown", "hsi-monthly-seasonality"],
  },

  {
    id: "hsi-drawdown",
    section: "hang-seng",
    slug: "/hang-seng/drawdown",
    title: "恒生历史回撤",
    titleEn: "Hang Seng Drawdown History",
    description: "恒生指数的历史回撤记录。从 1997 亚洲金融风暴到 2022 中概暴跌，港股的每一次深跌都有清晰的全球宏观叙事。",
    keywords: ["恒生指数回撤", "港股历史熊市", "Hang Seng drawdown", "Hong Kong stock market crash"],
    dataSources: ["hsi/drawdowns.json"],
    updateFrequency: "daily",
    dataProcessing: "从历史高点计算回撤",
    chartType: "area",
    faq: [
      { question: "恒生指数历史最大回撤是多少？", answer: "恒生指数在 2007-2008 金融危机期间最大回撤约 67%，1997 亚洲金融风暴期间回撤约 61%。" },
    ],
    dataFile: "hsi/drawdowns.json",
    apiEndpoint: "/api/hang-seng/drawdown.json",
    ogImage: true,
    relatedPanels: ["hsi-annual-return", "drawdown"],
  },

  {
    id: "hsi-monthly-seasonality",
    section: "hang-seng",
    slug: "/hang-seng/monthly-seasonality",
    title: "恒生月度季节性",
    titleEn: "Hang Seng Monthly Seasonality",
    description: "恒生指数的月度涨跌规律。港股的季节性与 A 股有显著差异，受全球资金流和财报季驱动。",
    keywords: ["恒生月度季节性", "港股月度回报", "Hang Seng monthly seasonality"],
    dataSources: ["hsi/monthly.json"],
    updateFrequency: "monthly",
    dataProcessing: "月度收益率按月份分组统计",
    chartType: "heatmap",
    faq: [
      { question: "港股哪个月表现最好？", answer: "从历史统计看，10 月和 1 月的平均月度回报最高。" },
    ],
    dataFile: "hsi/monthly.json",
    apiEndpoint: "/api/hang-seng/monthly.json",
    ogImage: true,
    relatedPanels: ["monthly-seasonality", "hsi-annual-return"],
  },

  {
    id: "hstech-daily",
    section: "hang-seng",
    slug: "/hang-seng/hstech",
    title: "恒生科技指数走势",
    titleEn: "Hang Seng Tech Index",
    description: "恒生科技指数的走势。涵盖腾讯、阿里、美团、小米等中国互联网和科技龙头——中概股的离岸定价锚。",
    keywords: ["恒生科技指数", "恒生科技走势", "Hang Seng Tech Index", "China tech stocks"],
    dataSources: ["hstech/daily.json", "Sina Finance"],
    updateFrequency: "daily",
    dataProcessing: "日线收盘价",
    chartType: "line",
    faq: [
      { question: "恒生科技指数包含哪些股票？", answer: "包含约 30 只在港股上市的中国科技公司，如腾讯、阿里巴巴、美团、小米、京东、网易、比亚迪电子等。" },
    ],
    dataFile: "hstech/daily.json",
    apiEndpoint: "/api/hang-seng/hstech.json",
    ogImage: true,
    relatedPanels: ["hsi-annual-return", "china-m7"],
  },

  {
    id: "hsi-vs-hs300",
    section: "hang-seng",
    slug: "/hang-seng/hsi-vs-hs300",
    title: "恒生 vs 沪深300 · 归一化对比",
    titleEn: "HSI vs CSI 300 — Normalized Comparison",
    description: "恒生指数与沪深 300 的归一化走势对比。同为中国核心资产的两种定价——在岸与离岸的分化和收敛，反映了资金流动和政策预期的差异。",
    keywords: ["恒生对比沪深300", "港股对比A股", "HSI vs CSI 300"],
    dataSources: ["hsi/daily.json", "hs300/daily.json"],
    updateFrequency: "daily",
    dataProcessing: "日线数据归一化到同一基期",
    chartType: "line-dual",
    faq: [
      { question: "恒生和沪深300哪个长期表现更好？", answer: "2005-2017 年间恒生整体跑赢，但 2018 年后沪深 300 明显跑赢恒生，反映了在岸市场机构化和外资流入的结构性变化。" },
    ],
    dataFile: "hsi/daily.json",
    apiEndpoint: "/api/hang-seng/hsi-vs-hs300.json",
    ogImage: true,
    relatedPanels: ["hs300-vs-shanghai", "northbound-flow"],
  },

  // ═══════════════════════════════════════════════════════════════════
  // § VI  中国特色
  // ═══════════════════════════════════════════════════════════════════

  {
    id: "northbound-flow",
    section: "china-characteristics",
    slug: "/china-characteristics/northbound-flow",
    title: "北向资金净流入",
    titleEn: "Northbound Capital Flow",
    description: "沪股通 + 深股通的每日净流入数据。北向资金被称为'聪明钱'——虽然这个标签有争议，但它的流向确实是市场情绪的重要参考。",
    keywords: ["北向资金", "北向资金净流入", "沪股通", "深股通", "Northbound flow", "Stock Connect"],
    dataSources: ["northbound/flow.json", "AkShare", "东方财富"],
    updateFrequency: "daily",
    dataProcessing: "沪股通+深股通每日净买入金额汇总",
    chartType: "bar-cumulative",
    faq: [
      { question: "北向资金是什么？", answer: "北向资金指通过沪股通和深股通从香港流入 A 股市场的资金，主要是境外机构投资者。因为资金'从北（香港）向南（内地）'流动而得名。" },
      { question: "北向资金累计净流入多少？", answer: "请查看图表最新数据。自 2014 年沪港通开通以来，北向资金累计净流入超过 1.5 万亿人民币。" },
    ],
    dataFile: "northbound/flow.json",
    apiEndpoint: "/api/china-characteristics/northbound-flow.json",
    ogImage: true,
    relatedPanels: ["ah-premium", "hsi-vs-hs300"],
  },

  {
    id: "northbound",
    section: "china-characteristics",
    slug: "/china-characteristics/northbound",
    title: "北向资金",
    titleEn: "Northbound Flows — Daily & Cumulative",
    description: "陆股通北向资金每日净流入及历史累计，外资对 A 股态度的晴雨表。北向资金由沪股通和深股通组成，正值代表境外投资者净买入 A 股，负值代表净卖出。把每日净买入、累计净买入和上证综指放在一起，可以观察外资情绪与市场走势之间的阶段性联动。",
    keywords: ["北向资金", "陆股通", "沪股通", "深股通", "外资", "northbound"],
    dataSources: ["northbound/data.json", "AkShare", "沪深交易所"],
    updateFrequency: "daily",
    dataProcessing: "通过 AkShare 获取沪股通、深股通每日成交净买额，按交易日合并为北向合计净买入，并与上证综指收盘价按日期对齐；累计净买入从数据第一条开始累加。",
    chartType: "bar-line-tabs",
    faq: [
      { question: "什么是北向资金？", answer: "境外投资者通过沪股通和深股通买卖 A 股的资金，因资金从香港向北流入内地而得名。每日净买入为正代表外资净流入 A 股。" },
      { question: "北向资金能预测市场吗？", answer: "北向资金是重要的情绪指标，大幅持续流入通常对应外资看好 A 股；但单日数据噪音较大，趋势性判断需看5日或月度累计。" },
    ],
    dataFile: "northbound/data.json",
    apiEndpoint: "/api/china-characteristics/northbound.json",
    ogImage: true,
    relatedPanels: ["northbound-flow", "ah-premium", "hs300-vs-sp500"],
  },

  {
    id: "sector-heatmap",
    section: "china-characteristics",
    slug: "/china-characteristics/sector-heatmap",
    title: "行业轮动",
    titleEn: "Sector Rotation Heatmap",
    description: "申万31个一级行业涨跌幅热力图，支持近1周、近1月、近3月和年初至今切换。行业轮动是 A 股资金流向和风险偏好的直接体现：红色越深代表当前时间维度内涨幅越大，绿色越深代表跌幅越大，灰色接近平盘。通过横向比较行业强弱，可以快速识别资金正在追逐的主线和被回避的板块。",
    keywords: ["行业轮动", "申万", "热力图", "板块", "涨跌幅"],
    dataSources: ["sector_heatmap/data.json", "AkShare", "申万研究"],
    updateFrequency: "daily",
    dataProcessing: "抓取申万一级行业指数日线收盘价，计算近5日、近21日、近63日和年初至今涨跌幅；颜色按当前时间维度内行业涨跌幅相对映射。",
    chartType: "css-grid-heatmap",
    faq: [
      { question: "数据来源是什么？", answer: "申万一级行业指数，共31个行业，是 A 股最通用的行业分类标准。" },
      { question: "颜色怎么看？", answer: "红色越深涨幅越大，绿色越深跌幅越大，灰色接近平盘。颜色深浅在当前所选时间维度内相对映射。" },
    ],
    dataFile: "sector_heatmap/data.json",
    apiEndpoint: "/api/china-characteristics/sector-heatmap.json",
    ogImage: true,
    relatedPanels: ["northbound", "ah-premium", "hs300-vs-sp500"],
  },

  {
    id: "ah-premium",
    section: "china-characteristics",
    slug: "/china-characteristics/ah-premium",
    title: "A/H 股溢价",
    titleEn: "A/H Share Premium Index",
    description: "同时在 A 股和港股上市的公司，A 股价格相对 H 股的溢价。溢价率反映了在岸与离岸市场的估值差异、资金管制程度和投资者结构差异。",
    keywords: ["AH溢价", "AH股溢价指数", "A/H premium", "AH premium index"],
    dataSources: ["ah-premium/index.json", "7对AH蓝筹估算"],
    updateFrequency: "daily",
    dataProcessing: "选取主要 AH 双重上市股票计算溢价率加权平均",
    chartType: "line",
    faq: [
      { question: "AH 溢价通常是多少？", answer: "A/H 溢价指数长期中枢在 120-140 之间，意味着 A 股平均比对应 H 股贵 20-40%。极端时（如 2015 年）溢价超过 150%。" },
      { question: "AH 溢价为什么存在？", answer: "主要原因是资本管制（A 股投资者不能自由买卖港股）、投资者结构差异（A 股散户为主 vs 港股机构为主）和流动性差异。" },
    ],
    dataFile: "ah-premium/index.json",
    apiEndpoint: "/api/china-characteristics/ah-premium.json",
    ogImage: true,
    relatedPanels: ["northbound-flow", "hsi-vs-hs300"],
  },

  {
    id: "hs300-vs-sp500",
    section: "china-characteristics",
    slug: "/china-characteristics/hs300-vs-sp500",
    title: "沪深300 vs 标普500 · 中美对比",
    titleEn: "CSI 300 vs S&P 500 — China vs US",
    description: "中美两大核心指数的归一化走势对比。同样的十年，不同的回报——结构、制度、盈利能力的差异，全部反映在这条曲线里。",
    keywords: ["中美股市对比", "沪深300对比标普500", "A股vs美股", "CSI 300 vs S&P 500", "China vs US stocks"],
    dataSources: ["hs300/daily.json", "sp500/daily.json", "Sina Finance"],
    updateFrequency: "daily",
    dataProcessing: "日线数据归一化到同一基期",
    chartType: "line-dual",
    faq: [
      { question: "A股和美股哪个长期回报更高？", answer: "以最近 15 年（2010-2025）计，标普 500 年化回报显著高于沪深 300。但如果从 2005 年 A 股股改算起，两者的长期年化回报差距缩小。起点选择对结论影响很大。" },
      { question: "为什么 A 股跑不过美股？", answer: "核心差异在于：A 股上市公司的 ROE 和盈利增长持续性弱于美股、IPO 扩容稀释了存量回报、缺乏回购文化、散户化交易结构导致估值波动大。" },
    ],
    dataFile: "hs300/daily.json",
    apiEndpoint: "/api/china-characteristics/hs300-vs-sp500.json",
    ogImage: true,
    relatedPanels: ["hsi-vs-hs300", "hs300-pe"],
  },

  {
    id: "ipo-rhythm",
    section: "china-characteristics",
    slug: "/china-characteristics/ipo-rhythm",
    title: "A股 IPO 节奏",
    titleEn: "A-Share IPO Cadence",
    description: "每月 IPO 数量和募资额。A 股的 IPO 节奏是政策工具——暂停 IPO 是救市信号，加速 IPO 是牛市退热器。没有哪个市场的 IPO 像 A 股这样有政策含义。",
    keywords: ["A股IPO", "IPO节奏", "IPO暂停历史", "A-share IPO cadence", "China IPO history"],
    dataSources: ["ipo/monthly.json", "AkShare", "巨潮资讯"],
    updateFrequency: "monthly",
    dataProcessing: "按月汇总 IPO 数量和募资额",
    chartType: "bar",
    faq: [
      { question: "A股历史上暂停过几次 IPO？", answer: "A 股历史上共有约 9 次 IPO 暂停，最长的一次是 2012-2014 年（约 14 个月）。IPO 暂停通常发生在市场大幅下跌后，是监管层的救市信号之一。" },
      { question: "注册制对 IPO 节奏有什么影响？", answer: "2019 年科创板试点注册制后，IPO 数量显著增加。2020-2021 年年均 IPO 超过 400 家，是审核制时代的 2-3 倍。但 2023 年后再次收紧。" },
    ],
    dataFile: "ipo/monthly.json",
    apiEndpoint: "/api/china-characteristics/ipo-rhythm.json",
    ogImage: true,
    relatedPanels: ["northbound-flow", "annual-return"],
  },

  {
    id: "policy-timeline",
    section: "china-characteristics",
    slug: "/china-characteristics/policy-timeline",
    title: "政策事件时间轴",
    titleEn: "Policy Event Timeline",
    description: "政策事件时间轴把影响 A 股的重大制度变化、救市行动、印花税调整、互联互通和 IPO 节奏变化标注在上证综指走势之上。A 股长期受政策周期影响明显，同一条指数曲线背后往往有交易规则、融资制度、开放政策和监管取向的切换，这张图用于把关键政策节点和市场走势放在同一时间轴中观察。",
    keywords: ["A股政策时间轴", "中国股市政策事件", "印花税调整", "救市政策", "IPO暂停", "A-share policy timeline"],
    dataSources: ["policy/events.json", "shanghai/daily.json", "手工整理"],
    updateFrequency: "static",
    dataProcessing: "手工整理重大政策事件，按事件日期映射到最接近的上证综指交易日，并叠加在上证综指日线收盘价上。",
    chartType: "line-scatter",
    faq: [
      { question: "为什么 A 股需要单独看政策事件？", answer: "A 股市场的交易制度、融资约束、IPO 节奏、印花税和救市政策经常直接影响风险偏好和资金供需，因此重大政策节点常常是理解行情切换的重要背景。" },
      { question: "政策事件一定会带来对应涨跌吗？", answer: "不一定。图中的利好、利空和中性是事件性质分类，不是短期交易信号。市场反应还取决于估值、流动性、盈利周期和投资者预期。" },
      { question: "为什么事件会映射到最接近交易日？", answer: "部分政策发生在周末或非交易日，为了和上证综指日线对齐，图表会使用最接近的交易日点位进行标注。" },
    ],
    dataFile: "policy/events.json",
    apiEndpoint: "/api/china-characteristics/policy-timeline.json",
    ogImage: true,
    relatedPanels: ["ipo-rhythm", "northbound-flow", "annual-return"],
  },

  {
    id: "margin-balance",
    section: "china-characteristics",
    slug: "/china-characteristics/margin-balance",
    title: "融资融券余额",
    titleEn: "Margin Financing Balance",
    description: "融资融券余额是观察 A 股杠杆资金和市场情绪的重要指标。融资余额代表投资者借钱买股票的未偿还规模，融券余额代表借股票卖空的未偿还规模，两者合计反映市场整体杠杆水平。本面板将沪深两市融资融券余额与上证综指走势叠加，观察杠杆扩张、去杠杆和指数涨跌之间的联动。",
    keywords: ["融资融券余额", "融资余额", "融券余额", "A股杠杆资金", "两融余额", "margin financing China"],
    dataSources: ["margin/balance.json", "AkShare", "上交所融资融券数据", "深交所融资融券数据"],
    updateFrequency: "daily",
    dataProcessing: "抓取沪深两市融资融券汇总数据，金额从元换算为亿元；图表按融资融券日期向前匹配最近上证综指交易日收盘价。",
    chartType: "line-area-dual-axis",
    faq: [
      { question: "什么是融资融券余额？", answer: "融资余额是投资者借钱买股票的未偿还金额，融券余额是借股票卖空的未偿还金额。两者合计反映市场整体杠杆水平。" },
      { question: "融资余额和股市有什么关系？", answer: "融资余额通常与市场走势正相关——牛市时杠杆资金涌入推高融资余额，熊市时去杠杆导致余额下降。2015 年股灾前融资余额曾突破 2.2 万亿。" },
      { question: "为什么融资余额能反映市场情绪？", answer: "融资买入需要承担利息和追保压力，通常出现在投资者风险偏好较高、愿意加杠杆的时候；余额快速下降则常伴随风险偏好回落和被动去杠杆。" },
    ],
    dataFile: "margin/balance.json",
    apiEndpoint: "/api/china-characteristics/margin-balance.json",
    ogImage: true,
    relatedPanels: ["policy-timeline", "ipo-rhythm", "annual-return"],
  },

  {
    id: "return-decomp",
    section: "china-characteristics",
    slug: "/china-characteristics/return-decomp",
    title: "回报拆分",
    titleEn: "Return Decomposition — PE vs EPS",
    description: "A股年度回报拆分：PE估值驱动 vs EPS盈利驱动。股市年度涨跌可以近似拆成两类来源：企业盈利变化带来的 EPS 驱动，以及市场愿意给出更高或更低估值倍数带来的 PE 扩张/收缩。本面板以上证综指和沪深300为对象，将年度价格回报拆分为 PE 贡献与 EPS 残差贡献，帮助判断某一年的上涨或下跌更多来自真实盈利变化，还是来自市场情绪和估值倍数变化。",
    keywords: ["回报拆分", "PE", "EPS", "估值", "盈利", "return decomposition"],
    dataSources: ["return_decomp/data.json", "AkShare", "上交所", "乐咕乐股"],
    updateFrequency: "yearly",
    dataProcessing: "年度价格回报取指数年末收盘价同比；PE 取每年最后一个可得交易日；PE贡献为 PE 年末同比变化率，EPS贡献用年度价格回报减 PE贡献的残差法估算，不含股息率。",
    chartType: "stacked-bar-line",
    faq: [
      { question: "什么是回报拆分？", answer: "把股市年度涨跌分解为两部分：EPS增长（企业真实盈利变化）和PE扩张（市场情绪/估值变化）。牛市往往PE扩张贡献更大，熊市通常PE收缩是主因。" },
      { question: "为什么PE贡献有时候是负的？", answer: "即使企业盈利增长，如果市场给予的估值倍数下降（比如从20倍跌到15倍），PE贡献就是负的，会拖累总回报。" },
      { question: "EPS贡献为什么用残差法？", answer: "指数层面的年度 EPS 序列并不总是稳定可得，因此这里用价格回报减去 PE 变化率估算盈利贡献。它适合观察方向和量级，不应被视为精确会计分解。" },
    ],
    dataFile: "return_decomp/data.json",
    apiEndpoint: "/api/china-characteristics/return-decomp.json",
    ogImage: true,
    relatedPanels: ["hs300-pe", "shanghai-pe", "annual-return"],
  },

  {
    id: "commodities",
    section: "global-linkage",
    slug: "/global-linkage/commodities",
    title: "大宗商品联动",
    titleEn: "Commodities Linkage — Copper, Oil, Gold vs Shanghai Composite",
    description: "铜、原油、黄金与上证综指的联动走势，揭示 A 股与全球大宗商品周期的关系。铜价常被视为全球制造业景气的温度计，原油影响通胀和制造业成本，黄金反映避险情绪与实际利率预期。把三者和上证综指归一化到同一基准，可以观察 A 股在全球宏观周期中的相对强弱和联动方向。",
    keywords: ["大宗商品", "铜价", "原油", "黄金", "全球宏观"],
    dataSources: ["commodities/data.json", "AkShare", "LME", "NYMEX"],
    updateFrequency: "daily",
    dataProcessing: "铜、原油、黄金价格按上证交易日向前填充；图表端以 2015 年首个可得交易日归一化为 100。当前长历史铜价优先使用 AkShare 可得的沪铜主连 CU0 fallback，以保证 2010 年以来覆盖。",
    chartType: "normalized-line",
    faq: [
      { question: "为什么用归一化指数而不是原始价格？", answer: "铜价以美元/吨计、黄金以美元/盎司计、原油以美元/桶计，量纲不同无法直接比较。归一化为相对基准的指数后，可以直观比较各资产的相对涨跌幅。" },
      { question: "铜价和A股有关系吗？", answer: "铜是工业生产的核心原材料，铜价上涨通常反映全球制造业扩张预期，历史上与A股周期股走势有一定正相关性，但并非绝对。" },
    ],
    dataFile: "commodities/data.json",
    apiEndpoint: "/api/global-linkage/commodities.json",
    ogImage: true,
    relatedPanels: ["hs300-vs-sp500", "annual-return", "bond-equity"],
  },

  annualIndexPanel({
    idPrefix: "hscei",
    section: "hang-seng",
    sectionSlug: "hang-seng",
    indexSlug: "hscei",
    titleCn: "恒生国企指数",
    titleEn: "Hang Seng China Enterprises",
    indexNameCn: "恒生国企指数",
    indexNameEn: "Hang Seng China Enterprises Index",
    dataSource: "Sina Finance",
    relatedPanels: ["hscei-drawdown", "hsi-annual-return", "hsi-vs-hs300"],
  }),

  drawdownIndexPanel({
    idPrefix: "hscei",
    section: "hang-seng",
    sectionSlug: "hang-seng",
    indexSlug: "hscei",
    titleCn: "恒生国企指数",
    titleEn: "Hang Seng China Enterprises",
    indexNameCn: "恒生国企指数",
    indexNameEn: "Hang Seng China Enterprises Index",
    dataSource: "Sina Finance",
    relatedPanels: ["hscei-annual-return", "hsi-drawdown", "hsi-vs-hs300"],
  }),

  annualIndexPanel({
    idPrefix: "csi500",
    section: "broad-market",
    sectionSlug: "broad-market",
    indexSlug: "csi500",
    titleCn: "中证500",
    titleEn: "CSI 500",
    indexNameCn: "中证500",
    indexNameEn: "CSI 500",
    dataSource: "AkShare",
    relatedPanels: ["csi500-drawdown", "csi500-pe", "hs300-vs-shanghai"],
  }),

  drawdownIndexPanel({
    idPrefix: "csi500",
    section: "broad-market",
    sectionSlug: "broad-market",
    indexSlug: "csi500",
    titleCn: "中证500",
    titleEn: "CSI 500",
    indexNameCn: "中证500",
    indexNameEn: "CSI 500",
    dataSource: "AkShare",
    relatedPanels: ["csi500-annual-return", "csi500-pe", "drawdown"],
  }),

  valuationIndexPanel({
    idPrefix: "csi500",
    section: "broad-market",
    sectionSlug: "broad-market",
    indexSlug: "csi500",
    titleCn: "中证500",
    titleEn: "CSI 500",
    indexNameCn: "中证500",
    indexNameEn: "CSI 500",
    dataSource: "AkShare",
    relatedPanels: ["csi500-annual-return", "csi500-drawdown", "hs300-pe"],
  }, "pe", "Price/Earnings (TTM)"),

  annualIndexPanel({
    idPrefix: "gem",
    section: "broad-market",
    sectionSlug: "broad-market",
    indexSlug: "gem",
    titleCn: "创业板指",
    titleEn: "ChiNext",
    indexNameCn: "创业板指",
    indexNameEn: "ChiNext Index",
    dataSource: "AkShare",
    relatedPanels: ["gem-drawdown", "star50-annual-return", "csi500-annual-return"],
  }),

  drawdownIndexPanel({
    idPrefix: "gem",
    section: "broad-market",
    sectionSlug: "broad-market",
    indexSlug: "gem",
    titleCn: "创业板指",
    titleEn: "ChiNext",
    indexNameCn: "创业板指",
    indexNameEn: "ChiNext Index",
    dataSource: "AkShare",
    relatedPanels: ["gem-annual-return", "star50-drawdown", "drawdown"],
  }),

  annualIndexPanel({
    idPrefix: "sse50",
    section: "broad-market",
    sectionSlug: "broad-market",
    indexSlug: "sse50",
    titleCn: "上证50",
    titleEn: "SSE 50",
    indexNameCn: "上证50",
    indexNameEn: "SSE 50",
    dataSource: "AkShare",
    relatedPanels: ["sse50-drawdown", "sse50-pe", "sse50-pb"],
  }),

  drawdownIndexPanel({
    idPrefix: "sse50",
    section: "broad-market",
    sectionSlug: "broad-market",
    indexSlug: "sse50",
    titleCn: "上证50",
    titleEn: "SSE 50",
    indexNameCn: "上证50",
    indexNameEn: "SSE 50",
    dataSource: "AkShare",
    relatedPanels: ["sse50-annual-return", "sse50-pe", "drawdown"],
  }),

  valuationIndexPanel({
    idPrefix: "sse50",
    section: "broad-market",
    sectionSlug: "broad-market",
    indexSlug: "sse50",
    titleCn: "上证50",
    titleEn: "SSE 50",
    indexNameCn: "上证50",
    indexNameEn: "SSE 50",
    dataSource: "AkShare",
    relatedPanels: ["sse50-annual-return", "sse50-drawdown", "sse50-pb"],
  }, "pe", "Price/Earnings (TTM)"),

  valuationIndexPanel({
    idPrefix: "sse50",
    section: "broad-market",
    sectionSlug: "broad-market",
    indexSlug: "sse50",
    titleCn: "上证50",
    titleEn: "SSE 50",
    indexNameCn: "上证50",
    indexNameEn: "SSE 50",
    dataSource: "AkShare",
    relatedPanels: ["sse50-annual-return", "sse50-drawdown", "sse50-pe"],
  }, "pb", "Price/Book Ratio"),

  annualIndexPanel({
    idPrefix: "star50",
    section: "broad-market",
    sectionSlug: "broad-market",
    indexSlug: "star50",
    titleCn: "科创50",
    titleEn: "STAR 50",
    indexNameCn: "科创50",
    indexNameEn: "STAR 50",
    dataSource: "AkShare",
    relatedPanels: ["star50-drawdown", "gem-annual-return", "csi500-annual-return"],
  }),

  drawdownIndexPanel({
    idPrefix: "star50",
    section: "broad-market",
    sectionSlug: "broad-market",
    indexSlug: "star50",
    titleCn: "科创50",
    titleEn: "STAR 50",
    indexNameCn: "科创50",
    indexNameEn: "STAR 50",
    dataSource: "AkShare",
    relatedPanels: ["star50-annual-return", "gem-drawdown", "drawdown"],
  }),
];

// ─── Helper Functions ────────────────────────────────────────────────

/** 获取某个 section 下的所有面板 */
export function getPanelsBySection(sectionId: SectionId): PanelDef[] {
  return PANELS.filter(p => p.section === sectionId);
}

/** 通过 id 获取面板 */
export function getPanelById(id: string): PanelDef | undefined {
  return PANELS.find(p => p.id === id);
}

/** 通过 slug 获取面板 */
export function getPanelBySlug(slug: string): PanelDef | undefined {
  return PANELS.find(p => p.slug === slug);
}

/** 获取所有 slug（用于 generateStaticParams） */
export function getAllSlugs(): string[] {
  return PANELS.map(p => p.slug);
}

/** 获取关联面板 */
export function getRelatedPanels(id: string): PanelDef[] {
  const panel = getPanelById(id);
  if (!panel) return [];
  return panel.relatedPanels
    .map(rid => getPanelById(rid))
    .filter((p): p is PanelDef => p !== undefined);
}
