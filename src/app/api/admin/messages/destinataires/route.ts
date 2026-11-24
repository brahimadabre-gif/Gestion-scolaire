import { db } from "@/lib/db";
import { handle, ok } from "@/lib/api-helpers";
import { requireAdmin } from "@/lib/auth";
import { getLicenseStatus } from "@/lib/license-duration";
import { resolveLicensePlatform } from "@/lib/license-platform";

// GET /api/admin/messages/destinataires — écoles à qui l'on peut écrire.
// Un logiciel n'est reconnu que par sa clé : on liste donc les clés, regroupées
// par compte du site ; une clé sans compte (vendue hors du site) forme sa propre ligne.
// Filtres : q, platform (PC | ANDROID), licence (ACTIVE | EXPIRED | AVAILABLE | REVOKED), ville.
type Statut = ReturnType<typeof getLicenseStatus>;
const ORDRE: Statut[] = ["ACTIVE", "EXPIRED", "AVAILABLE", "REVOKED"];

export async function GET(req: Request) {
  return handle(async () => {
    await requireAdmin(req);
    const url = new URL(req.url);
    const q = (url.searchParams.get("q") ?? "").trim().toLocaleLowerCase().slice(0, 120);
    const platform = (url.searchParams.get("platform") ?? "all").toUpperCase();
    const licence = (url.searchParams.get("licence") ?? "all").toUpperCase();
    const ville = (url.searchParams.get("ville") ?? "").trim().toLocaleLowerCase();
    const now = new Date();

    const cles = await db.licenseKey.findMany({
      include: {
        user: { select: { id: true, firstName: true, lastName: true, email: true, establishment: true } },
        subscription: { select: { status: true, endDate: true, plan: { select: { platform: true, slug: true } } } },
      },
      orderBy: { createdAt: "desc" },
      take: 5000,
    });

    interface Ligne {
      id: string; type: "COMPTE" | "CLE"; userId: string | null; key: string | null;
      ecole: string; personne: string; email: string | null; ville: string | null;
      platforms: string[]; statut: Statut; fin: Date | null; derniereConnexion: Date | null; cles: string[];
    }
    const lignes = new Map<string, Ligne>();
    for (const c of cles) {
      const statut = getLicenseStatus({ status: c.status, expiresAt: c.expiresAt, subscriptionEndDate: c.subscription?.endDate ?? null, subscriptionStatus: c.subscription?.status ?? null }, now);
      const plateforme = resolveLicensePlatform(c);
      const id = c.user ? `u:${c.user.id}` : `k:${c.key}`;
      const fichePersonne = [c.clientLastName, c.clientFirstName].filter(Boolean).join(" ");
      let l = lignes.get(id);
      if (!l) {
        l = {
          id, type: c.user ? "COMPTE" : "CLE", userId: c.user?.id ?? null, key: c.user ? null : c.key,
          ecole: c.clientSchool || c.user?.establishment || (c.user ? "" : "Clé sans compte"),
          personne: fichePersonne || (c.user ? `${c.user.firstName} ${c.user.lastName}` : ""),
          email: c.user?.email ?? null, ville: c.clientCity || null,
          platforms: [], statut, fin: null, derniereConnexion: null, cles: [],
        };
        lignes.set(id, l);
      }
      // La fiche client saisie sur une clé complète celle du compte.
      if (!l.ville && c.clientCity) l.ville = c.clientCity;
      if ((!l.ecole || l.ecole === "Clé sans compte") && c.clientSchool) l.ecole = c.clientSchool;
      l.cles.push(c.key);
      if (plateforme && !l.platforms.includes(plateforme)) l.platforms.push(plateforme);
      if (ORDRE.indexOf(statut) < ORDRE.indexOf(l.statut)) l.statut = statut;
      const fin = c.expiresAt ?? c.subscription?.endDate ?? null;
      if (fin && (!l.fin || fin > l.fin)) l.fin = fin;
      if (c.lastCheckAt && (!l.derniereConnexion || c.lastCheckAt > l.derniereConnexion)) l.derniereConnexion = c.lastCheckAt;
    }

    const toutes = [...lignes.values()];
    const villes = [...new Set(toutes.map((l) => l.ville).filter((v): v is string => Boolean(v)))].sort((a, b) => a.localeCompare(b, "fr"));
    const items = toutes.filter((l) => {
      if ((platform === "PC" || platform === "ANDROID") && !l.platforms.includes(platform)) return false;
      if (licence !== "ALL" && l.statut !== licence) return false;
      if (ville && (l.ville ?? "").toLocaleLowerCase() !== ville) return false;
      if (!q) return true;
      return [l.ecole, l.personne, l.email, l.ville, ...l.cles].filter(Boolean).join(" ").toLocaleLowerCase().includes(q);
    }).sort((a, b) => (b.derniereConnexion?.getTime() ?? 0) - (a.derniereConnexion?.getTime() ?? 0));

    return ok({ total: toutes.length, villes, items: items.slice(0, 500), tronque: items.length > 500 });
  });
}
