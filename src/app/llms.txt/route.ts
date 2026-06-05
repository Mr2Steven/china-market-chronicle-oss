import { PANELS, SECTIONS, getPanelsBySection } from "@/lib/panelRegistry";
import { SITE_DESCRIPTION, SITE_NAME } from "@/lib/seo";
import { getAbsoluteUrl, getPanelPath } from "@/lib/panelSeo";

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
      ...getPanelsBySection(section.id).map(
        (panel) => `- [${panel.title}](${getAbsoluteUrl(getPanelPath(panel))}): ${panel.titleEn}`,
      ),
      "",
    ]),
  ];

  return new Response(lines.join("\n"), {
    headers: {
      "content-type": "text/plain; charset=utf-8",
    },
  });
}
