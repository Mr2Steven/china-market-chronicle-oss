export default function IndexRulesInfo() {
  const rules = [
    {
      title: "编制机构",
      content: "中证指数有限公司（中证指数），上海证券交易所和深圳证券交易所共同出资成立。",
    },
    {
      title: "样本空间",
      content:
        "沪深两市 A 股，剔除：① 上市不足一个季度的新股（特殊情况除外）；② ST/∗ST 股票；③ 财务状况异常或存在重大法律纠纷；④ 过去三个月日均成交额排名靠后 10% 的股票。",
    },
    {
      title: "纳入标准",
      content:
        "在样本空间内，按过去一年日均成交额从高到低排名，选取前 300 只（每只最多选 30% 的样本池）。若候选股票数不足 300，则放宽流动性要求直至补满。",
    },
    {
      title: "权重计算",
      content:
        "按自由流通市值加权（Free-Float Market Cap Weighted）。单只成分股权重上限为 10%，每次调整后若超出须在下次调整前被动摊薄。2024 年起对流通市值超大股增设 15% 缓冲上限。",
    },
    {
      title: "定期调整",
      content:
        "每年 6 月和 12 月末各调整一次，结果在调整前一个月公告，调整生效日为次月第二个周五。单次调整数量通常为 10–30 只，总量保持 300 只。",
    },
    {
      title: "不定期调整",
      content:
        "成分股发生合并、分拆、退市或 ST 等重大事件时可触发不定期调整，该成分股直接剔除，补选候补股票替代。",
    },
    {
      title: "基期与基点",
      content:
        "基期：2004 年 12 月 31 日，基点：1000 点。指数按全价（不含现金股利）计算，另有沪深 300 全收益指数（含再投资股利）可供参考。",
    },
    {
      title: "再平衡机制",
      content:
        "两次定期调整之间，权重随价格波动自然漂移，不做强制再平衡。成分股权重占比可因市价涨跌偏离初始权重。",
    },
  ];

  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 16 }}>
        {rules.map((r) => (
          <div
            key={r.title}
            style={{
              border: "1px solid var(--border)",
              borderRadius: 6,
              padding: "14px 16px",
              background: "var(--bg-panel)",
            }}
          >
            <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, fontWeight: 700, color: "#C41E3A", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.04em" }}>
              {r.title}
            </div>
            <div style={{ fontFamily: "var(--font-sans)", fontSize: 13, color: "var(--text)", lineHeight: 1.65 }}>
              {r.content}
            </div>
          </div>
        ))}
      </div>
      <div style={{ marginTop: 16, fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--text-muted)" }}>
        资料来源：《沪深 300 指数编制方案》，中证指数有限公司，2023 年修订版。
      </div>
    </div>
  );
}
