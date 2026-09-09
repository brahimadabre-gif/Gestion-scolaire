import { db } from "@/lib/db";
import { ok, handle } from "@/lib/api-helpers";

// GET /api/faqs — Questions fréquentes publiées (public)
export async function GET(req: Request) {
  return handle(async () => {
    const { searchParams } = new URL(req.url);
    const limit = searchParams.get("limit");
    const faqs = await db.faqItem.findMany({
      where: { published: true },
      orderBy: { sortOrder: "asc" },
      ...(limit ? { take: Math.min(parseInt(limit) || 10, 50) } : {}),
    });
    return ok(faqs);
  });
}
