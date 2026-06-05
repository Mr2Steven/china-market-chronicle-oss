import type { MetadataRoute } from "next";
import { PANELS, SECTIONS } from "@/lib/panelRegistry";
import {
  getAbsoluteUrl,
  getPanelPath,
  getSectionPath,
} from "@/lib/panelSeo";

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  return [
    {
      url: getAbsoluteUrl("/"),
      lastModified,
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: getAbsoluteUrl("/zh-cn/"),
      lastModified,
      changeFrequency: "daily",
      priority: 0.9,
    },
    ...SECTIONS.map((section) => ({
      url: getAbsoluteUrl(getSectionPath(section)),
      lastModified,
      changeFrequency: "daily" as const,
      priority: 0.8,
    })),
    ...PANELS.map((panel) => ({
      url: getAbsoluteUrl(getPanelPath(panel)),
      lastModified,
      changeFrequency: panel.updateFrequency === "static" ? ("yearly" as const) : ("daily" as const),
      priority: 0.8,
    })),
  ];
}
