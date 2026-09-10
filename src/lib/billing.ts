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
  const requestedKey = activationCode?.trim().toUpperCase() || null;
  if (requestedKey && !/^[A-Z0-9][A-Z0-9_-]{7,79}$/.test(requestedKey)) {
    throw new Error("Le code d'activation doit contenir 8 à 80 caractères (lettres, chiffres, tirets ou underscores).");
  }

  // Une transaction interactive garantit qu'un double clic admin ou deux
  // requêtes simultanées ne créent pas deux factures/licences pour le même paiement.
  return db.$transaction(async (tx) => {
    const payment = await tx.payment.findUnique({
      where: { id: paymentId },
      include: { subscription: { include: { plan: true } } },
    });
    if (!payment) throw new Error("Paiement introuvable.");
    if (payment.status === "COMPLETED") throw new Error("Ce paiement est déjà confirmé.");
    if (payment.status !== "PENDING") throw new Error("Ce paiement ne peut plus être confirmé.");

    const existingLicense = await tx.licenseKey.findFirst({
      where: { subscriptionId: payment.subscriptionId },
    });
    if (existingLicense && requestedKey && existingLicense.key !== requestedKey) {
      throw new Error("Un autre code d'activation est déjà associé à cet abonnement.");
    }

    const invoiceCount = await tx.payment.count({ where: { invoiceNumber: { not: null } } });
    const invoiceNumber = `FA-${new Date().getFullYear()}-${String(invoiceCount + 1).padStart(4, "0")}`;
    const now = new Date();
    const sub = payment.subscription;
    const days = sub.billingCycle === "monthly" ? 30 : 365;
    const base = sub.status === "ACTIVE" && sub.endDate && sub.endDate > now ? sub.endDate : now;
    const endDate = new Date(base.getTime() + days * 24 * 60 * 60 * 1000);

    const updatedPayment = await tx.payment.update({
      where: { id: payment.id },
      data: {
        status: "COMPLETED",
        invoiceNumber,
        providerRef: providerRef || `ADM-${Date.now().toString(36).toUpperCase()}`,
      },
    });
    const updatedSub = await tx.subscription.update({
      where: { id: sub.id },
      data: { status: "ACTIVE", startDate: sub.startDate ?? now, endDate },
    });

    const license = existingLicense ?? await tx.licenseKey.create({
      data: {
        key: requestedKey ?? generateLicenseKey(),
        userId: payment.userId,
        subscriptionId: sub.id,
        status: "INACTIVE",
        maxDevices: 1,
      },
    });

    return { payment: updatedPayment, subscription: updatedSub, license };
  });
}
