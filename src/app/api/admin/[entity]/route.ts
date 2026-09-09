import { z } from "zod";
import { db } from "@/lib/db";
import { ok, fail, handle, getClientIp, logAction, assertSameOrigin } from "@/lib/api-helpers";
import { requireAdmin } from "@/lib/auth";

// ── Schémas de validation par entité (administration) ────────
const planSchema = z.object({
  slug: z.string().trim().min(2).max(40).regex(/^[a-z0-9-]+$/, "Slug invalide (minuscules et tirets)"),
  name: z.string().trim().min(2).max(80),
  description: z.string().trim().max(300),
  monthlyPrice: z.coerce.number().min(0),
  annualPrice: z.coerce.number().min(0),
  maxUsers: z.coerce.number().int().min(1),
  maxSchools: z.coerce.number().int().min(1),
  maxStudents: z.coerce.number().int().min(1),
  features: z.array(z.string()).default([]),
  highlighted: z.coerce.boolean().default(false),
  active: z.coerce.boolean().default(true),
  sortOrder: z.coerce.number().int().default(0),
});

const articleSchema = z.object({
  slug: z.string().trim().min(2).max(120).regex(/^[a-z0-9-]+$/, "Slug invalide (minuscules et tirets)"),
  title: z.string().trim().min(4).max(200),
  excerpt: z.string().trim().min(10).max(400),
  content: z.string().trim().min(10),
  category: z.enum(["annonce", "version", "correction", "tutoriel", "conseils"]).default("annonce"),
  coverEmoji: z.string().trim().max(8).default("📰"),
  published: z.coerce.boolean().default(true),
  publishedAt: z.coerce.date().optional(),
});

const faqSchema = z.object({
  question: z.string().trim().min(5).max(300),
  answer: z.string().trim().min(10),
  category: z.enum(["general", "compte", "abonnement", "logiciel", "support"]).default("general"),
  sortOrder: z.coerce.number().int().default(0),
  published: z.coerce.boolean().default(true),
});

const testimonialSchema = z.object({
  name: z.string().trim().min(2).max(80),
  role: z.string().trim().min(2).max(100),
  establishment: z.string().trim().min(2).max(150),
  content: z.string().trim().min(10).max(1000),
  rating: z.coerce.number().int().min(1).max(5).default(5),
  initials: z.string().trim().min(1).max(4),
  color: z.enum(["emerald", "teal", "amber", "rose", "sky", "violet"]).default("emerald"),
  published: z.coerce.boolean().default(true),
  sortOrder: z.coerce.number().int().default(0),
});

const versionSchema = z.object({
  version: z.string().trim().min(1).max(20),
  channel: z.enum(["stable", "beta"]).default("stable"),
  releaseDate: z.coerce.date(),
  fileSizeMb: z.coerce.number().min(0),
  minOs: z.string().trim().max(200),
  installerName: z.string().trim().max(120),
  downloadUrl: z.string().trim().max(500).refine((value) => value === "" || URL.canParse(value), "URL de téléchargement invalide"),
  changelog: z.string().max(8000).default(""),
  active: z.coerce.boolean().default(true),
});

const docSchema = z.object({
  number: z.coerce.number().int().min(1).max(99),
  slug: z.string().trim().min(2).max(60).regex(/^[a-z0-9-]+$/, "Slug invalide"),
  title: z.string().trim().min(2).max(120),
  content: z.string().trim().min(10),
  icon: z.string().trim().max(40).default("book"),
});

const librarySchema = z.object({
  title: z.string().trim().min(2).max(200),
  description: z.string().trim().max(1000).default(""),
  author: z.string().trim().max(160).default(""),
  category: z.string().trim().min(2).max(80).default("Cours"),
  level: z.string().trim().max(80).default("Tous niveaux"),
  fileType: z.string().trim().max(20).default("PDF"),
  fileSizeMb: z.coerce.number().min(0).max(100000).default(0),
  coverUrl: z.string().trim().max(500).refine((value) => value === "" || URL.canParse(value), "URL de couverture invalide").default(""),
  downloadUrl: z.string().trim().min(1).max(500).refine((value) => {
    try { const url = new URL(value); return ["http:", "https:"].includes(url.protocol); } catch { return false; }
  }, "URL de téléchargement invalide"),
  featured: z.coerce.boolean().default(false),
  published: z.coerce.boolean().default(true),
  sortOrder: z.coerce.number().int().default(0),
});

const ticketPatchSchema = z.object({
  status: z.enum(["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"]).optional(),
  priority: z.enum(["LOW", "NORMAL", "HIGH"]).optional(),
  response: z.string().max(5000).optional(),
});

const subPatchSchema = z.object({
  status: z.enum(["PENDING", "AWAITING_PAYMENT", "ACTIVE", "EXPIRED", "CANCELLED"]),
});

// ── Registre d'entités administrables (liste blanche stricte) ─
type Delegate = {
  findMany: (args?: unknown) => Promise<unknown[]>;
  findUnique: (args: unknown) => Promise<unknown>;
  create: (args: { data: unknown }) => Promise<unknown>;
  update: (args: { where: unknown; data: unknown }) => Promise<unknown>;
  delete: (args: { where: unknown }) => Promise<unknown>;
};

const REGISTRY: Record<string, { delegate: Delegate }> = {
  plans: { delegate: db.subscriptionPlan },
  articles: { delegate: db.article },
  faqs: { delegate: db.faqItem },
  testimonials: { delegate: db.testimonial },
  versions: { delegate: db.softwareVersion },
  docs: { delegate: db.docSection },
  library: { delegate: db.libraryDocument },
  tickets: { delegate: db.supportTicket },
  subscriptions: { delegate: db.subscription },
  payments: { delegate: db.payment },
};

function schemaForCreate(entity: string): z.ZodType | null {
  switch (entity) {
    case "plans": return planSchema;
    case "articles": return articleSchema;
    case "faqs": return faqSchema;
    case "testimonials": return testimonialSchema;
    case "versions": return versionSchema;
    case "docs": return docSchema;
    case "library": return librarySchema;
    default: return null;
  }
}

// Transformation spécifique : les formules stockent leurs fonctionnalités en JSON
function transformData(entity: string, data: Record<string, unknown>): Record<string, unknown> {
  if (entity === "plans" && Array.isArray(data.features)) {
    return { ...data, features: JSON.stringify(data.features) };
  }
  return data;
}

function isPrismaUniqueError(e: unknown): boolean {
  return (
    typeof e === "object" && e !== null &&
    "code" in e && (e as { code: string }).code === "P2002"
  );
}

// GET /api/admin/[entity] — Liste complète d'une entité
export async function GET(req: Request, { params }: { params: Promise<{ entity: string }> }) {
  return handle(async () => {
    await requireAdmin(req);
    const { entity } = await params;
    const entry = REGISTRY[entity];
    if (!entry) return fail("Entité inconnue.", 404);
    if (entity === "payments") {
      const items = await db.payment.findMany({
        include: {
          user: { select: { firstName: true, lastName: true, email: true, phone: true } },
          subscription: { include: { plan: true, licenseKeys: true } },
        },
        orderBy: { createdAt: "desc" },
      });
      return ok(items);
    }
    const items = await entry.delegate.findMany();
    if (entity === "plans") {
      return ok((items as { features: string }[]).map((it) => ({ ...it, features: JSON.parse(it.features || "[]") })));
    }
    return ok(items);
  });
}

// POST /api/admin/[entity] — Création
export async function POST(req: Request, { params }: { params: Promise<{ entity: string }> }) {
  return handle(async () => {
    assertSameOrigin(req);
    const admin = await requireAdmin(req);
    const ip = getClientIp(req);
    const { entity } = await params;

    const schema = schemaForCreate(entity);
    if (!schema) return fail("Création non permise pour cette entité.", 400);
    const entry = REGISTRY[entity];
    if (!entry) return fail("Entité inconnue.", 404);

    const data = schema.parse(await req.json());
    try {
      const created = await entry.delegate.create({ data: transformData(entity, data as Record<string, unknown>) });
      await logAction("ADMIN_CREATE", admin.id, `${entity}`, ip);
      return ok(created, 201);
    } catch (e) {
      if (isPrismaUniqueError(e)) return fail("Un enregistrement avec cet identifiant existe déjà.", 409);
      throw e;
    }
  });
}
