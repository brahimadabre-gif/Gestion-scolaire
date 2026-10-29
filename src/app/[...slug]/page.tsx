import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/gspp/app-shell";
import { ROUTE_META, isKnownPath, pathFromSlug } from "@/lib/routes";
import { OG_BASE, OG_IMAGE, SITE } from "@/lib/site";

// Une vraie page par adresse (/tarifs, /telecharger, /legal/mentions…) :
// chacune a son titre, sa description et son adresse canonique pour Google.
// Les adresses inconnues renvoient une vraie erreur 404.
export const dynamicParams = false;

export function generateStaticParams() {
  return Object.keys(ROUTE_META).map((path) => ({ slug: path.slice(1).split("/") }));
}

type Props = { params: Promise<{ slug: string[] }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const path = pathFromSlug(slug);
  if (!isKnownPath(path)) return {};
  const meta = ROUTE_META[path];
  const url = `${SITE.url}${path}`;
  return {
    title: meta.title,
    description: meta.description,
    alternates: { canonical: url },
    openGraph: { ...OG_BASE, url, title: `${meta.title} | ${SITE.name}`, description: meta.description },
    twitter: { card: "summary_large_image", images: [OG_IMAGE.url], title: `${meta.title} | ${SITE.name}`, description: meta.description },
    robots: meta.index ? undefined : { index: false, follow: false },
  };
}

export default async function Page({ params }: Props) {
  const { slug } = await params;
  const path = pathFromSlug(slug);
  if (!isKnownPath(path)) notFound();
  return <AppShell initialPath={path} />;
}
