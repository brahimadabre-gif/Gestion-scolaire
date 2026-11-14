"use client";

// ── Démo interactive de Gestion Scolaire Pro Plus ──
// Le visiteur manipule une copie allégée du logiciel, dans un écran d'ordinateur
// ou de téléphone : tous les modules du menu, données fictives, rien n'est enregistré.
// Deux modes : « Essayer librement » et « Visite guidée » (bulles étape par étape).
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { navigate } from "../router";
import { Ctx, CIBLE, type CtxDemo } from "./demo-contexte";
import { ECRANS } from "./demo-ecrans";
import { MENU, etatInitial, heureMaintenant, iconeDe, libelleDe, type EtatDemo } from "./demo-donnees";

/** `page` : écran où se trouve la cible (le visiteur y est ramené s'il s'en est éloigné). */
interface Etape { cible: string; texte: string; attend: string; page?: string }
const ETAPES: Etape[] = [
  { cible: "splash", texte: "Bienvenue ! Cliquez sur « Commencer » pour ouvrir le logiciel.", attend: "demarre" },
  { cible: "nav:eleves", texte: "Ouvrez « Gestion des élèves » dans le menu.", attend: "page:eleves" },
  { cible: "eleve:ajouter", texte: "Cliquez sur « Ajouter un élève ».", attend: "eleve:formulaire", page: "eleves" },
  { cible: "eleve:enregistrer", texte: "Tapez un nom et des prénoms, puis cliquez sur « Enregistrer ».", attend: "eleve:ajoute", page: "eleves" },
  { cible: "nav:notes", texte: "Ouvrez « Saisie des notes ».", attend: "page:notes" },
  { cible: "note:premiere", texte: "Changez la note de KONAN Aya : sa moyenne et son rang se recalculent tout seuls.", attend: "note:modifiee", page: "notes" },
  { cible: "nav:bulletins", texte: "Ouvrez « Bulletins scolaires ».", attend: "page:bulletins" },
  { cible: "bulletin:imprimer", texte: "Cliquez sur « Imprimer le bulletin » pour voir le document.", attend: "bulletin:imprime", page: "bulletins" },
  { cible: "nav:appel", texte: "Fermez l'aperçu, puis ouvrez le « Registre d'appel ».", attend: "page:appel" },
  { cible: "appel:premier", texte: "Marquez TRAORE Moussa absent ce matin (touchez le « P »).", attend: "appel:modifie", page: "appel" },
  { cible: "nav:caisse", texte: "Ouvrez la « Caisse ».", attend: "page:caisse" },
  { cible: "caisse:encaisser", texte: "Encaissez un paiement : le reçu s'affiche aussitôt.", attend: "caisse:encaisse", page: "caisse" },
];

type Mode = "libre" | "guide";

export function DemoLogiciel({ appareil }: { appareil: "pc" | "telephone" }) {
  const telephone = appareil === "telephone";
  const [s, setS] = useState<EtatDemo>(etatInitial);
  const [page, setPage] = useState("dashboard");
  const [mode, setMode] = useState<Mode>("libre");
  const [etape, setEtape] = useState(0);
  const [splash, setSplash] = useState<"accueil" | "verrou" | null>("accueil");
  const [menuOuvert, setMenuOuvert] = useState(false);
  const [sombre, setSombre] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [doc, setDoc] = useState<{ titre: string; contenu: ReactNode } | null>(null);
  const [heure, setHeure] = useState("--:--");
  const [etroit, setEtroit] = useState(telephone);
  const ecranRef = useRef<HTMLDivElement>(null);

  // Horloge (côté navigateur seulement : pas d'écart avec le rendu serveur)
  useEffect(() => {
    const t0 = setTimeout(() => setHeure(heureMaintenant()), 0);
    const t = setInterval(() => setHeure(heureMaintenant()), 20000);
    return () => { clearTimeout(t0); clearInterval(t); };
  }, []);

  // Écran d'ordinateur étroit (téléphone qui affiche la version PC) : menu en tiroir
  useEffect(() => {
    if (telephone || !ecranRef.current) return;
    const el = ecranRef.current;
    const ro = new ResizeObserver(() => setEtroit(el.clientWidth < 640));
    ro.observe(el);
    return () => ro.disconnect();
  }, [telephone]);

  useEffect(() => {
    if (!msg) return;
    const t = setTimeout(() => setMsg(null), 2800);
    return () => clearTimeout(t);
  }, [msg]);

  const signal = useCallback((evt: string) => {
    if (mode !== "guide") return;
    setEtape((e) => (ETAPES[e]?.attend === evt ? e + 1 : e));
  }, [mode]);

  const maj = useCallback((fn: (d: EtatDemo) => void, texte?: string) => {
    setS((prev) => {
      const d = structuredClone(prev);
      fn(d);
      if (texte) d.journal.unshift({ heure: heureMaintenant(), texte });
      return d;
    });
  }, []);

  const aller = useCallback((p: string) => {
    setPage(p);
    setMenuOuvert(false);
    signal("page:" + p);
  }, [signal]);

  // Le visiteur s'est éloigné de l'écran de l'étape : on le guide d'abord vers le bon menu.
  const etapeCourante = mode === "guide" ? ETAPES[etape] : undefined;
  const egare = !!etapeCourante?.page && etapeCourante.page !== page && !splash;
  const cible = etapeCourante ? (egare ? "nav:" + etapeCourante.page : etapeCourante.cible) : null;
  const texteEtape = etapeCourante ? (egare ? `Revenez à « ${libelleDe(etapeCourante.page!)} » dans le menu.` : etapeCourante.texte) : "";
  const menuCache = telephone || etroit ? !menuOuvert : false;
  const g = useCallback((id: string) => {
    if (!cible) return "";
    if (id === cible) return CIBLE;
    if (id === "menu" && cible.startsWith("nav:") && menuCache && !doc) return CIBLE;
    return "";
  }, [cible, menuCache, doc]);

  // Amène la cible de l'étape à l'écran (sans faire défiler toute la page du site)
  useEffect(() => {
    if (!cible || !ecranRef.current) return;
    const t = setTimeout(() => {
      const el = ecranRef.current?.querySelector<HTMLElement>(`[data-cible="${cible}"]`) ?? ecranRef.current?.querySelector<HTMLElement>(".animate-pulse");
      if (!el) return;
      let p = el.parentElement;
      while (p && p !== ecranRef.current) {
        const st = getComputedStyle(p);
        if (/(auto|scroll)/.test(st.overflowY) && p.scrollHeight > p.clientHeight) {
          const r = el.getBoundingClientRect(), rp = p.getBoundingClientRect();
          if (r.top < rp.top + 8 || r.bottom > rp.bottom - 90) p.scrollTop += r.top - rp.top - rp.height / 3;
          break;
        }
        p = p.parentElement;
      }
    }, 120);
    return () => clearTimeout(t);
  }, [cible, page, menuOuvert, doc]);

  const ctx: CtxDemo = useMemo(() => ({
    s, maj, signal, toast: setMsg, apercu: (titre, contenu) => setDoc({ titre, contenu }), aller, g, telephone,
  }), [s, maj, signal, aller, g, telephone]);

  const recommencer = (m: Mode) => {
    setS(etatInitial()); setPage("dashboard"); setEtape(0); setSplash("accueil"); setMenuOuvert(false); setDoc(null); setMode(m);
  };

  const Ecran = ECRANS[page] ?? ECRANS.dashboard;
  const fini = mode === "guide" && etape >= ETAPES.length;

  // ── Menu latéral (mêmes groupes que le logiciel) ──
  const menu = (
    <nav aria-label="Menu du logiciel (démo)" className="gspp-scrollbar flex h-full flex-col gap-0.5 overflow-y-auto bg-gradient-to-b from-[#B8361E] to-[#8F2A16] p-2 text-[12px] text-orange-50">
      {MENU.map((gr) => (
        <div key={gr.titre} className="mb-1">
          <p className="mx-1 mb-0.5 mt-1 rounded-md bg-white/10 px-2 py-1 text-[9.5px] font-extrabold uppercase tracking-wider text-orange-100">≡ {gr.titre}</p>
          {gr.entrees.map((en) => (
            <button
              key={en.id}
              type="button"
              data-cible={"nav:" + en.id}
              onClick={() => aller(en.id)}
              className={cn(
                "flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left font-medium transition",
                page === en.id ? "bg-white font-bold text-[#8F2A16] shadow" : "text-orange-50/90 hover:bg-white/10",
                g("nav:" + en.id)
              )}
            >
              <span aria-hidden="true" className="w-4 text-center">{en.icone}</span>
              <span className="truncate">{en.libelle}</span>
            </button>
          ))}
        </div>
      ))}
    </nav>
  );

  const rond = "flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 text-[13px] transition hover:scale-105";
  const entete = (
    <div className="flex items-center gap-2 border-b border-orange-200/60 bg-gradient-to-r from-orange-50 via-white to-white px-2.5 py-2 dark:border-slate-700 dark:from-slate-900 dark:via-slate-900 dark:to-slate-900">
      <button type="button" aria-label="Ouvrir le menu" data-cible="menu" onClick={() => setMenuOuvert((o) => !o)}
        className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-slate-300 bg-white text-[15px] text-slate-700 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100", !telephone && !etroit && "hidden", g("menu"))}>
        ☰
      </button>
      <div className="min-w-0">
        <p className="truncate text-[12.5px] font-extrabold leading-tight text-slate-900 dark:text-white">{s.ecole || "Mon école"}</p>
        <p className="truncate text-[9.5px] text-slate-500 dark:text-slate-400">Année scolaire : {s.annee}</p>
      </div>
      <div className={cn("mx-auto shrink-0 rounded-lg border border-orange-300 bg-orange-50 px-2 py-0.5 text-center leading-tight dark:border-slate-600 dark:bg-slate-800", telephone && "mx-0")}>
        <p className="text-[8px] font-semibold text-slate-600 dark:text-slate-300">Ven. 14/11/2026</p>
        <p className="text-[11px] font-extrabold text-slate-900 dark:text-white">{heure}</p>
      </div>
      {!telephone && !etroit && <span className="hidden truncate text-[10.5px] font-semibold text-slate-700 dark:text-slate-300 xl:inline">M. TANOH Serge · Directeur</span>}
      {telephone || etroit ? (
        <div className="ml-auto flex items-center gap-1">
          <button type="button" aria-label="Mode sombre" onClick={() => setSombre((v) => !v)} className={cn(rond, "border-orange-400 bg-white dark:bg-slate-800")}>{sombre ? "☀️" : "🌙"}</button>
          <button type="button" aria-label="Paramètres" onClick={() => aller("parametres")} className={cn(rond, "border-orange-400 bg-white dark:bg-slate-800")}>⚙️</button>
          <button type="button" aria-label="Déconnexion" onClick={() => setSplash("accueil")} className={cn(rond, "border-red-500 bg-red-600")}>🚪</button>
        </div>
      ) : (
        <div className="ml-auto flex items-center gap-2">
          {/* Capsule orange : Thème, Licences, Contact, Verrouiller, puis ⚙️ (comme le logiciel 2.3.31) */}
          <div className="group flex items-center rounded-full border-2 border-orange-500 bg-white p-0.5 transition-shadow hover:shadow-[0_0_0_4px_rgba(249,115,22,.15)] focus-within:shadow-[0_0_0_4px_rgba(249,115,22,.15)] dark:bg-slate-800">
            <div className="flex max-w-0 items-center overflow-hidden opacity-0 transition-all duration-300 group-hover:max-w-[180px] group-hover:opacity-100 group-focus-within:max-w-[180px] group-focus-within:opacity-100">
              {[
                ["Mode sombre", sombre ? "☀️" : "🌙", () => setSombre((v) => !v)],
                ["Gestion des licences", "🔑", () => aller("licences")],
                ["Contacter le développeur", "👨‍💻", () => setMsg("Démo : dans le logiciel, ce bouton ouvre le contact du développeur.")],
                ["Verrouiller le logiciel", "🔒", () => setSplash("verrou")],
              ].map(([t, i, f]) => (
                <button key={t as string} type="button" title={t as string} aria-label={t as string} onClick={f as () => void}
                  className="flex h-7 w-7 items-center justify-center rounded-full text-[13px] hover:bg-orange-100 dark:hover:bg-slate-700">{i as string}</button>
              ))}
            </div>
            <button type="button" title="Paramètres" aria-label="Paramètres" onClick={() => aller("parametres")}
              className="flex h-7 w-7 items-center justify-center rounded-full text-[13px] transition-transform group-hover:rotate-[60deg] hover:bg-orange-100 dark:hover:bg-slate-700">⚙️</button>
          </div>
          <button type="button" onClick={() => setSplash("accueil")} className="rounded-lg bg-red-600 px-2.5 py-1.5 text-[11px] font-bold text-white hover:bg-red-700">🚪 Déconnexion</button>
        </div>
      )}
    </div>
  );

  const ecran = (
    <div ref={ecranRef} className={cn("relative flex h-full min-h-0 flex-col overflow-hidden bg-slate-50 text-left dark:bg-slate-950", sombre && "dark")}>
      {entete}
      <div className="relative flex min-h-0 flex-1">
        {!telephone && !etroit && <aside className="w-48 shrink-0">{menu}</aside>}
        {(telephone || etroit) && menuOuvert && (
          <div className="absolute inset-0 z-30 flex">
            <aside className="h-full w-[78%] max-w-[250px] shadow-2xl">{menu}</aside>
            <button type="button" aria-label="Fermer le menu" className="flex-1 bg-slate-900/40" onClick={() => setMenuOuvert(false)} />
          </div>
        )}
        <main className="gspp-scrollbar min-w-0 flex-1 overflow-y-auto p-3 pb-24">
          <div key={page}><Ecran /></div>
        </main>
      </div>
      <div className="flex items-center gap-2 border-t border-slate-200 bg-white px-2.5 py-1 text-[9.5px] text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400">
        <span className="h-2 w-2 rounded-full bg-emerald-500" aria-hidden="true" /> Données sauvegardées (démo)
        <span className="ml-auto">{libelleDe(page)} · v2.3.31</span>
      </div>

      {/* Écran d'accueil / verrouillage */}
      {splash && (
        <div className="absolute inset-0 z-40 flex flex-col items-center justify-center gap-3 bg-gradient-to-br from-[#B8361E] via-[#C2410C] to-[#7C2D12] p-6 text-center text-white">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15 text-[28px]" aria-hidden="true">🎓</span>
          <p className="text-[18px] font-extrabold leading-tight">Gestion Scolaire Pro Plus</p>
          <p className="text-[12px] text-orange-100">{s.ecole} · {s.annee}</p>
          {splash === "verrou" && <p className="max-w-xs rounded-lg bg-black/20 px-3 py-1.5 text-[11px]">Logiciel verrouillé — M. TANOH Serge reste connecté. Cliquez sur « Continuer » pour reprendre.</p>}
          <button
            type="button"
            data-cible="splash"
            onClick={() => { setSplash(null); signal("demarre"); }}
            className={cn("relative mt-1 rounded-xl border border-white/40 bg-white/20 px-6 py-2.5 text-[14px] font-extrabold shadow-lg backdrop-blur transition hover:bg-white/30", mode === "guide" ? g("splash") : "ring-4 ring-white/40 hover:ring-white/70")}
          >
            {splash === "verrou" ? "Continuer" : "Commencer"}
          </button>
          {/* Main qui invite à cliquer */}
          <span className="flex animate-bounce flex-col items-center text-[12px] font-bold text-white" aria-hidden="true">
            <span className="text-[26px] leading-none">👆</span>
            {telephone ? "Touchez pour essayer" : "Cliquez pour essayer"}
          </span>
        </div>
      )}

      {/* Aperçu avant impression */}
      {doc && (
        <div className="absolute inset-0 z-30 flex flex-col bg-slate-900/70">
          <div className="flex items-center gap-2 bg-slate-800 px-3 py-2 text-[12px] font-bold text-white">
            <span className="truncate">Aperçu — {doc.titre}</span>
            <button type="button" onClick={() => setMsg("Démo : dans le logiciel, le document part à l'imprimante ou en PDF.")} className="ml-auto shrink-0 rounded-md bg-emerald-600 px-2 py-1 text-[11px]">🖨️ Imprimer</button>
            <button type="button" onClick={() => setDoc(null)} className="shrink-0 rounded-md bg-white/15 px-2 py-1 text-[11px]">✕ Fermer</button>
          </div>
          <div className="gspp-scrollbar min-h-0 flex-1 overflow-y-auto p-3 pb-24">{doc.contenu}</div>
        </div>
      )}

      {msg && (
        <div role="status" className="absolute left-1/2 top-14 z-50 w-[88%] max-w-sm -translate-x-1/2 rounded-xl bg-slate-900 px-3 py-2 text-[11.5px] font-semibold text-white shadow-xl dark:bg-white dark:text-slate-900">
          ✅ {msg}
        </div>
      )}

      {/* Bulle de la visite guidée */}
      {mode === "guide" && (
        <div className="absolute inset-x-2 bottom-7 z-50 rounded-xl bg-slate-900/95 p-2.5 text-white shadow-2xl ring-1 ring-white/10">
          {fini ? (
            <div className="flex flex-wrap items-center gap-2 text-[12px]">
              <span className="font-bold">🎉 Bravo, vous avez fait le tour ! Explorez librement les autres modules.</span>
              <button type="button" onClick={() => navigate("/telecharger")} className="rounded-lg bg-orange-500 px-3 py-1 font-bold">Télécharger GSPP</button>
              <button type="button" onClick={() => recommencer("guide")} className="rounded-lg bg-white/15 px-3 py-1">Recommencer</button>
            </div>
          ) : (
            <>
              <div className="flex items-start gap-2 text-[12px] leading-snug">
                <span className="shrink-0 rounded-md bg-orange-500 px-1.5 py-0.5 text-[10.5px] font-extrabold">{etape + 1}/{ETAPES.length}</span>
                <span className="font-semibold">
                  {cible?.startsWith("nav:") && menuCache && !doc ? `Touchez ☰ pour ouvrir le menu, puis « ${libelleDe(cible.slice(4))} ».` : texteEtape}
                </span>
                <button type="button" onClick={() => setEtape((e) => e + 1)} className="ml-auto shrink-0 rounded-md bg-white/15 px-2 py-0.5 text-[10.5px]">Passer</button>
              </div>
              <div className="mt-2 h-1 overflow-hidden rounded-full bg-white/15"><div className="h-full rounded-full bg-orange-500 transition-all" style={{ width: (etape / ETAPES.length) * 100 + "%" }} /></div>
            </>
          )}
        </div>
      )}
    </div>
  );

  return (
    <Ctx.Provider value={ctx}>
      <div className="mx-auto w-full">
        {/* Bandeau : la maquette est un vrai logiciel à manipuler */}
        <div className="mx-auto mb-4 flex max-w-2xl items-center gap-3 rounded-2xl border-2 border-dashed border-orange-500/70 bg-orange-50 px-4 py-3 text-left dark:bg-orange-950/40">
          <span className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-orange-600 text-[20px] text-white shadow" aria-hidden="true">
            <span className="absolute inset-0 animate-ping rounded-full bg-orange-500/40" />
            👆
          </span>
          <span className="min-w-0 text-[13.5px] leading-snug text-slate-800 dark:text-orange-50">
            <span className="mr-1.5 inline-flex items-center gap-1 rounded-full bg-orange-600 px-2 py-0.5 align-middle text-[10px] font-extrabold uppercase tracking-wide text-white">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" /> Interactif
            </span>
            <strong>Ce n&apos;est pas une image : {telephone ? "touchez" : "cliquez dans"} l&apos;écran {telephone ? "du téléphone" : "de l'ordinateur"}.</strong>{" "}
            Ouvrez le menu, ajoutez un élève, saisissez des notes, imprimez un bulletin… comme dans le vrai logiciel.
          </span>
        </div>

        {/* Choix du mode */}
        <div className="mb-5 flex flex-wrap items-center justify-center gap-2">
          <div className="inline-flex rounded-full border bg-card p-1 shadow-sm" role="group" aria-label="Mode de démonstration">
            {([["libre", "🖱️ Essayer librement"], ["guide", "🧭 Visite guidée"]] as const).map(([m, t]) => (
              <button key={m} type="button" aria-pressed={mode === m} onClick={() => (m === mode ? null : recommencer(m))}
                className={cn("rounded-full px-4 py-2 text-sm font-semibold transition", mode === m ? "bg-orange-600 text-white shadow" : "text-muted-foreground hover:text-foreground")}>
                {t}
              </button>
            ))}
          </div>
          <button type="button" onClick={() => recommencer(mode)} className="rounded-full border px-3 py-2 text-sm font-semibold text-muted-foreground hover:text-foreground">↺ Réinitialiser</button>
        </div>

        {telephone ? (
          <div className="mx-auto w-full max-w-[350px]">
            <div className="relative h-[690px] max-h-[82vh] min-h-[560px] overflow-hidden rounded-[2.6rem] border-[11px] border-slate-900 bg-slate-900 shadow-2xl ring-1 ring-slate-700">
              <div className="flex h-7 items-center justify-between bg-white px-6 text-[11px] font-bold text-slate-900 dark:bg-slate-900 dark:text-white">
                <span>{heure}</span><span className="h-4 w-4 rounded-full bg-slate-900 dark:bg-black" aria-hidden="true" /><span aria-hidden="true">▂▄▆ 🔋</span>
              </div>
              <div className="h-[calc(100%-2.75rem)]">{ecran}</div>
              <div className="flex h-4 items-center justify-center bg-white dark:bg-slate-900"><span className="h-1 w-24 rounded-full bg-slate-800 dark:bg-slate-300" aria-hidden="true" /></div>
            </div>
          </div>
        ) : (
          <div className="mx-auto w-full max-w-5xl">
            <div className="overflow-hidden rounded-t-2xl border-[10px] border-b-[12px] border-slate-800 bg-slate-800 shadow-2xl">
              <div className="flex items-center gap-2 bg-slate-100 px-3 py-1 text-[10.5px] text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                <span aria-hidden="true">🎓</span> Gestion Scolaire Pro Plus <span className="ml-auto tracking-[0.5em]" aria-hidden="true">– ▢ ✕</span>
              </div>
              <div className="h-[600px] max-h-[78vh] min-h-[480px]">{ecran}</div>
            </div>
            <div className="mx-auto h-3 w-full rounded-b-2xl bg-gradient-to-b from-slate-300 to-slate-400 dark:from-slate-600 dark:to-slate-700" aria-hidden="true" />
          </div>
        )}
        <p className="mt-4 text-center text-xs text-muted-foreground">
          Démonstration avec des données fictives ({iconeDe("eleves")} EPP Les Palmiers) : rien n'est enregistré ni envoyé.
          Les {MENU.reduce((a, gr) => a + gr.entrees.length, 0)} modules du menu sont manipulables.
        </p>
      </div>
    </Ctx.Provider>
  );
}
