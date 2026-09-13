import { db } from "@/lib/db";
import { ok, fail, handle } from "@/lib/api-helpers";
import { requireUser } from "@/lib/auth";

// GET /api/ambassador/referrals — recommandations de l'ambassadeur connecté
export async function GET(req: Request) {
  return handle(async () => {
    const user = await requireUser(req);
    if (user.role !== "AMBASSADOR") return fail("Accès réservé aux ambassadeurs.", 403);

    const ambassador = await db.ambassador.findUnique({
      where: { userId: user.id },
      include: {
        referrals: {
          orderBy: { createdAt: "desc" },
          include: {
            client: { select: { firstName: true, lastName: true, email: true } },
            subscription: { select: { reference: true, status: true, createdAt: true } },
          },
        },
        bonuses: { select: { amount: true } },
      },
    });

    if (!ambassador) return fail("Profil ambassadeur introuvable.", 404);

    const referrals = ambassador.referrals.map((referral) => ({
      id: referral.id,
      client: referral.client,
      codeSubmitted: referral.codeSubmitted,
      status: referral.status,
      commissionAmount: referral.commissionAmount,
      commissionStatus: referral.commissionStatus,
      confirmedAt: referral.confirmedAt,
      createdAt: referral.createdAt,
      subscription: referral.subscription,
    }));

    return ok({
      code: ambassador.code,
      commissionAmount: ambassador.commissionAmount,
      referrals,
      totalReferred: referrals.length,
      totalConfirmed: referrals.filter((referral) => referral.status === "CONFIRMED").length,
      totalPending: referrals.filter((referral) => referral.status !== "CONFIRMED").length,
      totalCommissions: referrals
        .filter((referral) => referral.commissionStatus === "VALIDATED" || referral.commissionStatus === "PAID")
        .reduce((total, referral) => total + referral.commissionAmount, 0),
      totalBonuses: ambassador.bonuses.reduce((total, bonus) => total + bonus.amount, 0),
    });
  });
}
