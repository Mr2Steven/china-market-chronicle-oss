import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { SITE_NAME } from "@/lib/seo";
import { getPanelsBySection, SECTIONS } from "@/lib/panelRegistry";
import {
  getAbsoluteUrl,
  getPanelPath,
  getSectionBySlug,
  getSectionPath,
} from "@/lib/panelSeo";

type SectionPageProps = {
  params: Promise<{
    section: string;
  }>;
};

export const dynamicParams = false;

export function generateStaticParams() {
  return SECTIONS.map((section) => ({ section: section.slug }));
}

export async function generateMetadata({ params }: SectionPageProps): Promise<Metadata> {
  const { section: sectionSlug } = await params;
  const section = getSectionBySlug(sectionSlug);
  if (!section) return {};

  const description = `${section.title}：${section.titleEn}。收录中国股市编年史该章节下的所有可索引数据面板。`;
  const path = getSectionPath(section);

  return {
    title: `${section.title} | ${section.titleEn}`,
    description,
    alternates: {
      canonical: path,
    },
    openGraph: {
      type: "website",
      locale: "zh_CN",
      siteName: SITE_NAME,
      url: getAbsoluteUrl(path),
      title: `${section.title} | ${section.titleEn}`,
      description,
    },
    twitter: {
      card: "summary_large_image",
      title: `${section.title} | ${section.titleEn}`,
      description,
    },
  };
}

export default async function SectionPage({ params }: SectionPageProps) {
  const { section: sectionSlug } = await params;
  const section = getSectionBySlug(sectionSlug);
  if (!section) notFound();

  const panels = getPanelsBySection(section.id);

  return (
    <article className="seo-page">
      <nav className="seo-page__breadcrumbs" aria-label="面包屑导航">
        <Link href="/">首页</Link>
      </nav>

      <header className="seo-page__header">
        <p className="seo-page__eyebrow">§ {section.index}</p>
        <h1>{section.title}</h1>
        <p className="seo-page__subtitle">{section.titleEn}</p>
      </header>

      <section className="seo-page__section">
        <p>
          本章节收录 {panels.length} 个独立 SEO 页面。每个页面都从 Panel Registry 自动生成，
          包含面板说明、数据来源、FAQ、结构化数据和返回首页交互图表的链接。
        </p>
      </section>

      <section className="seo-page__section" aria-labelledby="panel-list-heading">
        <h2 id="panel-list-heading">面板列表</h2>
        <ul className="seo-page__links">
          {panels.map((panel) => (
            <li key={panel.id}>
              <Link href={getPanelPath(panel)}>
                {panel.title}
                <span>{panel.description}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </article>
  );
}
