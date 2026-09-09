import { db } from "@/lib/db";
import { ok, handle, getClientIp, logAction, assertSameOrigin } from "@/lib/api-helpers";
import { getSessionUser, requireUser } from "@/lib/auth";
import { ticketSchema } from "@/lib/validations";
import { generateReference } from "@/lib/auth";

// GET /api/tickets — Tickets de l'utilisateur (ou tous si admin/support)
export async function GET(req: Request) {
  return handle(async () => {
    const user = await getSessionUser(req);
    if (!user) return ok([]);
    const isAdminStaff = user.role === "ADMIN" || user.role === "SUPPORT";
    const tickets = await db.supportTicket.findMany({
      where: isAdminStaff ? {} : { OR: [{ userId: user.id }, { email: user.email }] },
      orderBy: { createdAt: "desc" },
      take: 100,
    });
    return ok(tickets);
  });
}

// POST /api/tickets — Nouvelle demande de support (connecté ou visiteur)
export async function POST(req: Request) {
  return handle(async () => {
    assertSameOrigin(req);
    const user = await getSessionUser(req);
    const ip = getClientIp(req);
    const data = ticketSchema.parse(await req.json());

    const year = new Date().getFullYear();
    const count = await db.supportTicket.count();
    const ticket = await db.supportTicket.create({
      data: {
        reference: `TCK-${year}-${String(count + 1).padStart(4, "0")}`,
        userId: user?.id ?? null,
        name: data.name,
        email: data.email.toLowerCase(),
        subject: data.subject,
        category: data.category,
        message: data.message,
        attachment: data.attachment || null,
      },
    });

    await logAction("TICKET_CREATED", user?.id ?? null, ticket.reference, ip);
    return ok({ reference: ticket.reference }, 201);
  });
}
