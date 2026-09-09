import { ok, handle } from "@/lib/api-helpers";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(req: Request) {
  return handle(async () => {
    const user = await requireUser(req);

    // Statut d'abonnement le plus pertinent : ACTIVE > AWAITING_PAYMENT > PENDING > sinon aucun
    const subscriptions = await db.subscription.findMany({
      where: { userId: user.id },
      include: { plan: true },
      orderBy: { createdAt: "desc" },
    });

    // Expire automatiquement les abonnements arrivés à terme
    const now = new Date();
    for (const sub of subscriptions) {
      if (sub.status === "ACTIVE" && sub.endDate && sub.endDate < now) {
        await db.subscription.update({ where: { id: sub.id }, data: { status: "EXPIRED" } });
        sub.status = "EXPIRED";
      }
    }

    const current =
      subscriptions.find((s) => s.status === "ACTIVE") ??
      subscriptions.find((s) => s.status === "AWAITING_PAYMENT") ??
      subscriptions.find((s) => s.status === "PENDING") ??
      null;

    let daysRemaining = 0;
    if (current?.status === "ACTIVE" && current.endDate) {
      daysRemaining = Math.max(
        0,
        Math.ceil((current.endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      );
    }

    const licenseKey = current?.status === "ACTIVE"
      ? await db.licenseKey.findFirst({ where: { userId: user.id, subscriptionId: current.id } })
      : null;

    return ok({
      user,
      subscription: current
        ? {
            id: current.id,
            reference: current.reference,
            status: current.status,
            billingCycle: current.billingCycle,
            startDate: current.startDate,
            endDate: current.endDate,
            daysRemaining,
            plan: { name: current.plan.name, slug: current.plan.slug },
          }
        : null,
      licenseKey: licenseKey ? { key: licenseKey.key, status: licenseKey.status } : null,
    });
  });
}
