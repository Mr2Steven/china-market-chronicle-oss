import type { Metadata } from "next";
import {
  PANELS,
  SECTIONS,
  getPanelById,
  getPanelsBySection,
  type PanelDef,
  type SectionDef,
} from "@/lib/panelRegistry";
import { getUpdateFrequencyLabel } from "@/lib/dataTrust";
import { getHomeAnchorByPanelId } from "@/lib/homePanels";
import { SITE_NAME, SITE_URL } from "@/lib/seo";

export const SEO_DATE = "2026-05-16";

export function getPanelSlug(panel: PanelDef): string {
  return panel.slug.split("/").filter(Boolean).at(-1) ?? panel.id;
}

export function getSectionBySlug(slug: string): SectionDef | undefined {
  return SECTIONS.find((section) => section.slug === slug);
}

export function getSectionById(id: PanelDef["section"]): SectionDef {
  const section = SECTIONS.find((item) => item.id === id);
  if (!section) {
    throw new Error(`Unknown panel section: ${id}`);
  }
  return section;
}

export function getPanelByRoute(sectionSlug: string, panelSlug: string): PanelDef | undefined {
  const section = getSectionBySlug(sectionSlug);
  if (!section) return undefined;

  return getPanelsBySection(section.id).find((panel) => getPanelSlug(panel) === panelSlug);
}

export function getPanelParams() {
  return PANELS.map((panel) => ({
    section: getSectionById(panel.section).slug,
    panel: getPanelSlug(panel),
  }));
}

export function getPanelPath(panel: PanelDef): string {
  return `/zh-cn${panel.slug}/`;
}

export function getSectionPath(section: SectionDef): string {
  return `/zh-cn/${section.slug}/`;
}

export function getAbsoluteUrl(path: string): string {
  return new URL(path, SITE_URL).toString();
}

export function getPanelOgPath(panel: PanelDef): string {
  return `${getPanelPath(panel)}opengraph-image`;
}

export function getHomeAnchor(panel: PanelDef): string {
  return `/#${getHomeAnchorByPanelId(panel.id) ?? `panel-${panel.id}`}`;
}

export { getUpdateFrequencyLabel };

export function getPanelPageDescription(panel: PanelDef): string {
  const sources = panel.dataSources.join("、");
  const faqText = panel.faq
    .slice(0, 2)
    .map((item) => `${item.question}${item.answer}`)
    .join("");

  return [
    panel.description,
    `本页围绕「${panel.title}」整理为可索引的文字版本，保留图表背后的统计口径、数据来源和常见问题，方便搜索引擎与 AI 检索系统理解这张面板的研究对象。`,
    `数据来源包括 ${sources}，更新频率为${getUpdateFrequencyLabel(panel.updateFrequency)}，处理口径为：${panel.dataProcessing}。交互式图表仍保留在首页对应锚点，可用于查看完整走势、悬浮提示和细节数值。`,
    faqText ? `常见问题重点覆盖：${faqText}` : "",
  ]
    .filter(Boolean)
    .join("");
}

export function getPanelMetadata(panel: PanelDef): Metadata {
  const path = getPanelPath(panel);
  const url = getAbsoluteUrl(path);
  const title = `${panel.title} | ${panel.titleEn}`;
  const description = panel.description;
  const imageUrl = getAbsoluteUrl(getPanelOgPath(panel));

  return {
    title,
    description,
    keywords: panel.keywords,
    alternates: {
      canonical: path,
    },
    openGraph: {
      type: "article",
      locale: "zh_CN",
      siteName: SITE_NAME,
      url,
      title,
      description,
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: `${panel.title} — ${SITE_NAME}`,
        },
      ],
      publishedTime: SEO_DATE,
      modifiedTime: SEO_DATE,
      authors: ["China Market Chronicle"],
      section: getSectionById(panel.section).title,
      tags: panel.keywords,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [imageUrl],
    },
  };
}

export function getArticleJsonLd(panel: PanelDef) {
  const path = getPanelPath(panel);
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: panel.title,
    name: panel.title,
    alternateName: panel.titleEn,
    description: panel.description,
    author: {
      "@type": "Organization",
      name: "China Market Chronicle",
    },
    publisher: {
      "@type": "Organization",
      name: "China Market Chronicle",
    },
    datePublished: SEO_DATE,
    dateModified: SEO_DATE,
    mainEntityOfPage: getAbsoluteUrl(path),
    image: getAbsoluteUrl(getPanelOgPath(panel)),
    keywords: panel.keywords.join(", "),
    articleSection: getSectionById(panel.section).title,
  };
}

export function getDatasetJsonLd(panel: PanelDef) {
  return {
    "@context": "https://schema.org",
    "@type": "Dataset",
    name: panel.title,
    alternateName: panel.titleEn,
    description: panel.description,
    keywords: panel.keywords,
    creator: {
      "@type": "Organization",
      name: "China Market Chronicle",
    },
    temporalCoverage: "2005/..",
    spatialCoverage: "China",
    license: "https://creativecommons.org/licenses/by/4.0/",
    url: getAbsoluteUrl(getPanelPath(panel)),
    includedInDataCatalog: {
      "@type": "DataCatalog",
      name: SITE_NAME,
      url: SITE_URL,
    },
  };
}

export function getFaqJsonLd(panel: PanelDef) {
  if (panel.faq.length === 0) return null;

  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: panel.faq.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };
}

export function getRelatedPanelLinks(panel: PanelDef): PanelDef[] {
  return panel.relatedPanels
    .map((id) => getPanelById(id))
    .filter((item): item is PanelDef => Boolean(item));
}
