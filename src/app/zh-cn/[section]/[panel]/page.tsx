import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import DataTrustBlock from "@/components/layout/DataTrustBlock";
import {
  getArticleJsonLd,
  getDatasetJsonLd,
  getFaqJsonLd,
  getHomeAnchor,
  getPanelByRoute,
  getPanelMetadata,
  getPanelPageDescription,
  getPanelParams,
  getPanelPath,
  getRelatedPanelLinks,
  getSectionById,
} from "@/lib/panelSeo";

type PanelPageProps = {
  params: Promise<{
    section: string;
    panel: string;
  }>;
};

export const dynamicParams = false;

export function generateStaticParams() {
  return getPanelParams();
}

export async function generateMetadata({ params }: PanelPageProps): Promise<Metadata> {
  const { section, panel: panelSlug } = await params;
  const panel = getPanelByRoute(section, panelSlug);
  if (!panel) return {};

  return getPanelMetadata(panel);
}

export default async function PanelPage({ params }: PanelPageProps) {
  const { section, panel: panelSlug } = await params;
  const panel = getPanelByRoute(section, panelSlug);
  if (!panel) notFound();

  const sectionDef = getSectionById(panel.section);
  const articleJsonLd = getArticleJsonLd(panel);
  const datasetJsonLd = getDatasetJsonLd(panel);
  const faqJsonLd = getFaqJsonLd(panel);
  const relatedPanels = getRelatedPanelLinks(panel);

  return (
    <article className="seo-page">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd).replace(/</g, "\\u003c") }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(datasetJsonLd).replace(/</g, "\\u003c") }}
      />
      {faqJsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd).replace(/</g, "\\u003c") }}
        />
      )}

      <nav className="seo-page__breadcrumbs" aria-label="面包屑导航">
        <Link href="/">首页</Link>
        <span>/</span>
        <Link href={`/zh-cn/${sectionDef.slug}/`}>{sectionDef.title}</Link>
      </nav>

      <header className="seo-page__header">
        <p className="seo-page__eyebrow">
          § {sectionDef.index} {sectionDef.title} · {sectionDef.titleEn}
        </p>
        <h1>{panel.title}</h1>
        <p className="seo-page__subtitle">{panel.titleEn}</p>
      </header>

      <section className="seo-page__section" aria-labelledby="summary-heading">
        <h2 id="summary-heading">面板说明</h2>
        <p>{getPanelPageDescription(panel)}</p>
      </section>

      <DataTrustBlock panel={panel} variant="seo" />

      {panel.faq.length > 0 && (
        <section className="seo-page__section" aria-labelledby="faq-heading">
          <h2 id="faq-heading">常见问题</h2>
          <div className="seo-page__faq">
            {panel.faq.map((item) => (
              <details key={item.question} open>
                <summary>{item.question}</summary>
                <p>{item.answer}</p>
              </details>
            ))}
          </div>
        </section>
      )}

      <section className="seo-page__section" aria-labelledby="interactive-heading">
        <h2 id="interactive-heading">查看交互图表</h2>
        <p>
          本页是搜索索引用的文字版。需要查看交互式图表、悬浮提示和完整时间序列，请回到首页对应面板。
        </p>
        <Link className="seo-page__button" href={getHomeAnchor(panel)}>
          查看交互图表
        </Link>
      </section>

      {relatedPanels.length > 0 && (
        <section className="seo-page__section" aria-labelledby="related-heading">
          <h2 id="related-heading">相关面板</h2>
          <ul className="seo-page__links">
            {relatedPanels.map((related) => (
              <li key={related.id}>
                <Link href={getPanelPath(related)}>
                  {related.title}
                  <span>{related.titleEn}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </article>
  );
}
