import { PANELS, SECTIONS, getPanelsBySection } from "@/lib/panelRegistry";
import { SITE_DESCRIPTION, SITE_NAME } from "@/lib/seo";
import {
  getAbsoluteUrl,
  getPanelPageDescription,
  getPanelPath,
  getUpdateFrequencyLabel,
} from "@/lib/panelSeo";

export const dynamic = "force-static";

export function GET() {
  const lines = [
    `# ${SITE_NAME}`,
    "",
    SITE_DESCRIPTION,
    "",
    `Total panels: ${PANELS.length}`,
    "",
    ...SECTIONS.flatMap((section) => [
      `## ${section.title} / ${section.titleEn}`,
      "",
      ...getPanelsBySection(section.id).flatMap((panel) => [
        `### ${panel.title}`,
        "",
        `URL: ${getAbsoluteUrl(getPanelPath(panel))}`,
        `Title: ${panel.title} / ${panel.titleEn}`,
        `Description: ${getPanelPageDescription(panel)}`,
        `API endpoint: ${panel.apiEndpoint}`,
        `Data file: ${panel.dataFile}`,
        `Update frequency: ${getUpdateFrequencyLabel(panel.updateFrequency)}`,
        `Data sources: ${panel.dataSources.join(", ")}`,
        "FAQ:",
        ...panel.faq.map((item) => `- Q: ${item.question}\n  A: ${item.answer}`),
        "",
      ]),
    ]),
  ];

  return new Response(lines.join("\n"), {
    headers: {
      "content-type": "text/plain; charset=utf-8",
    },
  });
}
