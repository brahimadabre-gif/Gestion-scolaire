import { db } from "@/lib/db";
import { ok, fail, handle, logAction, getClientIp, assertSameOrigin } from "@/lib/api-helpers";
import { changePasswordSchema } from "@/lib/validations";
import { requireUser, verifyPassword, hashPassword } from "@/lib/auth";

export async function POST(req: Request) {
  return handle(async () => {
    assertSameOrigin(req);
    const sessionUser = await requireUser(req);
    const data = changePasswordSchema.parse(await req.json());

    const user = await db.user.findUnique({ where: { id: sessionUser.id } });
    if (!user || !(await verifyPassword(data.currentPassword, user.password))) {
      return fail("Le mot de passe actuel est incorrect.", 401);
    }

    await db.user.update({
      where: { id: user.id },
      data: { password: await hashPassword(data.newPassword) },
    });
    await logAction("PASSWORD_CHANGE", user.id, "Changement de mot de passe", getClientIp(req));

    return ok({ message: "Mot de passe mis à jour avec succès." });
  });
}
