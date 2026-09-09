import { db } from "@/lib/db";
import { ok, handle } from "@/lib/api-helpers";

// GET /api/plans — Formules d'abonnement actives (public)
export async function GET() {
  return handle(async () => {
    const plans = await db.subscriptionPlan.findMany({
      where: { active: true },
      orderBy: { sortOrder: "asc" },
    });
    return ok(plans.map((p) => ({ ...p, features: JSON.parse(p.features) })));
  });
}
