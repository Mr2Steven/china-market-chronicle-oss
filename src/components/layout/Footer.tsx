export default function Footer() {
  const dataSources = [
    { name: "AkShare", href: "https://akshare.akfamily.xyz/" },
    { name: "中证指数公司", href: "https://www.csindex.com.cn/" },
    { name: "乐咕乐股", href: "https://legulegu.com/" },
    { name: "Sina Finance", href: "https://finance.sina.com.cn/" },
    { name: "东方财富", href: "https://www.eastmoney.com/" },
  ];

  return (
    <footer className="site-footer">
      <div className="site-footer__inner">
        <div className="site-footer__section">
          <h2>数据来源</h2>
          <ul className="site-footer__links">
            {dataSources.map((source) => (
              <li key={source.name}>
                <a href={source.href} target="_blank" rel="noreferrer">
                  {source.name}
                </a>
              </li>
            ))}
          </ul>
        </div>

        <div className="site-footer__section">
          <h2>数据更新说明</h2>
          <p>
            行情、年度/月度回报、回撤、波动率、北向资金与 IPO 节奏由 pipeline
            自动更新，通常随交易日数据刷新；指数规则、调入调出、部分估值与
            A/H 溢价为静态或定期维护数据，按公开公告和上游数据节奏校验更新。
          </p>
        </div>

        <div className="site-footer__bottom">
          <p>© 2025-2026 中国股市编年史</p>
          <p>许可声明：CC-BY-4.0；本站内容仅供研究使用。</p>
          <p>本站数据仅供研究参考，不构成任何投资建议。</p>
        </div>
      </div>
    </footer>
  );
}
