import { db } from "@/lib/db";
import { ok, fail, handle } from "@/lib/api-helpers";

// GET /api/articles/[slug] — Article complet (public)
export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  return handle(async () => {
    const { slug } = await params;
    const article = await db.article.findFirst({
      where: { slug, published: true },
    });
    if (!article) return fail("Article introuvable", 404);
    return ok(article);
  });
}
