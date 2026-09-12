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
  status: z.enum(["PENDING", "AWAITING_PAYMENT", "ACTIVE", "EXPIRED", "CANCELLED"]).optional(),
  extendDays: z.number().int().min(1).max(3650).optional(),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date de fin invalide").optional(),
  decisionNote: z.string().trim().max(500).optional(),
}).refine((value) => value.status || value.extendDays || value.endDate, "Aucune décision fournie.");

const paymentPatchSchema = z.object({
  status: z.enum(["PENDING", "COMPLETED", "FAILED"]),
  activationCode: z.string().trim().max(80).optional(),
});

const libraryPatchSchema = z.object({
  title: z.string().trim().min(2).max(200).optional(),
  description: z.string().trim().max(1000).optional(),
  author: z.string().trim().max(160).optional(),
  category: z.string().trim().min(2).max(80).optional(),
  level: z.string().trim().max(80).optional(),
  fileType: z.string().trim().max(20).optional(),
  fileSizeMb: z.coerce.number().min(0).max(100000).optional(),
  coverUrl: z.string().trim().max(500).refine((value) => value === "" || URL.canParse(value), "URL de couverture invalide").optional(),
  downloadUrl: z.string().trim().min(1).max(500).refine((value) => {
    try { const url = new URL(value); return ["http:", "https:"].includes(url.protocol); } catch { return false; }
  }, "URL de téléchargement invalide").optional(),
  featured: z.coerce.boolean().optional(),
  published: z.coerce.boolean().optional(),
  sortOrder: z.coerce.number().int().optional(),
});

const ALLOWED_FIELDS: Record<string, string[]> = {
  plans: ["slug", "name", "description", "monthlyPrice", "annualPrice", "maxUsers", "maxSchools", "maxStudents", "features", "highlighted", "active", "sortOrder"],
  articles: ["slug", "title", "excerpt", "content", "category", "coverEmoji", "published", "publishedAt"],
  faqs: ["question", "answer", "category", "sortOrder", "published"],
  testimonials: ["name", "role", "establishment", "content", "rating", "initials", "color", "published", "sortOrder"],
  versions: ["version", "channel", "releaseDate", "fileSizeMb", "minOs", "installerName", "downloadUrl", "changelog", "active"],
  docs: ["number", "slug", "title", "content", "icon"],
  library: ["title", "description", "author", "category", "level", "fileType", "fileSizeMb", "coverUrl", "downloadUrl", "featured", "published", "sortOrder"],
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
          const sub = await db.subscription.findUnique({ where: { id }, include: { plan: true } });
          if (!sub) return fail("Abonnement introuvable.", 404);
          const { status, extendDays, endDate: requestedEndDate, decisionNote } = subPatchSchema.parse(body);
          const now = new Date();
          const days = sub.billingCycle === "monthly" ? 30 : 365;
          const baseEndDate = sub.endDate && sub.endDate > now
            ? sub.endDate
            : new Date(now.getTime() + days * 86_400_000);
          let endDate = requestedEndDate
            ? new Date(`${requestedEndDate}T23:59:59.999Z`)
            : baseEndDate;
          if (Number.isNaN(endDate.getTime())) return fail("Date de fin invalide.", 422);
          if (extendDays) endDate = new Date(baseEndDate.getTime() + extendDays * 86_400_000);
          const nextStatus = status ?? (sub.status === "EXPIRED" ? "ACTIVE" : sub.status);
          updated = await db.subscription.update({
            where: { id },
            data: {
              status: nextStatus,
              startDate: nextStatus === "ACTIVE" ? (sub.startDate ?? now) : sub.startDate,
              endDate,
            },
          });
          const license = await db.licenseKey.findFirst({ where: { subscriptionId: id } });
          if (nextStatus === "ACTIVE" && !license) {
            await db.licenseKey.create({
              data: {
                key: generateLicenseKey(),
                userId: sub.userId,
                subscriptionId: sub.id,
                status: "INACTIVE",
                maxDevices: 1,
              },
            });
          }
          await logAction(
            "ADMIN_SUBSCRIPTION_DECISION",
            admin.id,
            `${id} → ${nextStatus}; fin=${endDate.toISOString()}; jours=${extendDays ?? 0}; note=${decisionNote ?? ""}`,
            ip,
          );
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
          }[entity] as unknown as { update: (args: { where: { id: string }; data: Record<string, unknown> }) => Promise<unknown> } | undefined;
          if (!delegate) return fail("Entité inconnue.", 404);
          updated = await delegate.update({ where: { id }, data });
          if (entity === "plans") {
            updated = { ...(updated as { features: string }), features: JSON.parse((updated as { features: string }).features || "[]") };
          }
          break;
        }
        case "library": {
          const allowed = ALLOWED_FIELDS[entity];
          const data: Record<string, unknown> = {};
          for (const key of allowed) if (key in body) data[key] = body[key];
          const parsed = libraryPatchSchema.parse(data);
          updated = await db.libraryDocument.update({ where: { id }, data: parsed });
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
      library: () => db.libraryDocument.delete({ where: { id } }),
      versions: () => db.softwareVersion.delete({ where: { id } }),
      plans: () => db.subscriptionPlan.delete({ where: { id } }),
      tickets: () => db.supportTicket.delete({ where: { id } }),
      // Supprimer uniquement l'historique du paiement, sans toucher à l'abonnement ni à la licence.
      payments: () => db.payment.delete({ where: { id } }),
    };
    const del = DELETABLE[entity];
    if (!del) return fail("Suppression non permise pour cette entité.", 400);

    await del();
    await logAction("ADMIN_DELETE", admin.id, `${entity}/${id}`, ip);
    return ok({ deleted: true });
  });
}
