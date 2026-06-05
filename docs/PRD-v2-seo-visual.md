# PRD v2 补充：SEO 基础设施 + 视觉对齐

> 本文件是 PRD.md 的补充，不替代原 PRD。
> 原 PRD 定义内容和数据管道；本文件定义 SEO 工程和视觉打磨。

---

## 背景

参考站 historyofmarket.com（美股编年史）在 SEO 基础设施和视觉完成度上远超当前版本。
本次升级目标：**把中国股市编年史从"能用的 MVP"升级到"可被搜索引擎发现的、有品质感的编年史"**。

---

## 参考站对标分析

### 参考站做了什么（historyofmarket.com）

1. **SEO Head 完整度**：
   - 200+ 中英双语 meta keywords
   - 完整 Open Graph（og:title, og:description, og:image, og:locale, og:type, og:url, og:updated_time）
   - 完整 Twitter Cards（twitter:card, twitter:title, twitter:description, twitter:image）
   - canonical URL
   - robots / googlebot 精细控制
   - 结构化 article 标签（article:author, article:published_time, article:modified_time, article:section, article:tag）
   - 多语言声明（zh_CN + ko_KR）
   - PWA 支持（apple-mobile-web-app-capable, theme-color, msapplication-TileImage）
   - Bing 验证（msvalidate.01）
   - 数据来源声明（rights meta）
   - 许可证声明（CC-BY-4.0）

2. **视觉**：
   - 深色主题 #1A140E（深棕/焦糖色调，非纯黑）
   - Editorial 编辑排版风格
   - 60+ 图表，Tab 导航（6 个 Tab 按指数分类）

3. **数据新鲜度声明**：
   - "价格序列每个交易日刷新"
   - "估值/宏观/手工 Bloomberg 数据按上游 cadence 更新"

4. **Footer**：
   - 逐一列出数据来源
   - CC-BY-4.0 许可
   - 版权声明

### 我们现在缺什么

| 维度 | 参考站 | 我们 | 差距等级 |
|------|--------|------|----------|
| Meta keywords | 200+ | 0 | 🔴 严重 |
| Open Graph | 完整 | 无 | 🔴 严重 |
| Twitter Cards | 完整 | 无 | 🔴 严重 |
| canonical URL | 有 | 无 | 🔴 严重 |
| robots / googlebot | 精细 | 无 | 🟡 中等 |
| 结构化数据 | article tags | 无 | 🟡 中等 |
| PWA manifest | 完整 | 无 | 🟡 中等 |
| Favicon 全套 | 完整 | 待确认 | 🟡 中等 |
| OG 封面图 | 有 (/og/cover.png) | 无 | 🟡 中等 |
| 数据新鲜度声明 | 明确 | 无 | 🟡 中等 |
| Footer 丰富度 | 数据源 + 许可 + 联系 | 极简 | 🟡 中等 |
| 许可证 | CC-BY-4.0 | 无 | 🟢 低 |

---

## 本次升级范围

### P0 — SEO 基础设施（CC 主导）

> 不改页面视觉，只改 `<head>` 和 metadata。

#### P0-1: 完善 `<head>` meta 标签

在 Next.js 的 `layout.tsx` 或 `metadata` 导出中添加：

```
- title: "中国股市编年史 · History of China Market — A 股/港股 百年走势·估值·回撤"
- description: 200字以内的中英文描述
- keywords: 50-100 个关键词（中英双语）
  中文: 上证综指历史, 沪深300走势, A股年度涨跌, A股最大回撤, A股估值, 
        沪深300市盈率, 恒生指数历史, 北向资金, AH溢价, 中国股市编年史 ...
  英文: Shanghai Composite history, CSI 300 chart, A-share annual returns,
        China stock market history, Hang Seng index history ...
- canonical: https://china-market-chronicle.vercel.app/
- robots: index, follow, max-image-preview:large
```

#### P0-2: 添加 Open Graph 标签

```
- og:title
- og:description
- og:image（需要制作封面图）
- og:url
- og:type: website
- og:locale: zh_CN
- og:site_name: 中国股市编年史 · History of China Market
```

#### P0-3: 添加 Twitter Cards

```
- twitter:card: summary_large_image
- twitter:title
- twitter:description
- twitter:image
```

#### P0-4: 制作 OG 封面图 (/og/cover.png)

- 1200×630 像素
- 网站名称 + 副标题 + 简洁的图表元素
- 用 Next.js 的 `opengraph-image.tsx` 动态生成，或静态 PNG

### P1 — Footer 和数据声明（CC + Codex 协作）

#### P1-1: 丰富 Footer

当前 Footer 太简了。参考站的 Footer 包含：
- 数据来源列表（逐条列出，带链接）
- 数据更新频率说明
- 许可证声明（建议 CC-BY-4.0 或自定义）
- 版权声明 © 2025-2026
- "本站数据仅供研究参考"（已有，保留）

#### P1-2: 数据新鲜度声明

在 Footer 或每个面板的数据源标注中明确：
- 哪些数据是静态的（手工采集，定期更新）
- 哪些数据是自动更新的（pipeline 抓取）
- 最后更新时间

### P2 — 视觉微调（Codex 主导）

#### P2-1: Section 标题排版

参考站的 Section 标题有明确的编辑排版层次感。我们的 Section 标题（§ I, § II...）已经有了编年史气质，但间距、字号、副标题的处理可以更精致。

#### P2-2: 图表容器统一

- 所有图表卡片的 padding、border、背景色、loading 状态统一
- hover 效果
- 数据源标注位置统一

#### P2-3: 导航栏（底部 TOC）

当前底部有一个 Section 导航条。对比参考站的 Tab 导航：
- 位置：参考站在顶部 Tab，我们在底部
- 状态：需要 active section 的高亮反馈（scroll spy）
- 移动端适配：需要确认在小屏幕上是否可用

---

## CC 和 Codex 的分工

| 任务 | 负责 | 理由 |
|------|------|------|
| P0-1: `<head>` meta | **CC** | 改 Next.js layout/metadata 配置，架构层 |
| P0-2: Open Graph | **CC** | 同上 |
| P0-3: Twitter Cards | **CC** | 同上 |
| P0-4: OG 封面图 | **CC** | 需要 Next.js opengraph-image.tsx |
| P1-1: Footer HTML/样式 | **Codex** | 前端组件 + 样式，Codex 的活 |
| P1-2: 数据新鲜度标注 | **Codex** | 每个面板底部加更新时间 UI |
| P2-1: Section 标题排版 | **Codex** | CSS/Tailwind 微调 |
| P2-2: 图表容器统一 | **Codex** | CSS/Tailwind 微调 |
| P2-3: 导航栏优化 | **Codex** | 前端交互 + scroll spy |

---

## 验收标准

### P0 验收（SEO）

- [ ] 用 https://metatags.io/ 检查 OG 预览正常
- [ ] 用 https://cards-dev.twitter.com/validator 检查 Twitter Card 正常
- [ ] Google 搜索 `site:china-market-chronicle.vercel.app` 能看到完整标题和描述
- [ ] Lighthouse SEO 评分 ≥ 90

### P1 验收（Footer）

- [ ] Footer 包含所有数据源名称和链接
- [ ] Footer 包含数据更新频率说明
- [ ] Footer 包含版权和许可声明

### P2 验收（视觉）

- [ ] Section 标题层次在 Desktop 和 Mobile 上都清晰
- [ ] 所有图表卡片视觉一致（padding、border、loading）
- [ ] 底部导航有 active section 高亮
