# PRD v1.0 — 中国股市编年史 · History of China Market

## 面板总览

原站共 36 个面板，本项目复刻 **40 个面板**（36 个对标面板 + 4 个中国特色面板）。
每个面板都有唯一 ID、中英文标题、副标题、图表类型、数据源。

---

## A 股篇 · § I 世纪尺度的回报形状 (The Shape of History)

### Panel A01: 年度涨跌 `panel-annual`
- **原站对标**: `#panel-annual`（S&P 500 年度回报柱状图）
- **适用指数**: 上证综指 (1991→) / 沪深300 (2005→)（用 IndexSelector 切换）
- **中文标题**: 三十五年的年度涨跌
- **英文副标题**: Annual Returns since 1991
- **图表类型**: 垂直柱状图 (ECharts bar)
- **X 轴**: 年份
- **Y 轴**: 年度涨跌幅 (%)
- **柱色**: 上涨 `#C41E3A`（红），下跌 `#2D6A4F`（绿）— 注意中国红涨绿跌
- **Tooltip**: `{年份}: {涨跌幅}% ({收盘点位})`
- **统计卡片**: 上涨年数/下跌年数、算术平均回报、最好年份、最差年份
- **数据源 JSON**: `/api/shanghai/annual-returns.json`
- **JSON 格式**:
```json
[
  {"year": 1991, "return_pct": 129.41, "close": 292.75},
  {"year": 1992, "return_pct": 166.57, "close": 780.39},
  ...
]
```

### Panel A02: 年度回报的真实长相 `panel-annual-dist`
- **原站对标**: `#panel-annual-dist`（回报分布直方图）
- **中文标题**: 年度回报的真实长相
- **英文副标题**: What Annual Returns Actually Look Like
- **图表类型**: 直方图 (ECharts bar，横向分桶)
- **X 轴**: 回报区间（<-30%, -30~-20%, -20~-10%, -10~0%, 0~10%, 10~20%, 20~30%, 30~50%, >50%）
- **Y 轴**: 年份数量
- **颜色**: 负回报桶用绿色渐变，正回报桶用红色渐变
- **标注**: 在均值位置画虚线 + label
- **数据**: 前端从 annual-returns.json 计算，不需要额外 JSON

### Panel A03: 任选买入与卖出年份 `panel-annualized-matrix`
- **原站对标**: `#panel-annualized-matrix`（年化回报矩阵热力图）
- **中文标题**: 任选买入年份与卖出年份
- **英文副标题**: Pick Any Entry & Exit Year
- **图表类型**: 热力图 (ECharts heatmap)
- **X 轴**: 卖出年份
- **Y 轴**: 买入年份
- **色阶**: 深绿(负) → 白(0) → 深红(正)，中国红涨绿跌
- **Tooltip**: `买入{Y年} → 卖出{X年}: 年化 {CAGR}%（持有{N}年）`
- **数据**: 前端从 daily.json 计算每年末收盘价，两两配对算 CAGR

### Panel A04: 五年滚动年化收益 `panel-rolling`
- **原站对标**: `#panel-rolling`（5年滚动窗口）
- **中文标题**: 五年之后，年化回报通常是多少
- **英文副标题**: 5-Year Rolling Annualized Returns
- **图表类型**: 面积图 (ECharts line + areaStyle)
- **X 轴**: 日期
- **Y 轴**: 5年滚动年化收益 (%)
- **颜色**: 正值填充红色半透明，负值填充绿色半透明
- **零线**: 加粗灰色虚线
- **数据源 JSON**: `/api/shanghai/rolling-5y.json`
- **JSON 格式**:
```json
[
  {"date": "1996-12-31", "cagr_5y": 28.73},
  ...
]
```

### Panel A05: 对数同比视角 `panel-logyoy`
- **原站对标**: `#panel-sp500-logyoy`
- **中文标题**: 穿越零线的牛熊边界
- **英文副标题**: Log Year-over-Year
- **图表类型**: 面积图
- **计算**: ln(当日收盘 / 252个交易日前收盘)
- **数据**: 前端从 daily.json 计算

---

## A 股篇 · § II 危机的节奏 (The Rhythm of Crisis)

### Panel A06: 历史回撤 `panel-drawdown`
- **原站对标**: `#panel-drawdown`
- **中文标题**: 每一次深跌都有名字
- **英文副标题**: Named Drawdowns since 1992
- **图表类型**: 面积图（向下填充）+ 标注气泡
- **X 轴**: 日期
- **Y 轴**: 回撤幅度 (%)，从0向下
- **填充色**: 绿色半透明（越深越暗）
- **标注**: 在每次>20%的回撤谷底标注名称和幅度
- **数据源 JSON**: `/api/shanghai/drawdowns.json`
- **JSON 格式**:
```json
{
  "daily_drawdown": [
    {"date": "1992-01-02", "drawdown_pct": 0},
    {"date": "1992-05-26", "drawdown_pct": -44.8},
    ...
  ],
  "named_events": [
    {
      "name": "327国债事件",
      "peak_date": "1994-09-13",
      "trough_date": "1996-01-19",
      "drawdown_pct": -56.2,
      "recovery_date": "1997-05-12",
      "recovery_days": 580,
      "category": "政策冲击"
    },
    {
      "name": "2008全球金融危机",
      "peak_date": "2007-10-16",
      "trough_date": "2008-10-28",
      "drawdown_pct": -72.8,
      "recovery_date": null,
      "recovery_days": null,
      "category": "信用危机"
    },
    {
      "name": "2015股灾",
      "peak_date": "2015-06-12",
      "trough_date": "2016-01-27",
      "drawdown_pct": -48.9,
      "recovery_date": null,
      "recovery_days": null,
      "category": "去杠杆"
    },
    ...
  ]
}
```
- **关键回撤事件名册**（compute_derived.py 中硬编码）:
  - 1993-1994: 泡沫破裂 (-79%)
  - 2001-2005: 国有股减持 (-55%)
  - 2007-2008: 全球金融危机 (-72.8%)
  - 2015 股灾 (-48.9%)
  - 2018 贸易战 (-30.5%)
  - 2020 新冠 (-16.1%)
  - 2024 年初 (-17.5%)

### Panel A07: 年内最深跌幅 vs 全年涨跌 `panel-intrayear-dd`
- **原站对标**: `#panel-intrayear-dd`
- **中文标题**: 年内最深跌幅 vs 全年涨跌
- **英文副标题**: Intra-Year Decline vs Full-Year Return
- **图表类型**: 双柱图 — 每年两根柱子
  - 柱1 (灰色): 年内最大回撤 (负数)
  - 柱2 (红/绿): 全年涨跌幅
- **关键洞察标注**: "年内平均最大回撤 ≈ -XX%，但年末仍平均收正"
- **数据源 JSON**: `/api/shanghai/intrayear-dd.json`

### Panel A08: 波动率 `panel-volatility`
- **原站对标**: `#panel-volatility`
- **中文标题**: 市场的呼吸频率
- **英文副标题**: 20/60-Day Annualized Volatility
- **图表类型**: 双线图
- **线1**: 20日滚动年化波动率 (细线)
- **线2**: 60日滚动年化波动率 (粗线)
- **计算**: σ = std(日收益率, window) × √252 × 100
- **数据**: 前端从 daily.json 计算

### Panel A09: 隐含波动率 `panel-ivix`
- **原站对标**: `#panel-vix`（VIX）
- **中文标题**: 中国波指 · iVIX（如可用）/ 实际波动率
- **说明**: 中国没有持续公布的 VIX 等价物，iVIX 已于 2018 年停更。替代方案：使用 60 日已实现波动率 + 标注历史高波动事件。如果 AkShare 有 `index_option_50etf_ivix` 接口可用，则优先使用。
- **图表类型**: 面积图
- **颜色**: 波动率 > 30% 区域填充红色警告色

### Panel A10: 月度季节性 `panel-monthly`
- **原站对标**: `#panel-monthly`
- **中文标题**: 一年十二个月的季节性
- **英文副标题**: Monthly Win Rates & Average Returns
- **图表类型**: 热力图 (12列 × N行)
  - 行: 年份
  - 列: 1月~12月
  - 色阶: 绿(负) → 白(0) → 红(正)
- **底部汇总行**: 每月平均涨跌、胜率
- **数据源 JSON**: `/api/shanghai/monthly.json`
- **JSON 格式**:
```json
{
  "matrix": [
    {"year": 1991, "months": [10.2, -5.3, 8.1, ...]},
    ...
  ],
  "summary": {
    "avg": [2.1, 0.5, 1.8, ...],
    "win_rate": [0.62, 0.54, 0.58, ...]
  }
}
```

---

## A 股篇 · § III 估值的锚点 (Anchors of Valuation)

### Panel A11: 市盈率（PE-TTM）`panel-pe`
- **原站对标**: `#panel-pe`（Shiller CAPE）
- **中文标题**: 市盈率 · PE-TTM 历史走势
- **说明**: A 股没有标准化的 Shiller CAPE 序列。替代方案：使用乐咕乐股的指数 PE-TTM 历史数据。
- **图表类型**: 面积图 + 均值/±1标准差带
- **标注线**: 长期均值 (虚线)、当前值 (标签)
- **历史分位标注**: 当前 PE 处于历史 XX% 分位
- **数据源 JSON**: `/api/hs300/pe.json`
- **JSON 格式**:
```json
[
  {"date": "2005-01-04", "pe": 14.2},
  ...
]
```

### Panel A12: 市净率（PB）`panel-pb`
- **原站对标**: 原站无，中国特色面板
- **中文标题**: 市净率 · PB 历史走势
- **图表类型**: 同 Panel A11
- **数据源 JSON**: `/api/hs300/pb.json`

### Panel A13: 股债收益比 `panel-equity-bond`
- **原站对标**: `#panel-aiae`（AIAE 居民股票配置）
- **中文标题**: 股债收益比 · 万得全A盈利收益率 / 十年国债
- **说明**: AIAE 在中国无直接等价物。替代指标：沪深300 PE倒数（即 E/P 盈利收益率）÷ 10年国债收益率。这是 A 股最常用的估值锚。
- **图表类型**: 面积图
- **阈值线**: >2.0 (低估区，红色填充)、<1.0 (高估区，绿色填充)
- **数据**: pipeline 中计算，输出 `/api/hs300/equity-bond-ratio.json`

### Panel A14: 市场整体市盈率 `panel-market-pe`
- **原站对标**: `#panel-eps` + `#panel-roe`
- **中文标题**: A 股主板整体市盈率
- **英文副标题**: A-Share Main Board P/E Ratio
- **图表类型**: 面积图
- **数据**: `ak.stock_market_pe_lg(symbol="上证A股")`

### Panel A15: 总回报分解 `panel-return-details`
- **原站对标**: `#panel-return-details`
- **中文标题**: 总回报 = 价格变动 + 股息
- **说明**: A 股回购文化薄弱，主要分解为价格回报 + 股息回报。
- **图表类型**: 堆叠柱状图（年度）
- **数据**: 需要指数点位 + 全收益指数（如沪深300全收益 H00300）的差值来推算股息贡献

---

## A 股篇 · § IV 结构与规则 (Structure & Rules)

### Panel A16: A 股七巨头 `panel-a7`
- **原站对标**: `#panel-m7`（Magnificent 7）
- **中文标题**: A 股七巨头等权指数
- **英文副标题**: China's Magnificent 7
- **成分（可调整）**: 宁德时代 300750、贵州茅台 600519、比亚迪 002594、招商银行 600036、美的集团 000333、中芯国际 688981、海康威视 002415
- **图表类型**: 多线图 (各股 + 等权指数)
- **数据**: 每只股票日线数据，标准化为基准100，等权合成

### Panel A17: 行业权重分布 `panel-sectors`
- **原站对标**: `#panel-sectors`（GICS 行业）
- **中文标题**: 申万一级行业权重分布
- **图表类型**: 堆叠面积图 (时间序列) 或 Treemap (截面)
- **数据**: 需从沪深300成分股权重按行业汇总

### Panel A18: 成分股散点图 `panel-scatter`
- **原站对标**: `#panel-scatter`
- **中文标题**: 市值 · 一年回报 · 指数权重
- **图表类型**: 气泡散点图
- **X 轴**: 一年回报 (%)
- **Y 轴**: 总市值（对数）
- **气泡大小**: 指数权重
- **数据源**: `/api/hs300/constituents.json`

### Panel A19: 调入调出历史 `panel-changes`
- **原站对标**: `#panel-changes`
- **中文标题**: 沪深300 调入与调出的历史
- **图表类型**: 时间轴 (ECharts timeline) 或表格
- **数据**: 沪深300 半年度调整记录

### Panel A20: 编制规则 `panel-rules`
- **原站对标**: `#panel-rules`
- **中文标题**: 沪深300 是如何「编」出来的
- **图表类型**: 纯文本/信息图（不需要数据 JSON）
- **内容**: 中证指数公司的编制方法、纳入门槛、调整频率

---

## 港股篇 · § V 恒生指数 (Hang Seng)

### Panel H01–H10: 恒生指数的 10 个核心面板
一一对标 A01–A10，指数换为恒生指数 (HSI)。
- H01: 恒生年度涨跌 (1970→)
- H02: 恒生回报分布
- H03: 恒生年化矩阵
- H04: 恒生5年滚动收益
- H05: 恒生对数同比
- H06: 恒生历史回撤（含97金融风暴、03 SARS、08金融危机、19社运、22调整）
- H07: 恒生年内回撤 vs 全年
- H08: 恒生波动率
- H09: 恒生 VHSI（香港波动率指数，有数据）
- H10: 恒生月度季节性

### Panel H11–H15: 恒生估值与结构
- H11: 恒生 PE (可从 Bloomberg/CEIC 获取历史，或用 AkShare 港股指标)
- H12: 恒生科技走势 (HSTECH, 2020→)
- H13: 恒生 AH 溢价指数 (HSAHP)
- H14: 恒生行业权重
- H15: 恒生成分股散点图

---

## 中国特色面板 · § VI (China-Specific)

### Panel C01: 北向资金 `panel-northbound`
- **中文标题**: 北向资金 · 外资的脚步
- **英文副标题**: Stock Connect Northbound Flow
- **图表类型**: 柱状图（日净流入）+ 累计线
- **数据源 JSON**: `/api/northbound/flow.json`

### Panel C02: A/H 溢价指数 `panel-ah-premium`
- **中文标题**: A/H 溢价指数 · 两地定价差
- **图表类型**: 面积图 + 100基准线
- **数据源 JSON**: `/api/ah-premium/index.json`

### Panel C03: 新股 IPO 节奏 `panel-ipo`
- **中文标题**: 新股发行节奏 · 注册制前后
- **图表类型**: 柱状图（月度 IPO 数量）+ 面积图（月度融资额）
- **数据**: `ak.stock_em_ipo()`

### Panel C04: 中美对比 `panel-cn-vs-us`
- **中文标题**: 沪深300 vs 标普500 · 两个世界的估值周期
- **图表类型**: 双轴折线图
- **左轴**: 沪深300 (标准化基准100)
- **右轴**: S&P 500 (标准化基准100)
- **对比区间**: 2005年至今（沪深300起始）
- **数据**: S&P 500 日线可从 AkShare `index_us_stock_sina(symbol="SPX")` 获取

---

## 长文页面 (Articles)

对标原站 5 篇长文：

1. **上证综指三十五年走势：1991–2026 完整复盘** → `/articles/shanghai-35-year-history`
2. **A 股历史最大回撤完整名册：1992 至今** → `/articles/china-stock-max-drawdowns`
3. **现在 A 股估值贵不贵？PE/PB/股债比全解析** → `/articles/china-valuation-now`
4. **恒生指数五十五年：1970–2026** → `/articles/hsi-55-year-history`
5. **沪深300 近二十年回报复盘** → `/articles/hs300-20-year-returns`

---

## 首页布局

首页是编年史长卷，所有面板纵向排列，左侧固定导航锚点。

```
[Header: 中国股市编年史 · History of China Market]
[IndexSelector: 上证综指 | 沪深300 | 创业板指 | 恒生指数]

§ I 回报的形状
  [A01 年度涨跌]
  [A02 回报分布]
  [A03 年化矩阵]
  [A04 滚动收益]
  [A05 对数同比]

§ II 危机的节奏
  [A06 历史回撤]
  [A07 年内回撤]
  [A08 波动率]
  [A09 波指/已实现波动率]
  [A10 月度季节性]

§ III 估值的锚点
  [A11 PE]
  [A12 PB]
  [A13 股债比]
  [A14 主板PE]
  [A15 回报分解]

§ IV 结构与规则
  [A16 七巨头]
  [A17 行业权重]
  [A18 散点图]
  [A19 调入调出]
  [A20 编制规则]

§ V 恒生指数
  [H01–H15 港股面板]

§ VI 中国特色
  [C01 北向资金]
  [C02 AH溢价]
  [C03 IPO节奏]
  [C04 中美对比]

[Footer: 数据来源 · 免责声明 · CC BY 4.0]
```

---

## 响应式设计

- **桌面 (>1024px)**: 面板宽度 900px 居中，左侧浮动导航
- **平板 (768-1024px)**: 面板全宽，导航折叠为顶部下拉
- **手机 (<768px)**: 面板全宽，图表高度适配（最小 300px），热力图支持双指缩放

## 性能要求

- 首屏 (A01) < 2s 加载
- 每个 JSON 文件 < 500KB（超过则按年份拆分懒加载）
- ECharts 按需引入（只 import 用到的图表类型）
- 图片使用 Next.js Image 组件 + WebP
