"use client";

// ── Démo interactive : un écran par module du logiciel ──
import { useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import {
  useDemo, TitrePage, Carte, Kpi, Bouton, Selecteur, Champ, Pastille, Avatar, Tableau, td,
  Feuille, EnteteDocument, Signatures,
} from "./demo-contexte";
import {
  moyenne, classement, rangDe, fmt, fcfa, rangTexte, initiales, age, dateFr, totalPoints, totalSur,
  heureMaintenant, type Eleve,
} from "./demo-donnees";

const nomComplet = (e: Eleve) => `${e.nom} ${e.prenoms}`;

function SelEleve({ value, onChange, id }: { value: string; onChange: (v: string) => void; id?: string }) {
  const { s } = useDemo();
  return (
    <Selecteur label="Élève" value={value} onChange={onChange} id={id} className="max-w-full">
      {s.eleves.map((e) => <option key={e.id} value={e.id}>{nomComplet(e)}</option>)}
    </Selecteur>
  );
}

function Barre({ pct, couleur = "bg-blue-600" }: { pct: number; couleur?: string }) {
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
      <div className={cn("h-full rounded-full transition-all", couleur)} style={{ width: Math.max(0, Math.min(100, pct)) + "%" }} />
    </div>
  );
}

// ── Principal ────────────────────────────────────────────────
function TableauDeBord() {
  const { s } = useDemo();
  const m = s.matieres;
  const cl = classement(s.eleves, m);
  const admis = s.eleves.filter((e) => moyenne(e, m) >= s.seuil);
  const moyClasse = s.eleves.reduce((a, e) => a + moyenne(e, m), 0) / Math.max(1, s.eleves.length);
  const pct = (admis.length / Math.max(1, s.eleves.length)) * 100;
  return (
    <>
      <TitrePage icone="📊">Tableau de bord</TitrePage>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Kpi icone="👥" valeur={s.eleves.length} libelle="Total élèves" />
        <Kpi icone="♂️" valeur={s.eleves.filter((e) => e.genre === "M").length} libelle="Garçons" />
        <Kpi icone="♀️" valeur={s.eleves.filter((e) => e.genre === "F").length} libelle="Filles" teinte="bg-pink-50 dark:bg-pink-950" />
        <Kpi icone="📊" valeur={fmt(moyClasse) + " /10"} libelle="Moy. composition 1" />
        <Kpi icone="🏆" valeur={cl[0]?.nom ?? "-"} libelle="Meilleur" teinte="bg-amber-50 dark:bg-amber-950" />
        <Kpi icone="📉" valeur={cl[cl.length - 1]?.nom ?? "-"} libelle="Plus faible" teinte="bg-red-50 dark:bg-red-950" />
        <Kpi icone="✔️" valeur={fmt(pct, 1) + " %"} libelle={`Admis (${admis.length}/${s.eleves.length})`} teinte="bg-emerald-50 dark:bg-emerald-950" />
        <Kpi icone="✅" valeur={s.eleves.filter((e) => e.matin).length} libelle="Présents ce matin" teinte="bg-emerald-50 dark:bg-emerald-950" />
      </div>
      <Carte className="mt-3">
        <p className="text-[12px] font-bold text-slate-800 dark:text-slate-100">Statistiques de réussite — Composition 1</p>
        <div className="mt-2 flex items-center gap-4">
          <div className="relative h-20 w-20 shrink-0 rounded-full" style={{ background: `conic-gradient(#16a34a ${pct * 3.6}deg, #dc2626 0)` }}>
            <div className="absolute inset-2.5 flex flex-col items-center justify-center rounded-full bg-white text-center dark:bg-slate-900">
              <span className="text-[13px] font-extrabold text-slate-900 dark:text-white">{fmt(pct, 0)} %</span>
              <span className="text-[8px] text-slate-500">réussite</span>
            </div>
          </div>
          <ul className="space-y-1 text-[11px] text-slate-700 dark:text-slate-300">
            <li><span className="mr-1 inline-block h-2.5 w-2.5 rounded-sm bg-green-600" />Admis : {admis.length} élève(s)</li>
            <li><span className="mr-1 inline-block h-2.5 w-2.5 rounded-sm bg-red-600" />Échecs : {s.eleves.length - admis.length} élève(s)</li>
            <li className="text-slate-500">Seuil d'admission : {fmt(s.seuil, 2)} /10</li>
          </ul>
        </div>
      </Carte>
    </>
  );
}

function Caisse() {
  const { s, maj, signal, toast, apercu } = useDemo();
  const [eleve, setEleve] = useState(s.eleves[1]?.id ?? "");
  const [montant, setMontant] = useState("5000");
  const total = s.paiements.reduce((a, p) => a + p.montant, 0);
  const dus = s.eleves.length * s.fraisScolarite;
  const payeDe = (id: string) => s.paiements.filter((p) => p.eleveId === id && p.motif.startsWith("Frais")).reduce((a, p) => a + p.montant, 0);
  const encaisser = () => {
    const n = Math.round(Number(montant));
    if (!n || n <= 0) { toast("Saisissez un montant valide."); return; }
    const e = s.eleves.find((x) => x.id === eleve);
    maj((d) => { d.paiements.unshift({ id: "p" + Date.now(), eleveId: eleve, montant: n, motif: "Frais de scolarité", date: "14/11/2026" }); },
      `Encaissement de ${fcfa(n)} — ${e ? nomComplet(e) : ""}`);
    signal("caisse:encaisse");
    apercu("Reçu de paiement", (
      <Feuille>
        <EnteteDocument titre="Reçu de paiement" />
        <p>Reçu de : <b>{e && nomComplet(e)}</b> ({s.classe})</p>
        <p>Motif : Frais de scolarité</p>
        <p className="mt-1 text-[13px] font-extrabold">Montant : {fcfa(n)}</p>
        <p>Reste à payer : {fcfa(Math.max(0, s.fraisScolarite - payeDe(eleve) - n))}</p>
        <Signatures />
      </Feuille>
    ));
  };
  return (
    <>
      <TitrePage icone="💰">Caisse</TitrePage>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        <Kpi icone="💵" valeur={fcfa(total)} libelle="Total des encaissements" teinte="bg-emerald-50 dark:bg-emerald-950" />
        <Kpi icone="📌" valeur={fcfa(Math.max(0, dus - s.paiements.filter((p) => p.motif.startsWith("Frais")).reduce((a, p) => a + p.montant, 0)))} libelle="Reste à encaisser" teinte="bg-orange-50 dark:bg-orange-950" />
        <Kpi icone="✅" valeur={`${s.eleves.filter((e) => payeDe(e.id) >= s.fraisScolarite).length} / ${s.eleves.length}`} libelle="Élèves à jour" />
      </div>
      <Carte className="mt-3">
        <p className="mb-2 text-[12px] font-bold text-slate-800 dark:text-slate-100">Nouvel encaissement</p>
        <div className="flex flex-wrap items-end gap-2">
          <SelEleve value={eleve} onChange={setEleve} />
          <Champ label="Montant (FCFA)" value={montant} onChange={setMontant} type="number" className="w-28" />
          <Bouton variante="vert" onClick={encaisser} id="caisse:encaisser">💵 Encaisser</Bouton>
        </div>
      </Carte>
      <Tableau className="mt-3" entetes={["Date", "Élève", "Motif", "Montant"]}>
        {s.paiements.map((p) => {
          const e = s.eleves.find((x) => x.id === p.eleveId);
          return (
            <tr key={p.id}>
              <td className={td}>{p.date}</td>
              <td className={td}>{e ? nomComplet(e) : "-"}</td>
              <td className={td}>{p.motif}</td>
              <td className={cn(td, "font-bold text-emerald-700 dark:text-emerald-400")}>{fcfa(p.montant)}</td>
            </tr>
          );
        })}
      </Tableau>
    </>
  );
}

function Renforcement() {
  const { s, maj } = useDemo();
  const inscrits = s.eleves.filter((e) => e.renfo);
  return (
    <>
      <TitrePage icone="📚">Cours de renforcement</TitrePage>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        <Kpi icone="👥" valeur={inscrits.length} libelle="Élèves inscrits" />
        <Kpi icone="💵" valeur={fcfa(inscrits.length * 2500)} libelle="Montant mensuel attendu" teinte="bg-emerald-50 dark:bg-emerald-950" />
        <Kpi icone="🕓" valeur="16 h – 17 h" libelle="Lundi à jeudi" />
      </div>
      <Tableau className="mt-3" entetes={["Élève", "Moyenne", "Inscription"]}>
        {s.eleves.map((e) => (
          <tr key={e.id}>
            <td className={td}><span className="flex items-center gap-1.5"><Avatar texte={initiales(e)} genre={e.genre} />{nomComplet(e)}</span></td>
            <td className={td}>{fmt(moyenne(e, s.matieres))}</td>
            <td className={td}>
              <button type="button" onClick={() => maj((d) => { const x = d.eleves.find((y) => y.id === e.id)!; x.renfo = !x.renfo; }, `${e.renfo ? "Désinscription" : "Inscription"} au renforcement — ${nomComplet(e)}`)}
                className={cn("rounded-md px-2 py-0.5 text-[10.5px] font-bold", e.renfo ? "bg-emerald-600 text-white" : "border border-slate-300 text-slate-600 dark:border-slate-600 dark:text-slate-300")}>
                {e.renfo ? "Inscrit ✓" : "Inscrire"}
              </button>
            </td>
          </tr>
        ))}
      </Tableau>
      <p className="mt-2 text-[10.5px] text-slate-500">Conseil : les élèves sous la moyenne sont signalés en priorité dans le logiciel.</p>
    </>
  );
}

function GestionEleves() {
  const { s, maj, signal, toast } = useDemo();
  const [q, setQ] = useState("");
  const [form, setForm] = useState(false);
  const [nom, setNom] = useState("");
  const [prenoms, setPrenoms] = useState("");
  const [genre, setGenre] = useState<"F" | "M">("F");
  const liste = s.eleves.filter((e) => nomComplet(e).toLowerCase().includes(q.trim().toLowerCase()));
  const ajouter = () => {
    if (!nom.trim() || !prenoms.trim()) { toast("Renseignez le nom et les prénoms."); return; }
    const n = nom.trim().toUpperCase();
    maj((d) => {
      d.eleves.push({
        id: "e" + Date.now(), matricule: null, nom: n, prenoms: prenoms.trim(), genre, naissance: "2015-05-10", lieu: "Abidjan",
        parent: "Parent de " + n, tel: "07 00 00 00 00", statut: "Nouveau",
        notes: Object.fromEntries(d.matieres.map((m) => [m.id, null])), matin: true, soir: true, absences: 0, renfo: false,
      });
    }, `Ajout de l'élève ${n} ${prenoms.trim()}`);
    signal("eleve:ajoute");
    toast(`${n} ${prenoms.trim()} a été ajouté(e) à la classe.`);
    setNom(""); setPrenoms(""); setForm(false);
  };
  return (
    <>
      <TitrePage icone="👥" droite={<Bouton onClick={() => { setForm(true); signal("eleve:formulaire"); }} id="eleve:ajouter">➕ Ajouter un élève</Bouton>}>Gestion des élèves</TitrePage>
      {form && (
        <Carte className="mb-3">
          <p className="mb-2 text-[12px] font-bold text-slate-800 dark:text-slate-100">Nouvel élève</p>
          <div className="grid gap-2 sm:grid-cols-3">
            <Champ label="Nom" value={nom} onChange={setNom} placeholder="KOFFI" />
            <Champ label="Prénoms" value={prenoms} onChange={setPrenoms} placeholder="Ange Marie" />
            <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300">Genre
              <Selecteur label="Genre" value={genre} onChange={(v) => setGenre(v as "F" | "M")} className="mt-0.5 block w-full">
                <option value="F">Fille</option><option value="M">Garçon</option>
              </Selecteur>
            </label>
          </div>
          <div className="mt-2 flex gap-2">
            <Bouton variante="vert" onClick={ajouter} id="eleve:enregistrer">💾 Enregistrer</Bouton>
            <Bouton variante="contour" onClick={() => setForm(false)}>Annuler</Bouton>
          </div>
        </Carte>
      )}
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <input aria-label="Rechercher un élève" value={q} onChange={(e) => setQ(e.target.value)} placeholder="🔍 Nom, prénom ou matricule"
          className="h-8 min-w-0 flex-1 rounded-lg border-2 border-blue-500/70 bg-white px-2 text-[12px] text-slate-900 outline-none dark:bg-slate-900 dark:text-white" />
        <Pastille ton="rouge">Filles {s.eleves.filter((e) => e.genre === "F").length}</Pastille>
        <Pastille>Garçons {s.eleves.filter((e) => e.genre === "M").length}</Pastille>
      </div>
      <Tableau entetes={["N°", "Matricule", "Nom et prénoms", "Genre", "Né(e) le", "Statut"]}>
        {liste.map((e, i) => (
          <tr key={e.id}>
            <td className={td}>{i + 1}</td>
            <td className={cn(td, "font-semibold text-blue-700 dark:text-blue-300")}>{e.matricule ?? <Pastille ton="orange">À attribuer</Pastille>}</td>
            <td className={td}><span className="flex items-center gap-1.5"><Avatar texte={initiales(e)} genre={e.genre} />{nomComplet(e)}</span></td>
            <td className={td}>{e.genre}</td>
            <td className={td}>{dateFr(e.naissance)}</td>
            <td className={td}><Pastille ton={e.statut === "Nouveau" ? "vert" : "orange"}>{e.statut}</Pastille></td>
          </tr>
        ))}
      </Tableau>
      {!liste.length && <p className="mt-2 text-[11px] text-slate-500">Aucun élève ne correspond à « {q} ».</p>}
    </>
  );
}

function ListeClasse() {
  const { s, apercu, signal } = useDemo();
  const tri = [...s.eleves].sort((a, b) => nomComplet(a).localeCompare(nomComplet(b)));
  const doc = (
    <Feuille>
      <EnteteDocument titre={`Liste de classe — ${s.classe}`} />
      <table className="w-full border-collapse text-[10px]">
        <thead><tr className="bg-slate-100">{["N°", "Matricule", "Nom et prénoms", "G", "Date de naissance"].map((h) => <th key={h} className="border border-slate-300 px-1 py-0.5 text-left">{h}</th>)}</tr></thead>
        <tbody>{tri.map((e, i) => (
          <tr key={e.id}><td className="border border-slate-300 px-1">{i + 1}</td><td className="border border-slate-300 px-1">{e.matricule ?? ""}</td><td className="border border-slate-300 px-1">{nomComplet(e)}</td><td className="border border-slate-300 px-1">{e.genre}</td><td className="border border-slate-300 px-1">{dateFr(e.naissance)}</td></tr>
        ))}</tbody>
      </table>
      <p className="mt-2 text-[10px]">Effectif : {s.eleves.length} — Filles : {s.eleves.filter((e) => e.genre === "F").length} — Garçons : {s.eleves.filter((e) => e.genre === "M").length}</p>
      <Signatures />
    </Feuille>
  );
  return (
    <>
      <TitrePage icone="📋" droite={<><Bouton onClick={() => { apercu("Liste de classe", doc); signal("imprime"); }}>🖨️ Imprimer</Bouton><Bouton variante="contour" onClick={() => apercu("Liste de classe (PDF)", doc)}>PDF</Bouton></>}>Liste de classe</TitrePage>
      <Tableau entetes={["N°", "Nom et prénoms", "Genre", "Âge", "Lieu de naissance"]}>
        {tri.map((e, i) => (
          <tr key={e.id}><td className={td}>{i + 1}</td><td className={td}>{nomComplet(e)}</td><td className={td}>{e.genre}</td><td className={td}>{age(e.naissance)} ans</td><td className={td}>{e.lieu}</td></tr>
        ))}
      </Tableau>
    </>
  );
}

function GroupeEps() {
  const { s, toast } = useDemo();
  const [formes, setFormes] = useState(false);
  const groupes = formes ? [
    { nom: "Groupe 1 — Filles", eleves: s.eleves.filter((e) => e.genre === "F") },
    { nom: "Groupe 2 — Garçons", eleves: s.eleves.filter((e) => e.genre === "M") },
  ] : [];
  return (
    <>
      <TitrePage icone="🏃" droite={<Bouton onClick={() => { setFormes(true); toast("Groupes formés selon le genre et l'âge."); }}>⚡ Former les groupes</Bouton>}>Groupe d'EPS</TitrePage>
      {!formes && <Carte><p className="text-[12px] text-slate-600 dark:text-slate-300">Le logiciel répartit les élèves en groupes d'EPS équilibrés (genre, âge). Cliquez sur « Former les groupes ».</p></Carte>}
      <div className="grid gap-2 sm:grid-cols-2">
        {groupes.map((gp) => (
          <Carte key={gp.nom}>
            <p className="mb-1.5 text-[12px] font-bold text-slate-800 dark:text-slate-100">{gp.nom} <Pastille>{gp.eleves.length}</Pastille></p>
            <ul className="space-y-1 text-[11.5px] text-slate-700 dark:text-slate-300">
              {gp.eleves.map((e) => <li key={e.id} className="flex items-center gap-1.5"><Avatar texte={initiales(e)} genre={e.genre} />{nomComplet(e)} <span className="text-slate-400">· {age(e.naissance)} ans</span></li>)}
            </ul>
          </Carte>
        ))}
      </div>
    </>
  );
}

function Recap() {
  const { s } = useDemo();
  const annees = [...new Set(s.eleves.map((e) => e.naissance.slice(0, 4)))].sort();
  return (
    <>
      <TitrePage icone="🧮">Tableau récapitulatif des effectifs</TitrePage>
      <Tableau entetes={["Année de naissance", "Filles", "Garçons", "Total"]}>
        {annees.map((a) => {
          const f = s.eleves.filter((e) => e.naissance.startsWith(a) && e.genre === "F").length;
          const g = s.eleves.filter((e) => e.naissance.startsWith(a) && e.genre === "M").length;
          return <tr key={a}><td className={td}>{a}</td><td className={td}>{f}</td><td className={td}>{g}</td><td className={cn(td, "font-bold")}>{f + g}</td></tr>;
        })}
        <tr className="bg-blue-50 font-bold dark:bg-blue-950"><td className={td}>Total</td><td className={td}>{s.eleves.filter((e) => e.genre === "F").length}</td><td className={td}>{s.eleves.filter((e) => e.genre === "M").length}</td><td className={td}>{s.eleves.length}</td></tr>
      </Tableau>
    </>
  );
}

// ── Académique ───────────────────────────────────────────────
function Matieres() {
  const { s, maj } = useDemo();
  const [nom, setNom] = useState("");
  return (
    <>
      <TitrePage icone="📘">Gestion des matières</TitrePage>
      <div className="grid gap-2 sm:grid-cols-2">
        {s.matieres.map((m) => (
          <div key={m.id} className="flex items-center gap-2 rounded-xl border-2 border-orange-400 bg-white p-2 dark:bg-slate-900">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-orange-100 text-[11px] font-extrabold text-orange-800 dark:bg-orange-900/60 dark:text-orange-200">{m.nom.slice(0, 2).toUpperCase()}</span>
            <span className="min-w-0 flex-1 truncate text-[12px] font-bold text-slate-800 dark:text-slate-100">{m.nom}</span>
            <label className="text-[10.5px] text-slate-500">sur
              <input type="number" min={5} max={100} value={m.sur} aria-label={`Barème de ${m.nom}`}
                onChange={(e) => { const v = Math.max(1, Math.min(100, Number(e.target.value) || 1)); maj((d) => { d.matieres.find((x) => x.id === m.id)!.sur = v; }); }}
                className="ml-1 h-7 w-12 rounded-md border border-slate-300 bg-white text-center text-[12px] text-slate-900 dark:border-slate-600 dark:bg-slate-950 dark:text-white" />
            </label>
          </div>
        ))}
      </div>
      <Carte className="mt-3">
        <div className="flex flex-wrap items-end gap-2">
          <Champ label="Nouvelle matière" value={nom} onChange={setNom} placeholder="Dessin" className="min-w-0 flex-1" />
          <Bouton onClick={() => { if (!nom.trim()) return; const id = "m" + Date.now(); maj((d) => { d.matieres.push({ id, nom: nom.trim(), sur: 10 }); d.eleves.forEach((e) => { e.notes[id] = null; }); }, `Ajout de la matière ${nom.trim()}`); setNom(""); }}>➕ Ajouter</Bouton>
        </div>
        <p className="mt-2 text-[10.5px] text-slate-500">Total des barèmes : {totalSur(s.matieres)} points — la moyenne est ramenée sur 10.</p>
      </Carte>
    </>
  );
}

function SaisieNotes() {
  const { s, maj, signal, g } = useDemo();
  const [mat, setMat] = useState(s.matieres[0]?.id ?? "");
  const m = s.matieres.find((x) => x.id === mat) ?? s.matieres[0];
  if (!m) return null;
  return (
    <>
      <TitrePage icone="📝">Saisie des notes</TitrePage>
      <div className="mb-2 flex flex-wrap gap-2">
        <Selecteur label="Matière" value={m.id} onChange={setMat}>{s.matieres.map((x) => <option key={x.id} value={x.id}>{x.nom} (/{x.sur})</option>)}</Selecteur>
        <Selecteur label="Composition" value="c1" onChange={() => {}}><option value="c1">Composition 1</option></Selecteur>
      </div>
      <Tableau entetes={["Élève", `Note /${m.sur}`, "Moy. générale", "Rang"]}>
        {s.eleves.map((e, i) => {
          const n = e.notes[m.id];
          return (
            <tr key={e.id}>
              <td className={td}><span className="flex items-center gap-1.5"><Avatar texte={initiales(e)} genre={e.genre} />{nomComplet(e)}</span></td>
              <td className={td}>
                <input
                  aria-label={`Note de ${nomComplet(e)}`}
                  inputMode="decimal"
                  defaultValue={n === null || n === undefined ? "" : String(n).replace(".", ",")}
                  key={m.id + e.id}
                  onChange={(ev) => {
                    const brut = ev.target.value.replace(",", ".").trim();
                    const v = brut === "" ? null : Number(brut);
                    if (v !== null && (Number.isNaN(v) || v < 0 || v > m.sur)) { ev.target.classList.add("ring-2", "ring-red-500"); return; }
                    ev.target.classList.remove("ring-2", "ring-red-500");
                    maj((d) => { d.eleves.find((x) => x.id === e.id)!.notes[m.id] = v; });
                    signal("note:modifiee");
                  }}
                  onBlur={(ev) => { if (ev.target.value) maj(() => {}, `Note modifiée : ${nomComplet(e)} — ${m.nom} = ${ev.target.value}/${m.sur}`); }}
                  className={cn("h-7 w-14 rounded-md border-2 border-orange-400 bg-white text-center text-[12px] font-bold text-slate-900 outline-none focus:border-blue-500 dark:bg-slate-950 dark:text-white", i === 0 && g("note:premiere"))}
                />
              </td>
              <td className={cn(td, "font-extrabold text-blue-700 dark:text-blue-300")}>{fmt(moyenne(e, s.matieres))}</td>
              <td className={td}>{rangTexte(rangDe(e.id, s.eleves, s.matieres))}</td>
            </tr>
          );
        })}
      </Tableau>
      <p className="mt-2 text-[10.5px] text-slate-500">Changez une note : la moyenne et le rang se recalculent aussitôt.</p>
    </>
  );
}

function Rangement() {
  const { s, apercu, signal } = useDemo();
  const [alpha, setAlpha] = useState(false);
  const cl = classement(s.eleves, s.matieres);
  const liste = alpha ? [...s.eleves].sort((a, b) => nomComplet(a).localeCompare(nomComplet(b))) : cl;
  return (
    <>
      <TitrePage icone="🏆" droite={<Bouton onClick={() => { signal("imprime"); apercu("Rangement", (
        <Feuille><EnteteDocument titre={`Rangement — ${s.classe} — Composition 1`} />
          <table className="w-full border-collapse text-[10px]"><tbody>{cl.map((e, i) => <tr key={e.id}><td className="border border-slate-300 px-1">{rangTexte(i + 1)}</td><td className="border border-slate-300 px-1">{nomComplet(e)}</td><td className="border border-slate-300 px-1 text-right">{fmt(moyenne(e, s.matieres))}</td></tr>)}</tbody></table>
          <Signatures /></Feuille>)); }}>🖨️ Imprimer</Bouton>}>Rangement</TitrePage>
      <div className="mb-2 flex gap-1.5">
        <button type="button" onClick={() => setAlpha(false)} className={cn("rounded-full px-3 py-1 text-[11px] font-bold", !alpha ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300")}>Par rang</button>
        <button type="button" onClick={() => setAlpha(true)} className={cn("rounded-full px-3 py-1 text-[11px] font-bold", alpha ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300")}>Par ordre alphabétique</button>
      </div>
      <Tableau entetes={["Rang", "Élève", ...s.matieres.map((m) => m.nom.slice(0, 5) + "."), "Total", "Moy."]}>
        {liste.map((e) => {
          const r = rangDe(e.id, s.eleves, s.matieres);
          return (
            <tr key={e.id} className={r === 1 ? "bg-amber-50 dark:bg-amber-950/40" : ""}>
              <td className={cn(td, "font-bold")}>{r <= 3 ? ["🥇", "🥈", "🥉"][r - 1] : rangTexte(r)}</td>
              <td className={td}>{nomComplet(e)}</td>
              {s.matieres.map((m) => <td key={m.id} className={td}>{e.notes[m.id] ?? "-"}</td>)}
              <td className={td}>{totalPoints(e, s.matieres)}</td>
              <td className={cn(td, "font-extrabold", moyenne(e, s.matieres) >= s.seuil ? "text-emerald-700 dark:text-emerald-400" : "text-red-600 dark:text-red-400")}>{fmt(moyenne(e, s.matieres))}</td>
            </tr>
          );
        })}
      </Tableau>
    </>
  );
}

function DocBulletin({ e }: { e: Eleve }) {
  const { s } = useDemo();
  const moy = moyenne(e, s.matieres);
  const couleur = e.genre === "F" ? s.couleurFilles : s.couleurGarcons;
  return (
    <Feuille>
      <div style={{ borderTop: `6px solid ${couleur}` }} className="pt-2">
        <EnteteDocument titre="Bulletin de notes — Composition 1" />
        <div className="mb-2 grid grid-cols-2 gap-1 text-[10px]">
          <p>Nom et prénoms : <b>{nomComplet(e)}</b></p><p>Classe : <b>{s.classe}</b></p>
          <p>Matricule : <b>{e.matricule ?? "-"}</b></p><p>Effectif : <b>{s.eleves.length}</b></p>
        </div>
        <table className="w-full border-collapse text-[10px]">
          <thead><tr style={{ background: couleur + "22" }}>{["Matières", "Note", "Sur", "Appréciation"].map((h) => <th key={h} className="border border-slate-300 px-1 py-0.5 text-left">{h}</th>)}</tr></thead>
          <tbody>{s.matieres.map((m) => {
            const n = e.notes[m.id] ?? 0; const r = n / m.sur;
            return <tr key={m.id}><td className="border border-slate-300 px-1">{m.nom}</td><td className="border border-slate-300 px-1 font-bold">{e.notes[m.id] ?? "-"}</td><td className="border border-slate-300 px-1">{m.sur}</td><td className="border border-slate-300 px-1">{r >= 0.8 ? "Très bien" : r >= 0.6 ? "Bien" : r >= 0.5 ? "Passable" : "Insuffisant"}</td></tr>;
          })}</tbody>
        </table>
        <div className="mt-2 flex flex-wrap justify-between gap-1 rounded px-2 py-1 text-[10.5px] font-extrabold" style={{ background: couleur + "1a" }}>
          <span>Moyenne : {fmt(moy)} /10</span><span>Rang : {rangTexte(rangDe(e.id, s.eleves, s.matieres))} / {s.eleves.length}</span>
          <span>{moy >= s.seuil ? "Admis(e)" : "Non admis(e)"}</span>
        </div>
        <Signatures />
      </div>
    </Feuille>
  );
}

function Bulletins() {
  const { s, apercu, signal } = useDemo();
  const [id, setId] = useState(s.eleves[0]?.id ?? "");
  const e = s.eleves.find((x) => x.id === id) ?? s.eleves[0];
  if (!e) return null;
  return (
    <>
      <TitrePage icone="📄">Bulletins scolaires</TitrePage>
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <SelEleve value={e.id} onChange={(v) => { setId(v); signal("bulletin:eleve"); }} />
        <Bouton variante="vert" id="bulletin:imprimer" onClick={() => { apercu(`Bulletin — ${nomComplet(e)}`, <DocBulletin e={e} />); signal("bulletin:imprime"); }}>🖨️ Imprimer le bulletin</Bouton>
        <Bouton variante="contour" onClick={() => apercu(`Les ${s.eleves.length} bulletins`, <div className="space-y-3">{s.eleves.map((x) => <DocBulletin key={x.id} e={x} />)}</div>)}>Tous les bulletins ({s.eleves.length})</Bouton>
      </div>
      <div className="origin-top"><DocBulletin e={e} /></div>
    </>
  );
}

function Parents() {
  const { s, toast } = useDemo();
  return (
    <>
      <TitrePage icone="📞">Contacts parents</TitrePage>
      <Tableau entetes={["Élève", "Parent / tuteur", "Téléphone", ""]}>
        {s.eleves.map((e) => (
          <tr key={e.id}>
            <td className={td}>{nomComplet(e)}</td><td className={td}>{e.parent}</td><td className={cn(td, "font-semibold")}>{e.tel}</td>
            <td className={td}><button type="button" onClick={() => toast(`Démo : dans le logiciel, ce bouton prépare un SMS pour ${e.parent}.`)} className="rounded-md bg-emerald-600 px-2 py-0.5 text-[10.5px] font-bold text-white">✉️ SMS</button></td>
          </tr>
        ))}
      </Tableau>
    </>
  );
}

// ── Pédagogie ────────────────────────────────────────────────
function ProgressionEcran() {
  const { s, maj } = useDemo();
  return (
    <>
      <TitrePage icone="📈">Progression — {s.classe}</TitrePage>
      <div className="space-y-2">
        {s.progression.map((p, i) => (
          <Carte key={p.matiere}>
            <div className="mb-1.5 flex items-center gap-2 text-[12px]">
              <span className="font-bold text-slate-800 dark:text-slate-100">{p.matiere}</span>
              <span className="ml-auto text-slate-500">{p.faites} / {p.total} leçons</span>
              <Bouton variante="contour" className="px-2 py-0.5" onClick={() => maj((d) => { const x = d.progression[i]; if (x.faites < x.total) x.faites++; }, `Leçon faite en ${p.matiere}`)}>+1 leçon faite</Bouton>
            </div>
            <Barre pct={(p.faites / p.total) * 100} couleur={p.faites / p.total < 0.35 ? "bg-orange-500" : "bg-emerald-600"} />
          </Carte>
        ))}
      </div>
    </>
  );
}

function Fiches() {
  const { s, maj, apercu } = useDemo();
  const [lecon, setLecon] = useState("");
  return (
    <>
      <TitrePage icone="🗂️">Fiches de séance</TitrePage>
      <Carte className="mb-3">
        <div className="flex flex-wrap items-end gap-2">
          <Champ label="Nouvelle fiche — leçon" value={lecon} onChange={setLecon} placeholder="Les nombres décimaux" className="min-w-0 flex-1" />
          <Bouton onClick={() => { if (!lecon.trim()) return; maj((d) => { d.fiches.unshift({ id: "f" + Date.now(), matiere: "Mathématiques", lecon: lecon.trim(), seance: "Séance 1", statut: "Brouillon" }); }, `Fiche créée : ${lecon.trim()}`); setLecon(""); }}>➕ Créer</Bouton>
        </div>
      </Carte>
      <div className="grid gap-2 sm:grid-cols-2">
        {s.fiches.map((f) => (
          <Carte key={f.id}>
            <div className="flex items-center gap-2"><Pastille ton={f.statut === "Validée" ? "vert" : "orange"}>{f.statut}</Pastille><span className="text-[10.5px] text-slate-500">{f.matiere}</span></div>
            <p className="mt-1 text-[12px] font-bold text-slate-800 dark:text-slate-100">{f.lecon}</p>
            <p className="text-[11px] text-slate-600 dark:text-slate-400">{f.seance}</p>
            <div className="mt-2 flex gap-1.5">
              <Bouton variante="contour" className="px-2 py-0.5" onClick={() => apercu("Fiche de séance", (
                <Feuille><EnteteDocument titre="Fiche de séance" />
                  <p>Matière : <b>{f.matiere}</b> — Classe : <b>{s.classe}</b></p><p>Leçon : <b>{f.lecon}</b></p><p>Séance : {f.seance}</p>
                  <table className="mt-2 w-full border-collapse text-[10px]"><thead><tr className="bg-slate-100">{["Étapes", "Activités du maître", "Activités des élèves"].map((h) => <th key={h} className="border border-slate-300 px-1 text-left">{h}</th>)}</tr></thead>
                    <tbody>{["Présentation", "Développement", "Évaluation"].map((et) => <tr key={et}><td className="border border-slate-300 px-1">{et}</td><td className="h-6 border border-slate-300" /><td className="border border-slate-300" /></tr>)}</tbody></table>
                </Feuille>))}>Ouvrir</Bouton>
              {f.statut === "Brouillon" && <Bouton variante="vert" className="px-2 py-0.5" onClick={() => maj((d) => { d.fiches.find((x) => x.id === f.id)!.statut = "Validée"; }, `Fiche validée : ${f.lecon}`)}>Valider</Bouton>}
            </div>
          </Carte>
        ))}
      </div>
    </>
  );
}

// ── Édition ──────────────────────────────────────────────────
function Documents() {
  const { s, apercu, signal } = useDemo();
  const [id, setId] = useState(s.eleves[0]?.id ?? "");
  const [type, setType] = useState("scolarite");
  const e = s.eleves.find((x) => x.id === id) ?? s.eleves[0];
  const titres: Record<string, string> = { scolarite: "Certificat de scolarité", frequentation: "Certificat de fréquentation", fiche: "Fiche scolaire" };
  if (!e) return null;
  return (
    <>
      <TitrePage icone="🎓">Documents de l'élève</TitrePage>
      <Carte>
        <div className="flex flex-wrap items-center gap-2">
          <SelEleve value={e.id} onChange={setId} />
          <Selecteur label="Document" value={type} onChange={setType}>{Object.entries(titres).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</Selecteur>
          <Bouton variante="vert" onClick={() => { signal("imprime"); apercu(titres[type], (
            <Feuille><EnteteDocument titre={titres[type]} />
              <p className="leading-relaxed">Je soussigné, directeur de l'{s.ecole}, certifie que l'élève <b>{nomComplet(e)}</b>, né(e) le <b>{dateFr(e.naissance)}</b> à <b>{e.lieu}</b>, matricule <b>{e.matricule ?? "-"}</b>, {type === "frequentation" ? "fréquente régulièrement" : "est inscrit(e)"} en classe de <b>{s.classe}</b> au titre de l'année scolaire {s.annee}.</p>
              <p className="mt-2">En foi de quoi, le présent document lui est délivré pour servir et valoir ce que de droit.</p>
              <p className="mt-3 text-right">Fait à Abidjan, le 14/11/2026</p><Signatures />
            </Feuille>)); }}>🖨️ Établir le document</Bouton>
        </div>
      </Carte>
    </>
  );
}

function Statistiques() {
  const { s } = useDemo();
  const groupe = (gn: "F" | "M") => {
    const l = s.eleves.filter((e) => e.genre === gn);
    const a = l.filter((e) => moyenne(e, s.matieres) >= s.seuil).length;
    return { n: l.length, a, pct: l.length ? (a / l.length) * 100 : 0 };
  };
  const f = groupe("F"), m = groupe("M");
  return (
    <>
      <TitrePage icone="📉">Statistiques — Composition 1</TitrePage>
      <div className="grid gap-2 sm:grid-cols-2">
        {[["Filles", f, "bg-pink-500"], ["Garçons", m, "bg-blue-600"]].map(([nom, v, c]) => {
          const x = v as typeof f;
          return (
            <Carte key={nom as string}>
              <p className="text-[12px] font-bold text-slate-800 dark:text-slate-100">{nom as string} : {x.a} admis sur {x.n}</p>
              <div className="mt-2"><Barre pct={x.pct} couleur={c as string} /></div>
              <p className="mt-1 text-[11px] text-slate-500">{fmt(x.pct, 1)} % de réussite</p>
            </Carte>
          );
        })}
      </div>
      <Carte className="mt-2">
        <p className="mb-2 text-[12px] font-bold text-slate-800 dark:text-slate-100">Moyenne de la classe par matière</p>
        {s.matieres.map((mt) => {
          const vals = s.eleves.map((e) => e.notes[mt.id]).filter((n): n is number => n !== null && n !== undefined);
          const p = vals.length ? (vals.reduce((a, b) => a + b, 0) / vals.length / mt.sur) * 100 : 0;
          return <div key={mt.id} className="mb-1.5 grid grid-cols-[110px_1fr_40px] items-center gap-2 text-[11px] text-slate-700 dark:text-slate-300"><span className="truncate">{mt.nom}</span><Barre pct={p} /><span className="text-right font-bold">{fmt(p / 10, 1)}</span></div>;
        })}
      </Carte>
    </>
  );
}

function Dossier() {
  const { s } = useDemo();
  const [id, setId] = useState(s.eleves[0]?.id ?? "");
  const e = s.eleves.find((x) => x.id === id) ?? s.eleves[0];
  if (!e) return null;
  const lignes: [string, ReactNode][] = [
    ["Matricule", e.matricule ?? "À attribuer"], ["Né(e) le", `${dateFr(e.naissance)} à ${e.lieu}`], ["Genre", e.genre === "F" ? "Fille" : "Garçon"],
    ["Statut", e.statut], ["Parent / tuteur", e.parent], ["Téléphone", e.tel], ["Absences", e.absences + " demi-journée(s)"],
    ["Moyenne actuelle", fmt(moyenne(e, s.matieres)) + " /10"], ["Rang", rangTexte(rangDe(e.id, s.eleves, s.matieres))],
  ];
  return (
    <>
      <TitrePage icone="🗃️">Dossier individuel élève</TitrePage>
      <div className="mb-2"><SelEleve value={e.id} onChange={setId} /></div>
      <Carte>
        <div className="mb-2 flex items-center gap-2"><Avatar texte={initiales(e)} genre={e.genre} /><span className="text-[13px] font-extrabold text-slate-900 dark:text-white">{nomComplet(e)}</span></div>
        <dl className="grid gap-x-4 gap-y-1 text-[11.5px] sm:grid-cols-2">
          {lignes.map(([k, v]) => <div key={k} className="flex gap-1"><dt className="text-slate-500">{k} :</dt><dd className="font-semibold text-slate-800 dark:text-slate-200">{v}</dd></div>)}
        </dl>
      </Carte>
    </>
  );
}

function DossierEnseignant() {
  const { s } = useDemo();
  return (
    <>
      <TitrePage icone="👨‍🏫">Dossier individuel enseignant</TitrePage>
      <Carte>
        <div className="mb-2 flex items-center gap-2"><span className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-[11px] font-extrabold text-blue-800">TS</span><span className="text-[13px] font-extrabold text-slate-900 dark:text-white">{s.enseignant}</span></div>
        <dl className="grid gap-x-4 gap-y-1 text-[11.5px] sm:grid-cols-2">
          {[["Fonction", "Instituteur ordinaire"], ["Classe tenue", s.classe], ["Matricule enseignant", "345 678-K"], ["Prise de service", "01/10/2019"], ["Diplôme", "CAP-CEAP"], ["Téléphone", "07 11 22 33 44"]].map(([k, v]) => (
            <div key={k} className="flex gap-1"><dt className="text-slate-500">{k} :</dt><dd className="font-semibold text-slate-800 dark:text-slate-200">{v}</dd></div>
          ))}
        </dl>
      </Carte>
    </>
  );
}

function Classeur() {
  const { s, toast } = useDemo();
  const docs = [
    ["📄", "Bulletins — Composition 1", `${s.eleves.length} documents`], ["📋", "Liste de classe", "1 document"], ["🏆", "Rangement — Composition 1", "1 document"],
    ["🎓", "Certificats de scolarité", "3 documents"], ["💰", "Reçus de caisse", `${s.paiements.length} documents`], ["📑", "Rapport de fin d'année", "brouillon"],
  ];
  return (
    <>
      <TitrePage icone="🗄️">Classeur</TitrePage>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {docs.map(([i, t, n]) => (
          <button key={t} type="button" onClick={() => toast(`Démo : « ${t} » s'ouvrirait ici, prêt à réimprimer.`)} className="rounded-xl border-2 border-blue-500/70 bg-white p-2.5 text-left transition hover:bg-blue-50 dark:bg-slate-900 dark:hover:bg-slate-800">
            <span className="text-[18px]" aria-hidden="true">{i}</span>
            <span className="mt-1 block text-[11.5px] font-bold text-slate-800 dark:text-slate-100">{t}</span>
            <span className="block text-[10px] text-slate-500">{n}</span>
          </button>
        ))}
      </div>
    </>
  );
}

function Rapport() {
  const { s, apercu, signal } = useDemo();
  const [onglet, setOnglet] = useState<"res" | "eff">("res");
  const admis = s.eleves.filter((e) => moyenne(e, s.matieres) >= s.seuil);
  const ligne = (gn: "F" | "M") => [s.eleves.filter((e) => e.genre === gn).length, admis.filter((e) => e.genre === gn).length];
  const [fI, fA] = ligne("F"), [gI, gA] = ligne("M");
  const tableau = (
    <Tableau entetes={["", "Inscrits", "Admis", "Taux"]}>
      <tr><td className={td}>Filles</td><td className={td}>{fI}</td><td className={td}>{fA}</td><td className={td}>{fmt(fI ? (fA / fI) * 100 : 0, 1)} %</td></tr>
      <tr><td className={td}>Garçons</td><td className={td}>{gI}</td><td className={td}>{gA}</td><td className={td}>{fmt(gI ? (gA / gI) * 100 : 0, 1)} %</td></tr>
      <tr className="font-bold"><td className={td}>Total</td><td className={td}>{fI + gI}</td><td className={td}>{fA + gA}</td><td className={td}>{fmt(((fA + gA) / Math.max(1, fI + gI)) * 100, 1)} %</td></tr>
    </Tableau>
  );
  return (
    <>
      <TitrePage icone="📑" droite={<Bouton onClick={() => { signal("imprime"); apercu("Rapport de fin d'année", <Feuille><EnteteDocument titre="Rapport de fin d'année" /><p className="mb-1 font-bold">Résultats de fin d'année — {s.classe}</p>{tableau}<Signatures /></Feuille>); }}>🖨️ Imprimer</Bouton>}>Rapport de fin d'année</TitrePage>
      <div className="mb-2 flex gap-1.5">
        {[["res", "Résultats"], ["eff", "Effectifs"]].map(([k, v]) => <button key={k} type="button" onClick={() => setOnglet(k as "res" | "eff")} className={cn("rounded-full px-3 py-1 text-[11px] font-bold", onglet === k ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300")}>{v}</button>)}
      </div>
      {onglet === "res" ? tableau : <Recap />}
    </>
  );
}

function RegistreMatricule() {
  const { s, maj, toast } = useDemo();
  const nums = s.eleves.map((e) => Number(e.matricule)).filter(Boolean);
  const suivant = String((nums.length ? Math.max(...nums) : 2026140) + 1);
  const sans = s.eleves.filter((e) => !e.matricule);
  return (
    <>
      <TitrePage icone="🔢">Registre matricule</TitrePage>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        <Kpi icone="🔢" valeur={String(Math.max(...nums, 0))} libelle="Dernier matricule" />
        <Kpi icone="➡️" valeur={suivant} libelle="Matricule suivant" teinte="bg-emerald-50 dark:bg-emerald-950" />
        <Kpi icone="⏳" valeur={sans.length} libelle="Élèves sans matricule" teinte="bg-orange-50 dark:bg-orange-950" />
      </div>
      <div className="my-2">
        <Bouton variante="vert" disabled={!sans.length} onClick={() => { maj((d) => { let n = Number(suivant); d.eleves.filter((e) => !e.matricule).forEach((e) => { e.matricule = String(n++); }); }, `Attribution de ${sans.length} matricule(s)`); toast(`${sans.length} matricule(s) attribué(s).`); }}>
          Attribuer les matricules ({sans.length})
        </Bouton>
        {!sans.length && <span className="ml-2 text-[10.5px] text-slate-500">Astuce : ajoutez un élève dans « Gestion des élèves », puis revenez ici.</span>}
      </div>
      <Tableau entetes={["Matricule", "Nom et prénoms", "Né(e) le"]}>
        {[...s.eleves].sort((a, b) => (a.matricule ?? "9").localeCompare(b.matricule ?? "9")).map((e) => (
          <tr key={e.id}><td className={cn(td, "font-bold text-blue-700 dark:text-blue-300")}>{e.matricule ?? "—"}</td><td className={td}>{nomComplet(e)}</td><td className={td}>{dateFr(e.naissance)}</td></tr>
        ))}
      </Tableau>
    </>
  );
}

// ── Assiduité ────────────────────────────────────────────────
function RegistreAppel() {
  const { s, maj, signal, g } = useDemo();
  const bascule = (id: string, cle: "matin" | "soir") => {
    const e = s.eleves.find((x) => x.id === id)!;
    maj((d) => { const x = d.eleves.find((y) => y.id === id)!; x[cle] = !x[cle]; if (!x[cle]) x.absences++; else x.absences = Math.max(0, x.absences - 1); },
      `${e[cle] ? "Absence" : "Présence"} (${cle === "matin" ? "matin" : "après-midi"}) — ${nomComplet(e)}`);
    signal("appel:modifie");
  };
  const pres = s.eleves.filter((e) => e.matin).length;
  return (
    <>
      <TitrePage icone="✅">Registre d'appel</TitrePage>
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <Selecteur label="Jour" value="v" onChange={() => {}}><option value="v">Vendredi 14 novembre 2026</option></Selecteur>
        <Bouton variante="vert" onClick={() => maj((d) => d.eleves.forEach((e) => { e.matin = true; e.soir = true; }), "Appel : tous présents")}>✓ Tous présents</Bouton>
        <Pastille ton={pres === s.eleves.length ? "vert" : "orange"}>{pres} présent(s) / {s.eleves.length}</Pastille>
      </div>
      <Tableau entetes={["Élève", "Matin", "Après-midi"]}>
        {s.eleves.map((e, i) => (
          <tr key={e.id}>
            <td className={td}><span className="flex items-center gap-1.5"><Avatar texte={initiales(e)} genre={e.genre} />{nomComplet(e)}</span></td>
            {(["matin", "soir"] as const).map((k) => (
              <td key={k} className={td}>
                <button type="button" onClick={() => bascule(e.id, k)} aria-label={`${nomComplet(e)} ${k === "matin" ? "matin" : "après-midi"}`}
                  className={cn("h-7 w-9 rounded-lg text-[12px] font-extrabold text-white", e[k] ? "bg-emerald-600" : "bg-red-600", i === 1 && k === "matin" && g("appel:premier"))}>
                  {e[k] ? "P" : "A"}
                </button>
              </td>
            ))}
          </tr>
        ))}
      </Tableau>
    </>
  );
}

function Assiduite() {
  const { s } = useDemo();
  const jours = 40;
  return (
    <>
      <TitrePage icone="📆">Assiduité — octobre-novembre</TitrePage>
      <Tableau entetes={["Élève", "Absences", "Taux de présence", ""]}>
        {[...s.eleves].sort((a, b) => b.absences - a.absences).map((e) => {
          const t = ((jours - e.absences) / jours) * 100;
          return (
            <tr key={e.id}>
              <td className={td}>{nomComplet(e)}</td><td className={td}>{e.absences}</td>
              <td className={cn(td, "w-40")}><Barre pct={t} couleur={t < 90 ? "bg-orange-500" : "bg-emerald-600"} /></td>
              <td className={td}>{t < 90 ? <Pastille ton="orange">À suivre</Pastille> : <Pastille ton="vert">{fmt(t, 0)} %</Pastille>}</td>
            </tr>
          );
        })}
      </Tableau>
    </>
  );
}

// ── Système ──────────────────────────────────────────────────
function Admission() {
  const { s, maj } = useDemo();
  const admis = s.eleves.filter((e) => moyenne(e, s.matieres) >= s.seuil).length;
  return (
    <>
      <TitrePage icone="⚖️">Admission exceptionnelle</TitrePage>
      <Carte>
        <label className="block text-[12px] font-bold text-slate-800 dark:text-slate-100">
          Seuil d'admission : <span className="text-blue-700 dark:text-blue-300">{fmt(s.seuil, 2)} /10</span>
          <input type="range" min={4} max={6} step={0.25} value={s.seuil} aria-label="Seuil d'admission"
            onChange={(e) => maj((d) => { d.seuil = Number(e.target.value); })} onMouseUp={() => maj(() => {}, `Seuil d'admission fixé à ${fmt(s.seuil)}`)}
            className="mt-2 block w-full accent-orange-500" />
        </label>
        <p className="mt-2 text-[12px] text-slate-700 dark:text-slate-300">Avec ce seuil : <b>{admis}</b> admis sur {s.eleves.length}.</p>
      </Carte>
      <Tableau className="mt-2" entetes={["Élève", "Moyenne", "Décision"]}>
        {classement(s.eleves, s.matieres).map((e) => {
          const m = moyenne(e, s.matieres);
          return <tr key={e.id}><td className={td}>{nomComplet(e)}</td><td className={td}>{fmt(m)}</td><td className={td}>{m >= s.seuil ? <Pastille ton="vert">Admis</Pastille> : <Pastille ton="rouge">Non admis</Pastille>}</td></tr>;
        })}
      </Tableau>
    </>
  );
}

function Conversion() {
  const { toast } = useDemo();
  const [fait, setFait] = useState<string[]>([]);
  return (
    <>
      <TitrePage icone="🔄">Convertisseur de fichiers</TitrePage>
      <div className="grid gap-2 sm:grid-cols-3">
        {["Excel → liste d'élèves", "PDF → image", "Image → PDF"].map((t) => (
          <button key={t} type="button" onClick={() => { setFait((f) => [t, ...f].slice(0, 4)); toast(`Démo : « ${t} » converti.`); }}
            className="rounded-xl border-2 border-dashed border-orange-400 bg-orange-50/60 p-3 text-[12px] font-bold text-orange-900 transition hover:bg-orange-100 dark:bg-orange-950/30 dark:text-orange-200">
            ⬆️ {t}
          </button>
        ))}
      </div>
      {fait.length > 0 && <Carte className="mt-2"><p className="mb-1 text-[11.5px] font-bold text-slate-800 dark:text-slate-100">Conversions faites</p><ul className="text-[11px] text-slate-600 dark:text-slate-300">{fait.map((f, i) => <li key={i}>✔️ {f}</li>)}</ul></Carte>}
    </>
  );
}

function Parametres() {
  const { s, maj } = useDemo();
  return (
    <>
      <TitrePage icone="⚙️">Paramètres</TitrePage>
      <Carte>
        <div className="grid gap-2 sm:grid-cols-2">
          <Champ label="Nom de l'école (s'affiche en haut et sur les documents)" value={s.ecole} onChange={(v) => maj((d) => { d.ecole = v.slice(0, 40); })} />
          <Champ label="Année scolaire" value={s.annee} onChange={(v) => maj((d) => { d.annee = v.slice(0, 9); })} />
          <Champ label="Frais de scolarité (FCFA)" type="number" value={String(s.fraisScolarite)} onChange={(v) => maj((d) => { d.fraisScolarite = Math.max(0, Number(v) || 0); })} />
          <div className="flex flex-wrap items-end gap-3 text-[11px] font-semibold text-slate-600 dark:text-slate-300">
            <label className="flex items-center gap-1">Couleur filles <input type="color" value={s.couleurFilles} onChange={(e) => maj((d) => { d.couleurFilles = e.target.value; })} className="h-7 w-9 cursor-pointer rounded border-0" /></label>
            <label className="flex items-center gap-1">Couleur garçons <input type="color" value={s.couleurGarcons} onChange={(e) => maj((d) => { d.couleurGarcons = e.target.value; })} className="h-7 w-9 cursor-pointer rounded border-0" /></label>
          </div>
        </div>
        <p className="mt-2 text-[10.5px] text-slate-500">Changez le nom de l'école : il change aussitôt dans la barre du haut et sur les bulletins.</p>
      </Carte>
    </>
  );
}

function Licences() {
  const { toast } = useDemo();
  return (
    <>
      <TitrePage icone="🔑">Gestion des licences</TitrePage>
      <Carte>
        <div className="flex flex-wrap items-center gap-2"><Pastille ton="vert">Licence active</Pastille><span className="text-[12px] font-bold text-slate-800 dark:text-slate-100">Licence 12 mois — 1 poste</span></div>
        <p className="mt-1 text-[11.5px] text-slate-600 dark:text-slate-300">Valable jusqu'au 13/11/2027 · Clé : GSPP-••••-••••-DEMO</p>
        <div className="mt-2"><Barre pct={4} couleur="bg-emerald-600" /><p className="mt-1 text-[10.5px] text-slate-500">364 jours restants</p></div>
        <Bouton className="mt-2" variante="contour" onClick={() => toast("Démo : dans le logiciel, vous saisissez ici votre nouvelle clé d'activation.")}>Renouveler ou changer de clé</Bouton>
      </Carte>
    </>
  );
}

function Historique() {
  const { s } = useDemo();
  return (
    <>
      <TitrePage icone="🕘">Historique</TitrePage>
      <p className="mb-2 text-[11px] text-slate-500">Toutes vos actions dans cette démo sont notées ici, comme dans le vrai logiciel.</p>
      <Tableau entetes={["Heure", "Action"]}>
        {s.journal.map((l, i) => <tr key={i}><td className={td}>{l.heure}</td><td className={td}>{l.texte}</td></tr>)}
      </Tableau>
    </>
  );
}

function Synchronisation() {
  const { maj, toast } = useDemo();
  const [etat, setEtat] = useState<"pret" | "encours" | "fini">("pret");
  const [pct, setPct] = useState(0);
  const lancer = () => {
    setEtat("encours"); setPct(0);
    let p = 0;
    const t = setInterval(() => {
      p += 20; setPct(p);
      if (p >= 100) { clearInterval(t); setEtat("fini"); maj(() => {}, "Synchronisation PC ↔ téléphone"); toast("Synchronisation terminée : PC et téléphone sont à jour."); }
    }, 350);
  };
  return (
    <>
      <TitrePage icone="🔁">Synchronisation</TitrePage>
      <div className="grid gap-2 sm:grid-cols-2">
        {[["💻", "PC du bureau", "Windows 11"], ["📱", "Téléphone du directeur", "Android"]].map(([i, n, t]) => (
          <Carte key={n}><p className="text-[12px] font-bold text-slate-800 dark:text-slate-100">{i} {n}</p><p className="text-[10.5px] text-slate-500">{t} · {etat === "fini" ? `à jour (${heureMaintenant()})` : "dernière synchro hier 18:02"}</p></Carte>
        ))}
      </div>
      <Carte className="mt-2">
        <Bouton variante="vert" onClick={lancer} disabled={etat === "encours"}>{etat === "encours" ? "Synchronisation…" : "🔁 Synchroniser maintenant"}</Bouton>
        {etat !== "pret" && <div className="mt-2"><Barre pct={pct} couleur="bg-emerald-600" /></div>}
      </Carte>
    </>
  );
}

export const ECRANS: Record<string, () => ReactNode> = {
  dashboard: TableauDeBord, caisse: Caisse, renforcement: Renforcement, eleves: GestionEleves, listeClasse: ListeClasse,
  "groupe-eps": GroupeEps, recap: Recap, matieres: Matieres, notes: SaisieNotes, classement: Rangement, bulletins: Bulletins,
  parents: Parents, progression: ProgressionEcran, fiches: Fiches, documents: Documents, statistiques: Statistiques,
  dossier: Dossier, "dossier-ens": DossierEnseignant, classeur: Classeur, rapport: Rapport, "registre-matricule": RegistreMatricule,
  appel: RegistreAppel, assiduite: Assiduite, admission: Admission, conversion: Conversion, parametres: Parametres,
  licences: Licences, historique: Historique, synchronisation: Synchronisation,
};
