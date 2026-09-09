import { db } from "@/lib/db";
import { ok, handle, logAction, getClientIp, assertSameOrigin } from "@/lib/api-helpers";
import { profileSchema } from "@/lib/validations";
import { requireUser } from "@/lib/auth";

export async function PATCH(req: Request) {
  return handle(async () => {
    assertSameOrigin(req);
    const sessionUser = await requireUser(req);
    const data = profileSchema.parse(await req.json());

    const user = await db.user.update({
      where: { id: sessionUser.id },
      data: {
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone || null,
        establishment: data.establishment || null,
        country: data.country,
      },
      select: {
        id: true, firstName: true, lastName: true, email: true, phone: true,
        establishment: true, country: true, role: true, createdAt: true,
      },
    });
    await logAction("PROFILE_UPDATE", user.id, "Profil mis à jour", getClientIp(req));
    return ok({ user });
  });
}
