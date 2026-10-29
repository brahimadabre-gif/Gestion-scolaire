import type { MetadataRoute } from "next";
import { SITE } from "@/lib/site";
import { ROUTE_META } from "@/lib/routes";

// Sitemap : une vraie adresse par page publique (les pages privées en sont exclues).
export default function sitemap(): MetadataRoute.Sitemap {
  const base = SITE.url;
  const now = new Date();
  return [
    { url: base, lastModified: now, changeFrequency: "weekly", priority: 1 },
    ...Object.entries(ROUTE_META)
      .filter(([, meta]) => meta.index)
      .map(([path, meta]) => ({
        url: `${base}${path}`,
        lastModified: now,
        changeFrequency: meta.changeFrequency ?? "monthly",
        priority: meta.priority ?? 0.5,
      })),
  ];
}
