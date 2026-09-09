"use client";

// ── Centre d'aide / Support — documentation, tutoriels, formulaire, tickets ──
import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api, TicketRecord } from "../api";
import { Link, useRoute } from "../router";
import { useAuth } from "../auth-context";
import { PageHero } from "../page-hero";
import { Section, SectionHeading, Spinner, StatusBadge, ErrorNote } from "../ui-bits";
import { formatDate } from "@/lib/site";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import {
  BookOpen, GraduationCap, Search, Send, MessageSquareText, Paperclip, CheckCircle2, Loader2,
} from "lucide-react";

const CATEGORIES = [
  { value: "general", label: "Question générale" },
  { value: "technique", label: "Problème technique" },
  { value: "installation", label: "Installation" },
  { value: "abonnement", label: "Abonnement" },
  { value: "facturation", label: "Facturation" },
];

export function SupportPage() {
  const route = useRoute();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [form, setForm] = useState({
    name: "", email: "", subject: "", category: "", message: "", attachment: "",
  });
  const [errors, setErrors] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submittedRef, setSubmittedRef] = useState<string | null>(null);

  // Pré-remplissage pour les utilisateurs connectés
  useEffect(() => {
    if (user) {
      setForm((f) => ({
        ...f,
        name: `${user.firstName} ${user.lastName}`.trim(),
        email: user.email,
      }));
    }
  }, [user]);

  // Pré-remplissage du sujet si ?sujet= dans l'URL
  useEffect(() => {
    if (route.query.sujet) {
      setForm((f) => ({ ...f, subject: decodeURIComponent(route.query.sujet) }));
    }
  }, [route.query.sujet]);

  const { data: tickets, isLoading: ticketsLoading } = useQuery<TicketRecord[]>({
    queryKey: ["tickets"],
    queryFn: () => api.get<TicketRecord[]>("/api/tickets"),
    enabled: !!user,
  });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors(null);
    if (!form.name.trim() || form.name.trim().length < 2) return setErrors("Veuillez indiquer votre nom.");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) return setErrors("Adresse e-mail invalide.");
    if (form.subject.trim().length < 4) return setErrors("Veuillez préciser le sujet de votre demande.");
    if (!form.category) return setErrors("Veuillez choisir une catégorie.");
    if (form.message.trim().length < 10) return setErrors("Décrivez votre demande en quelques mots (10 caractères minimum).");

    setSubmitting(true);
    try {
      const res = await api.post<{ reference: string }>("/api/tickets", form);
      setSubmittedRef(res.reference);
      setForm((f) => ({ ...f, subject: "", message: "", attachment: "", category: "" }));
      toast.success(`Demande envoyée — référence ${res.reference}`);
      queryClient.invalidateQueries({ queryKey: ["tickets"] });
    } catch (err) {
      setErrors(err instanceof Error ? err.message : "Envoi impossible. Réessayez.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main id="contenu">
      <PageHero
        eyebrow="Centre d'aide"
        title="Comment pouvons-nous vous aider ?"
        description="Documentation, tutoriels, recherche de solution ou contact direct avec notre équipe : tout est réuni ici."
      />

      {/* Raccourcis */}
      <Section className="pb-0">
        <div className="grid gap-4 sm:grid-cols-3">
          {[
            { icon: BookOpen, title: "Notice d'utilisation", text: "Le guide complet en 19 sections.", href: "/notice", cta: "Consulter la documentation" },
            { icon: GraduationCap, title: "Tutoriels", text: "Créer un compte, premier bulletin…", href: "/tutoriel-compte", cta: "Voir les tutoriels" },
            { icon: Search, title: "FAQ", text: "Les réponses les plus fréquentes.", href: "/faq", cta: "Parcourir la FAQ" },
          ].map((c) => (
            <Link key={c.title} to={c.href} className="card-hover rounded-2xl border bg-card p-6">
              <span className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-600/10 text-emerald-700 dark:text-emerald-400">
                <c.icon className="h-5.5 w-5.5" aria-hidden="true" />
              </span>
              <h2 className="text-[15px] font-semibold">{c.title}</h2>
              <p className="mt-1.5 text-sm text-muted-foreground">{c.text}</p>
              <p className="mt-3 text-sm font-semibold text-primary">{c.cta} →</p>
            </Link>
          ))}
        </div>
      </Section>

      {/* Formulaire + tickets */}
      <Section>
        <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <SectionHeading
              align="left"
              eyebrow="Contact"
              title="Envoyer une demande au support"
              description="Décrivez votre demande avec le plus de détails possible : plus elle est précise, plus la réponse est rapide."
            />
            {submittedRef ? (
              <div className="mt-8 rounded-3xl border border-emerald-600/30 bg-emerald-600/5 p-8 text-center">
                <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
                <h3 className="mt-4 text-lg font-bold">Demande enregistrée !</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Votre référence de suivi : <span className="font-mono font-bold text-foreground">{submittedRef}</span>.
                  Notre équipe vous répond sous 24 h ouvrées à l&apos;adresse indiquée.
                </p>
                <Button variant="outline" className="mt-5 rounded-full" onClick={() => setSubmittedRef(null)}>
                  Envoyer une autre demande
                </Button>
              </div>
            ) : (
              <form onSubmit={submit} className="mt-8 space-y-4" noValidate>
                <ErrorNote message={errors} />
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="s-name">Nom complet *</Label>
                    <Input id="s-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Votre nom" autoComplete="name" />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="s-email">Adresse e-mail *</Label>
                    <Input id="s-email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="vous@etablissement.ci" autoComplete="email" />
                  </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="s-subject">Sujet *</Label>
                    <Input id="s-subject" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} placeholder="Ex. : Problème d'impression des bulletins" />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="s-category">Catégorie *</Label>
                    <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                      <SelectTrigger id="s-category" aria-label="Catégorie de la demande">
                        <SelectValue placeholder="Choisir une catégorie" />
                      </SelectTrigger>
                      <SelectContent>
                        {CATEGORIES.map((c) => (
                          <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="s-message">Message *</Label>
                  <Textarea
                    id="s-message"
                    value={form.message}
                    onChange={(e) => setForm({ ...form, message: e.target.value })}
                    placeholder="Décrivez votre demande : ce que vous faites, ce qui se passe, le message d'erreur éventuel…"
                    rows={6}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="s-file" className="flex items-center gap-1.5">
                    <Paperclip className="h-3.5 w-3.5" aria-hidden="true" /> Pièce jointe (nom du fichier, si nécessaire)
                  </Label>
                  <Input id="s-file" value={form.attachment} onChange={(e) => setForm({ ...form, attachment: e.target.value })} placeholder="Ex. : capture-erreur-impression.png" />
                  <p className="text-xs text-muted-foreground">
                    Le transfert de fichiers sécurisé sera activé avec la mise en production du stockage.
                  </p>
                </div>
                <Button type="submit" size="lg" className="w-full rounded-full sm:w-auto" disabled={submitting}>
                  {submitting ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" /> Envoi en cours…</>
                  ) : (
                    <><Send className="mr-2 h-4 w-4" aria-hidden="true" /> Envoyer la demande</>
                  )}
                </Button>
              </form>
            )}
          </div>

          {/* Mes demandes */}
          <div>
            <SectionHeading
              align="left"
              eyebrow="Suivi"
              title={user ? "Mes demandes" : "Suivi de vos demandes"}
              description={
                user
                  ? "Historique de vos demandes au support, avec les réponses de notre équipe."
                  : "Connectez-vous pour consulter l'historique de vos demandes et leurs réponses."
              }
            />
            <div className="mt-8">
              {!user ? (
                <div className="rounded-3xl border bg-card p-8 text-center">
                  <MessageSquareText className="mx-auto h-10 w-10 text-muted-foreground/50" aria-hidden="true" />
                  <p className="mt-3 text-sm text-muted-foreground">
                    Connectez-vous pour suivre vos demandes.
                  </p>
                  <Link to="/connexion" className="mt-4 inline-flex rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90">
                    Se connecter
                  </Link>
                </div>
              ) : ticketsLoading ? (
                <Spinner />
              ) : (tickets ?? []).length === 0 ? (
                <div className="rounded-3xl border bg-card p-8 text-center">
                  <p className="text-sm text-muted-foreground">Aucune demande pour le moment.</p>
                </div>
              ) : (
                <ul className="space-y-3">
                  {tickets!.map((t) => (
                    <li key={t.id} className="rounded-2xl border bg-card p-5">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="font-mono text-xs font-bold text-muted-foreground">{t.reference}</span>
                        <StatusBadge status={t.status} />
                      </div>
                      <h3 className="mt-2 text-[15px] font-semibold">{t.subject}</h3>
                      <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{t.message}</p>
                      {t.response && (
                        <div className="mt-3 rounded-xl border-l-4 border-emerald-500 bg-emerald-500/5 px-4 py-3">
                          <p className="text-xs font-bold text-emerald-700 dark:text-emerald-400">Réponse du support</p>
                          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{t.response}</p>
                        </div>
                      )}
                      <p className="mt-3 text-xs text-muted-foreground">Envoyée le {formatDate(t.createdAt)}</p>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      </Section>
    </main>
  );
}
