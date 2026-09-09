import { db } from "@/lib/db";
import { ok, handle } from "@/lib/api-helpers";

// GET /api/testimonials — Témoignages publiés (public)
export async function GET() {
  return handle(async () => {
    const items = await db.testimonial.findMany({
      where: { published: true },
      orderBy: { sortOrder: "asc" },
    });
    return ok(items);
  });
}
