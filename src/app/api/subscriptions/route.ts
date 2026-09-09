import { db } from "@/lib/db";
import { ok, fail, handle, getClientIp, logAction, assertSameOrigin } from "@/lib/api-helpers";
import { requireUser } from "@/lib/auth";
import { createSubscriptionSchema } from "@/lib/validations";
import { generateReference } from "@/lib/auth";

// GET /api/subscriptions — Abonnements de l'utilisateur connecté
export async function GET(req: Request) {
  return handle(async () => {
    const user = await requireUser(req);
    const subs = await db.subscription.findMany({
      where: { userId: user.id },
      include: { plan: true, payments: true, licenseKeys: true },
      orderBy: { createdAt: "desc" },
    });
    return ok(subs);
  });
}

// POST /api/subscriptions — Demande d'abonnement (choix formule → paiement)
export async function POST(req: Request) {
  return handle(async () => {
    assertSameOrigin(req);
    const user = await requireUser(req);
    const ip = getClientIp(req);
    const data = createSubscriptionSchema.parse(await req.json());

    if (data.billingCycle !== "annual") {
      return fail("L'abonnement est disponible uniquement pour 12 mois au prix de 15 000 FCFA.", 400);
    }

    const plan = await db.subscriptionPlan.findUnique({ where: { slug: data.planSlug } });
    if (!plan || !plan.active) return fail("Formule introuvable.", 404);

    // Une seule demande d'abonnement en attente à la fois
    const pending = await db.subscription.findFirst({
      where: { userId: user.id, status: { in: ["PENDING", "AWAITING_PAYMENT"] } },
    });
    if (pending) {
      return fail(
        "Vous avez déjà une demande d'abonnement en cours. Finalisez son paiement ou annulez-la depuis « Mon abonnement ».",
        409
      );
    }

    const amount = plan.annualPrice;
    if (amount <= 0) return fail("Cette formule n'est pas disponible actuellement.", 400);

    const sub = await db.subscription.create({
      data: {
        reference: generateReference("SUB"),
        userId: user.id,
        planId: plan.id,
        billingCycle: data.billingCycle,
        status: "AWAITING_PAYMENT",
      },
    });

    const payment = await db.payment.create({
      data: {
        reference: generateReference("PAY"),
        userId: user.id,
        subscriptionId: sub.id,
        amount,
        method: data.method,
        phoneMsisdn: data.phoneMsisdn || null,
        status: "PENDING",
      },
    });

    await logAction("SUBSCRIPTION_CREATED", user.id, `${plan.name} (${data.billingCycle})`, ip);

    return ok(
      {
        subscription: sub,
        payment,
        plan: { name: plan.name, slug: plan.slug },
        amount,
      },
      201
    );
  });
}
