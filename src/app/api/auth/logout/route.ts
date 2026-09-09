import { ok, handle, assertSameOrigin, logAction, getClientIp } from "@/lib/api-helpers";
import { SESSION_COOKIE, getSessionUser } from "@/lib/auth";

export async function POST(req: Request) {
  return handle(async () => {
    assertSameOrigin(req);
    const user = await getSessionUser(req);
    if (user) await logAction("LOGOUT", user.id, "Déconnexion", getClientIp(req));
    const res = ok({ message: "Déconnecté avec succès." });
    res.cookies.set(SESSION_COOKIE, "", { ...{ path: "/" }, maxAge: 0 });
    return res;
  });
}
