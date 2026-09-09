import { db } from "@/lib/db";
import { ok, fail, handle, assertSameOrigin } from "@/lib/api-helpers";
import { requireUser } from "@/lib/auth";

// GET /api/payments — Historique des paiements + factures de l'utilisateur
export async function GET(req: Request) {
  return handle(async () => {
    const user = await requireUser(req);
    const payments = await db.payment.findMany({
      where: { userId: user.id },
      include: {
        subscription: { include: { plan: { select: { name: true, slug: true } } } },
      },
      orderBy: { createdAt: "desc" },
    });
    return ok(payments);
  });
}

// POST /api/payments — réservé au flux historique ; l'activation est désormais
// effectuée uniquement par l'administrateur après vérification du dépôt.
export async function POST(req: Request) {
  return handle(async () => {
    assertSameOrigin(req);
    await requireUser(req);
    return fail("Votre paiement sera activé par l'administrateur après vérification du dépôt.", 403);
  });
}
