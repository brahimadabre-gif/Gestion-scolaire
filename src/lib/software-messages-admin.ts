import { db } from "@/lib/db";
import { fail } from "@/lib/api-helpers";
import { normaliserCle } from "@/lib/software-messages";

// Statistiques d'un ensemble de messages : reçus, lus et nombre de logiciels visés.
export async function statsMessages(messages: { id: string; audience: string; targetUserIds: string[]; targetKeys: string[] }[]) {
  const ids = messages.map((m) => m.id);
  const [recus, lus, actives] = await Promise.all([
    db.softwareMessageView.groupBy({ by: ["messageId"], where: { messageId: { in: ids } }, _count: { _all: true } }),
    db.softwareMessageView.groupBy({ by: ["messageId"], where: { messageId: { in: ids }, readAt: { not: null } }, _count: { _all: true } }),
    db.licenseKey.groupBy({ by: ["platform"], where: { status: "ACTIVE" }, _count: { _all: true } }),
  ]);
  const totalActives = actives.reduce((s, a) => s + a._count._all, 0);
  const parPlateforme = (p: string) => actives.find((a) => a.platform === p)?._count._all ?? 0;

  // Clés des comptes choisis, chargées en une seule fois pour tous les messages.
  const comptes = [...new Set(messages.flatMap((m) => (m.audience === "SELECTION" ? m.targetUserIds : [])))];
  const clesComptes = comptes.length
    ? await db.licenseKey.findMany({ where: { userId: { in: comptes }, status: { not: "REVOKED" } }, select: { key: true, userId: true } })
    : [];

  const resultat = new Map<string, { recus: number; lus: number; vises: number | null }>();
  for (const m of messages) {
    let vises: number | null = null;
    if (m.audience === "ALL") vises = totalActives;
    else if (m.audience === "PC" || m.audience === "ANDROID") vises = parPlateforme(m.audience);
    else if (m.audience === "SELECTION") {
      const deComptes = clesComptes.filter((c) => c.userId && m.targetUserIds.includes(c.userId)).map((c) => c.key);
      vises = new Set([...m.targetKeys, ...deComptes]).size;
    }
    resultat.set(m.id, {
      recus: recus.find((r) => r.messageId === m.id)?._count._all ?? 0,
      lus: lus.find((r) => r.messageId === m.id)?._count._all ?? 0,
      vises,
    });
  }
  return resultat;
}

// Rappel de paiement échu qui suspend cette licence (null si aucun).
// Utilisé par /api/license/status et /api/license/activate : même les anciennes
// versions du logiciel se bloquent, car elles refusent une licence « valid: false ».
export async function suspensionEnCours(licence: { key: string; userId: string | null }, now = new Date()) {
  return db.softwareMessage.findFirst({
    where: {
      status: "PUBLISHED",
      suspendAtDeadline: true,
      audience: "SELECTION",
      deadlineAt: { lte: now },
      AND: [
        { OR: [{ startsAt: null }, { startsAt: { lte: now } }] },
        { OR: [{ targetKeys: { has: normaliserCle(licence.key) } }, ...(licence.userId ? [{ targetUserIds: { has: licence.userId } }] : [])] },
      ],
    },
    select: { id: true, title: true, deadlineAt: true },
    orderBy: { deadlineAt: "asc" },
  });
}

// Vérifie que les clés collées et les comptes choisis existent. Renvoie une réponse d'erreur sinon.
export async function verifierDestinataires(targetUserIds: string[], targetKeys: string[]) {
  if (targetKeys.length) {
    const cles = targetKeys.map(normaliserCle);
    const trouvees = await db.licenseKey.findMany({ where: { key: { in: cles } }, select: { key: true } });
    const inconnues = cles.filter((k) => !trouvees.some((t) => t.key === k));
    if (inconnues.length) return fail(`Clé(s) introuvable(s) : ${inconnues.slice(0, 5).join(", ")}${inconnues.length > 5 ? "…" : ""}`, 422);
  }
  if (targetUserIds.length) {
    const n = await db.user.count({ where: { id: { in: targetUserIds } } });
    if (n !== new Set(targetUserIds).size) return fail("Un des comptes choisis n'existe plus.", 422);
  }
  return null;
}
