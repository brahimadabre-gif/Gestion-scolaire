import { db } from "@/lib/db";
import { ok, handle } from "@/lib/api-helpers";
import { assurerPlanEssai } from "@/lib/essai-gratuit";

// GET /api/plans — Formules d'abonnement actives (public)
export async function GET() {
  return handle(async () => {
    // L'offre « Essai gratuit — 30 jours » est créée une fois, puis gérée dans l'admin.
    await assurerPlanEssai().catch(() => undefined);
    const plans = await db.subscriptionPlan.findMany({
      where: { active: true },
      orderBy: { sortOrder: "asc" },
    });
    return ok(plans.map((p) => ({ ...p, features: JSON.parse(p.features) })));
  });
}
