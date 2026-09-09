// ─────────────────────────────────────────────────────────────
// Logique de facturation mutualisée — confirmation de paiement,
// activation d'abonnement, génération de facture et de licence.
// Utilisée par la confirmation utilisateur ET l'administration.
// ─────────────────────────────────────────────────────────────
import { db } from "@/lib/db";
import { generateLicenseKey } from "@/lib/auth";

export async function nextInvoiceNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const count = await db.payment.count({ where: { invoiceNumber: { not: null } } });
  return `FA-${year}-${String(count + 1).padStart(4, "0")}`;
}

/**
 * Confirme un paiement, active l'abonnement associé, génère la facture
 * et la clé de licence. Idempotent : lève si déjà confirmé.
 */
export async function confirmPaymentAndActivate(
  paymentId: string,
  providerRef?: string | null,
  activationCode?: string | null
) {
  const payment = await db.payment.findUnique({
    where: { id: paymentId },
    include: { subscription: { include: { plan: true } } },
  });
  if (!payment) throw new Error("Paiement introuvable.");
  if (payment.status === "COMPLETED") throw new Error("Ce paiement est déjà confirmé.");
  if (payment.status !== "PENDING") throw new Error("Ce paiement ne peut plus être confirmé.");

  const requestedKey = activationCode?.trim().toUpperCase() || null;
  if (requestedKey && !/^[A-Z0-9][A-Z0-9_-]{7,79}$/.test(requestedKey)) {
    throw new Error("Le code d'activation doit contenir 8 à 80 caractères (lettres, chiffres, tirets ou underscores).");
  }
  const existingLicense = await db.licenseKey.findFirst({
    where: { subscriptionId: payment.subscriptionId },
  });
  if (existingLicense && requestedKey && existingLicense.key !== requestedKey) {
    throw new Error("Un autre code d'activation est déjà associé à cet abonnement.");
  }

  const invoiceNumber = await nextInvoiceNumber();
  const now = new Date();
  const sub = payment.subscription;
  const days = sub.billingCycle === "monthly" ? 30 : 365;

  // Renouvellement : la durée s'ajoute à la fin actuelle si encore actif
  const base =
    sub.status === "ACTIVE" && sub.endDate && sub.endDate > now ? sub.endDate : now;
  const endDate = new Date(base.getTime() + days * 24 * 60 * 60 * 1000);

  const [, updatedSub] = await db.$transaction([
    db.payment.update({
      where: { id: payment.id },
      data: {
        status: "COMPLETED",
        invoiceNumber,
        providerRef: providerRef || `ADM-${Date.now().toString(36).toUpperCase()}`,
      },
    }),
    db.subscription.update({
      where: { id: sub.id },
      data: { status: "ACTIVE", startDate: sub.startDate ?? now, endDate },
    }),
  ]);

  // Licence : générée à la première activation de l'abonnement
  const license =
    existingLicense ??
    (await db.licenseKey.create({
      data: {
        key: requestedKey ?? generateLicenseKey(),
        userId: payment.userId,
        subscriptionId: sub.id,
        status: "INACTIVE", // ACTIVE après activation par le logiciel
        maxDevices: sub.plan.maxUsers,
      },
    }));

  return { payment: { ...payment, status: "COMPLETED", invoiceNumber }, subscription: updatedSub, license };
}
