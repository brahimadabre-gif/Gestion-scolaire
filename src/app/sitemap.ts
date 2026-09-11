import type { MetadataRoute } from "next";
import { SITE } from "@/lib/site";

// Sitemap — les ancres hash sont conservées pour le routeur client historique.
// L'URL canonique reste la page publique principale.
export default function sitemap(): MetadataRoute.Sitemap {
  const base = SITE.url;
  const now = new Date();
  return [
    { url: base, lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: `${base}/#/fonctionnalites`, lastModified: now, changeFrequency: "monthly", priority: 0.9 },
    { url: `${base}/#/tarifs`, lastModified: now, changeFrequency: "monthly", priority: 0.9 },
    { url: `${base}/#/telecharger`, lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    { url: `${base}/#/notice`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: `${base}/#/bibliotheque`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: `${base}/#/tutoriel-compte`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${base}/#/actualites`, lastModified: now, changeFrequency: "weekly", priority: 0.7 },
    { url: `${base}/#/faq`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: `${base}/#/support`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: `${base}/#/inscription`, lastModified: now, changeFrequency: "yearly", priority: 0.5 },
  ];
}
