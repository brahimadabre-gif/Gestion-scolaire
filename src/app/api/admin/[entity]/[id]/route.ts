import { z } from "zod";
import { db } from "@/lib/db";
import { ok, fail, handle, getClientIp, logAction, assertSameOrigin } from "@/lib/api-helpers";
import { requireAdmin, generateLicenseKey } from "@/lib/auth";
import { confirmPaymentAndActivate } from "@/lib/billing";

// ── Mise à jour d'un enregistrement d'administration ─────────
// PATCH /api/admin/[entity]/[id]  —  liste blanche stricte d'entités

const ticketPatchSchema = z.object({
  status: z.enum(["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"]).optional(),
  priority: z.enum(["LOW", "NORMAL", "HIGH"]).optional(),
  response: z.string().max(5000).optional(),
});

const subPatchSchema = z.object({
  status: z.enum(["PENDING", "AWAITING_PAYMENT", "ACTIVE", "EXPIRED", "CANCELLED"]),
});

const paymentPatchSchema = z.object({
  status: z.enum(["PENDING", "COMPLETED", "FAILED"]),
  activationCode: z.string().trim().max(80).optional(),
});

const ALLOWED_FIELDS: Record<string, string[]> = {
  plans: ["slug", "name", "description", "monthlyPrice", "annualPrice", "maxUsers", "maxSchools", "maxStudents", "features", "highlighted", "active", "sortOrder"],
  articles: ["slug", "title", "excerpt", "content", "category", "coverEmoji", "published", "publishedAt"],
  faqs: ["question", "answer", "category", "sortOrder", "published"],
  testimonials: ["name", "role", "establishment", "content", "rating", "initials", "color", "published", "sortOrder"],
  versions: ["version", "channel", "releaseDate", "fileSizeMb", "minOs", "installerName", "downloadUrl", "changelog", "active"],
  docs: ["number", "slug", "title", "content", "icon"],
};

export async function PATCH(req: Request, { params }: { params: Promise<{ entity: string; id: string }> }) {
  return handle(async () => {
    assertSameOrigin(req);
    const admin = await requireAdmin(req);
    const ip = getClientIp(req);
    const { entity, id } = await params;
    const body = ((await req.json().catch(() => ({}))) ?? {}) as Record<string, unknown>;
    let updated: unknown;

    try {
      switch (entity) {
        // ── Tickets : statut, priorité, réponse du support ──────
        case "tickets": {
          const data = ticketPatchSchema.parse(body);
          updated = await db.supportTicket.update({ where: { id }, data });
          break;
        }
        // ── Abonnements : changement de statut manuel ───────────
        case "subscriptions": {
          const { status } = subPatchSchema.parse(body);
          if (status !== "ACTIVE") {
            updated = await db.subscription.update({ where: { id }, data: { status } });
            break;
          }
          const sub = await db.subscription.findUnique({ where: { id }, include: { plan: true } });
          if (!sub) return fail("Abonnement introuvable.", 404);
          const now = new Date();
          const days = sub.billingCycle === "monthly" ? 30 : 365;
          const endDate = sub.endDate && sub.endDate > now
            ? sub.endDate
            : new Date(now.getTime() + days * 86_400_000);
          updated = await db.subscription.update({
            where: { id },
            data: { status: "ACTIVE", startDate: sub.startDate ?? now, endDate },
          });
          const license = await db.licenseKey.findFirst({ where: { subscriptionId: id } });
          if (!license) {
            await db.licenseKey.create({
              data: {
                key: generateLicenseKey(),
                userId: sub.userId,
                subscriptionId: sub.id,
                status: "INACTIVE",
                maxDevices: sub.plan.maxUsers,
              },
            });
          }
          break;
        }
        // ── Paiements : confirmation = activation complète ──────
        case "payments": {
          const { status, activationCode } = paymentPatchSchema.parse(body);
          if (status === "COMPLETED") {
            const result = await confirmPaymentAndActivate(id, null, activationCode || null);
            updated = result.payment;
          } else {
            updated = await db.payment.update({ where: { id }, data: { status } });
          }
          break;
        }
        // ── Entités éditoriales : champs autorisés uniquement ───
        case "plans":
        case "articles":
        case "faqs":
        case "testimonials":
        case "versions":
        case "docs": {
          const allowed = ALLOWED_FIELDS[entity];
          const data: Record<string, unknown> = {};
          for (const key of allowed) {
            if (key in body) data[key] = body[key];
          }
          if (entity === "plans" && Array.isArray(data.features)) {
            data.features = JSON.stringify(data.features);
          }
          if (Object.keys(data).length === 0) return fail("Aucune modification valide fournie.", 400);
          const delegate = {
            plans: db.subscriptionPlan,
            articles: db.article,
            faqs: db.faqItem,
            testimonials: db.testimonial,
            versions: db.softwareVersion,
            docs: db.docSection,
          }[entity];
          updated = await delegate.update({ where: { id }, data });
          if (entity === "plans") {
            updated = { ...(updated as { features: string }), features: JSON.parse((updated as { features: string }).features || "[]") };
          }
          break;
        }
        default:
          return fail("Entité inconnue.", 404);
      }

      await logAction("ADMIN_UPDATE", admin.id, `${entity}/${id}`, ip);
      return ok(updated);
    } catch (e) {
      if (e instanceof z.ZodError) {
        const first = e.issues[0];
        return fail(first ? `${first.path.join(".")}: ${first.message}` : "Données invalides", 422);
      }
      if (typeof e === "object" && e !== null && "code" in e && (e as { code: string }).code === "P2002") {
        return fail("Un enregistrement avec cet identifiant existe déjà.", 409);
      }
      const msg = e instanceof Error ? e.message : "";
      if (msg.includes("introuvable")) return fail(msg, 404);
      if (msg.includes("déjà confirmé")) return fail(msg, 409);
      throw e;
    }
  });
}

export async function DELETE(req: Request, { params }: { params: Promise<{ entity: string; id: string }> }) {
  return handle(async () => {
    assertSameOrigin(req);
    const admin = await requireAdmin(req);
    const ip = getClientIp(req);
    const { entity, id } = await params;

    const DELETABLE: Record<string, () => Promise<unknown>> = {
      articles: () => db.article.delete({ where: { id } }),
      faqs: () => db.faqItem.delete({ where: { id } }),
      testimonials: () => db.testimonial.delete({ where: { id } }),
      docs: () => db.docSection.delete({ where: { id } }),
      versions: () => db.softwareVersion.delete({ where: { id } }),
      plans: () => db.subscriptionPlan.delete({ where: { id } }),
      tickets: () => db.supportTicket.delete({ where: { id } }),
    };
    const del = DELETABLE[entity];
    if (!del) return fail("Suppression non permise pour cette entité.", 400);

    await del();
    await logAction("ADMIN_DELETE", admin.id, `${entity}/${id}`, ip);
    return ok({ deleted: true });
  });
}
