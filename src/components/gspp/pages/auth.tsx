"use client";

// ── Authentification — connexion, inscription, mot de passe ──
import { useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { api } from "../api";
import { Link, navigate, useRoute } from "../router";
import { useAuth } from "../auth-context";
import { ErrorNote } from "../ui-bits";
import { passwordStrength } from "@/lib/validations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  GraduationCap, Eye, EyeOff, Loader2, ShieldCheck, KeyRound, MailCheck, ArrowRight, UserPlus,
} from "lucide-react";
import { Country } from "./countries";

// ── Cadre commun des pages d'authentification ────────────────
function AuthCard({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <main id="contenu" className="relative overflow-hidden">
      <div className="gspp-hero-glow absolute inset-0" aria-hidden="true" />
      <div className="relative mx-auto flex min-h-[calc(100vh-4rem)] max-w-7xl items-center justify-center px-4 py-12 sm:px-6">
        <div className="w-full max-w-lg">
          <div className="mb-6 flex justify-center lg:hidden">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-600 to-emerald-700 shadow-lg">
              <GraduationCap className="h-6 w-6 text-white" aria-hidden="true" />
            </span>
          </div>
          <div className="rounded-3xl border bg-card p-7 shadow-xl sm:p-9">
            <h1 className="text-2xl font-extrabold tracking-tight">{title}</h1>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{subtitle}</p>
            <div className="mt-7">{children}</div>
          </div>
          {footer && <div className="mt-5 text-center text-sm text-muted-foreground">{footer}</div>}
        </div>
      </div>
    </main>
  );
}

function PasswordInput({
  id, value, onChange, autoComplete, placeholder,
}: {
  id: string; value: string; onChange: (v: string) => void; autoComplete?: string; placeholder?: string;
}) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <Input
        id={id}
        type={show ? "text" : "password"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autoComplete={autoComplete}
        placeholder={placeholder}
        className="pr-10"
        required
      />
      <button
        type="button"
        onClick={() => setShow(!show)}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition hover:text-foreground"
        aria-label={show ? "Masquer le mot de passe" : "Afficher le mot de passe"}
      >
        {show ? <EyeOff className="h-4 w-4" aria-hidden="true" /> : <Eye className="h-4 w-4" aria-hidden="true" />}
      </button>
    </div>
  );
}

function StrengthMeter({ pw }: { pw: string }) {
  const { score, label } = useMemo(() => passwordStrength(pw), [pw]);
  if (!pw) return null;
  const colors = ["bg-rose-500", "bg-rose-400", "bg-amber-400", "bg-lime-500", "bg-emerald-500", "bg-emerald-600"];
  return (
    <div className="mt-2">
      <div className="flex gap-1" aria-hidden="true">
        {[0, 1, 2, 3, 4].map((i) => (
          <span key={i} className={cn("h-1.5 flex-1 rounded-full", i < score ? colors[score] : "bg-muted")} />
        ))}
      </div>
      <p className="mt-1 text-xs text-muted-foreground">Robustesse : <span className="font-semibold">{label}</span></p>
    </div>
  );
}

// ── Connexion ────────────────────────────────────────────────
export function LoginPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) navigate("/compte");
  }, [user]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await api.post<{ user: { firstName: string } }>("/api/auth/login", { email, password });
      await queryClient.invalidateQueries({ queryKey: ["me"] });
      toast.success(`Bonjour ${res.user.firstName} ! Connexion réussie.`);
      navigate("/compte");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Connexion impossible.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthCard
      title="Bon retour !"
      subtitle="Connectez-vous pour accéder à votre espace client : abonnement, licence, téléchargements et support."
      footer={
        <>
          Pas encore de compte ?{" "}
          <Link to="/inscription" className="font-semibold text-primary hover:underline">Créer un compte</Link>
        </>
      }
    >
      <form onSubmit={submit} className="space-y-4" noValidate>
        <ErrorNote message={error} />
        <div className="space-y-1.5">
          <Label htmlFor="login-email">E-mail ou identifiant</Label>
          <Input id="login-email" type="text" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="vous@etablissement.ci ou identifiant" autoComplete="username" required />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="login-password">Mot de passe</Label>
          <PasswordInput id="login-password" value={password} onChange={setPassword} autoComplete="current-password" />
        </div>
        <div className="flex justify-end">
          <Link to="/mot-de-passe-oublie" className="text-xs font-semibold text-primary hover:underline">
            Mot de passe oublié ?
          </Link>
        </div>
        <Button type="submit" size="lg" className="w-full rounded-full" disabled={loading}>
          {loading ? (
            <><Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" /> Connexion…</>
          ) : (
            "Se connecter"
          )}
        </Button>
        <p className="flex items-center justify-center gap-1.5 pt-1 text-xs text-muted-foreground">
          <ShieldCheck className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
          Connexion chiffrée — vos données sont protégées.
        </p>
      </form>
    </AuthCard>
  );
}

// ── Inscription ──────────────────────────────────────────────
export function RegisterPage() {
  const { user } = useAuth();
  const route = useRoute();
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    firstName: "", lastName: "", email: "", phone: "",
    password: "", confirmPassword: "", establishment: "", country: "Côte d'Ivoire",
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) navigate("/compte");
  }, [user]);

  const set = (k: keyof typeof form) => (v: string) => setForm((f) => ({ ...f, [k]: v }));

  const validate = (): string | null => {
    if (form.firstName.trim().length < 2) return "Veuillez saisir votre prénom.";
    if (form.lastName.trim().length < 2) return "Veuillez saisir votre nom.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) return "Adresse e-mail invalide.";
    if (form.password.length < 8) return "Le mot de passe doit contenir au moins 8 caractères.";
    if (!/[A-Z]/.test(form.password) || !/[a-z]/.test(form.password) || !/[0-9]/.test(form.password))
      return "Le mot de passe doit contenir au moins une majuscule, une minuscule et un chiffre.";
    if (form.password !== form.confirmPassword) return "Les mots de passe ne correspondent pas.";
    return null;
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const v = validate();
    if (v) return setError(v);
    setError(null);
    setLoading(true);
    try {
      await api.post("/api/auth/register", form);
      await queryClient.invalidateQueries({ queryKey: ["me"] });
      toast.success("Compte créé avec succès — bienvenue !");
      // Redirige vers l'abonnement si l'utilisateur arrive d'une page tarifs
      navigate(route.query.formule ? `/compte/abonnement?formule=${route.query.formule}` : "/compte");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Inscription impossible.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthCard
      title="Créer votre compte"
      subtitle="Inscription gratuite et sans engagement. Votre compte gère votre abonnement, votre licence et votre support."
      footer={
        <>
          Vous avez déjà un compte ?{" "}
          <Link to="/connexion" className="font-semibold text-primary hover:underline">Se connecter</Link>
        </>
      }
    >
      <form onSubmit={submit} className="space-y-4" noValidate>
        <ErrorNote message={error} />
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="reg-firstname">Prénom *</Label>
            <Input id="reg-firstname" value={form.firstName} onChange={(e) => set("firstName")(e.target.value)} placeholder="Ibrahim" autoComplete="given-name" required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="reg-lastname">Nom *</Label>
            <Input id="reg-lastname" value={form.lastName} onChange={(e) => set("lastName")(e.target.value)} placeholder="Traoré" autoComplete="family-name" required />
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="reg-email">Adresse e-mail *</Label>
            <Input id="reg-email" type="email" value={form.email} onChange={(e) => set("email")(e.target.value)} placeholder="vous@etablissement.ci" autoComplete="email" required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="reg-phone">Téléphone</Label>
            <Input id="reg-phone" type="tel" value={form.phone} onChange={(e) => set("phone")(e.target.value)} placeholder="+225 07 00 00 00 00" autoComplete="tel" />
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="reg-establishment">Établissement</Label>
            <Input id="reg-establishment" value={form.establishment} onChange={(e) => set("establishment")(e.target.value)} placeholder="Groupe Scolaire Primaire…" autoComplete="organization" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="reg-country">Pays *</Label>
            <Select value={form.country} onValueChange={set("country")}>
              <SelectTrigger id="reg-country" aria-label="Pays">
                <SelectValue placeholder="Choisir votre pays" />
              </SelectTrigger>
              <SelectContent>
                {Country.map((c) => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="space-y-1">
          <Label htmlFor="reg-password">Mot de passe *</Label>
          <PasswordInput id="reg-password" value={form.password} onChange={set("password")} autoComplete="new-password" placeholder="8 caractères min., majuscule, minuscule, chiffre" />
          <StrengthMeter pw={form.password} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="reg-confirm">Confirmer le mot de passe *</Label>
          <PasswordInput id="reg-confirm" value={form.confirmPassword} onChange={set("confirmPassword")} autoComplete="new-password" />
        </div>
        <Button type="submit" size="lg" className="w-full rounded-full" disabled={loading}>
          {loading ? (
            <><Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" /> Création du compte…</>
          ) : (
            <><UserPlus className="mr-2 h-4 w-4" aria-hidden="true" /> Créer mon compte</>
          )}
        </Button>
        <p className="pt-1 text-center text-xs leading-relaxed text-muted-foreground">
          En créant un compte, vous acceptez nos{" "}
          <Link to="/legal/cgu" className="font-semibold text-primary hover:underline">conditions d&apos;utilisation</Link>{" "}
          et notre{" "}
          <Link to="/legal/confidentialite" className="font-semibold text-primary hover:underline">politique de confidentialité</Link>.
        </p>
      </form>
    </AuthCard>
  );
}

// ── Mot de passe oublié (+ réinitialisation avec token) ─────
export function ForgotPasswordPage() {
  const route = useRoute();
  const token = route.query.token ?? "";
  return token ? <ResetPasswordForm token={token} /> : <ForgotPasswordForm />;
}

function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState<{ message: string; devLink?: string } | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return setError("Adresse e-mail invalide.");
    setError(null);
    setLoading(true);
    try {
      const res = await api.post<{ message: string; devLink?: string }>("/api/auth/forgot-password", { email });
      setSent(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Demande impossible.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthCard
      title="Mot de passe oublié ?"
      subtitle="Saisissez votre adresse e-mail : nous vous envoyons un lien de réinitialisation valable une heure."
      footer={<Link to="/connexion" className="font-semibold text-primary hover:underline">Retour à la connexion</Link>}
    >
      {sent ? (
        <div className="space-y-4 text-center">
          <MailCheck className="mx-auto h-12 w-12 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
          <p className="text-sm leading-relaxed text-muted-foreground">{sent.message}</p>
          {/* Environnement de démonstration sans service e-mail : le lien s'affiche ici.
              En production, ce bloc disparaît dès que le SMTP est configuré. */}
          {sent.devLink && (
            <div className="rounded-2xl border border-amber-500/40 bg-amber-500/10 p-4 text-left text-xs leading-relaxed text-amber-800 dark:text-amber-300">
              <p className="font-semibold">Mode démonstration (service e-mail non configuré)</p>
              <p className="mt-1">En production, ce lien serait envoyé uniquement par e-mail. Pour tester :</p>
              <a href={sent.devLink} className="mt-2 block break-all font-mono font-semibold text-primary underline underline-offset-4">
                {sent.devLink}
              </a>
            </div>
          )}
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-4" noValidate>
          <ErrorNote message={error} />
          <div className="space-y-1.5">
            <Label htmlFor="fp-email">Adresse e-mail</Label>
            <Input id="fp-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="vous@etablissement.ci" autoComplete="email" required />
          </div>
          <Button type="submit" size="lg" className="w-full rounded-full" disabled={loading}>
            {loading ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" /> Envoi…</>
            ) : (
              <><KeyRound className="mr-2 h-4 w-4" aria-hidden="true" /> Envoyer le lien de réinitialisation</>
            )}
          </Button>
        </form>
      )}
    </AuthCard>
  );
}

function ResetPasswordForm({ token }: { token: string }) {
  const queryClient = useQueryClient();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8 || !/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/[0-9]/.test(password)) {
      return setError("Le mot de passe doit contenir au moins 8 caractères, une majuscule, une minuscule et un chiffre.");
    }
    if (password !== confirmPassword) return setError("Les mots de passe ne correspondent pas.");
    setError(null);
    setLoading(true);
    try {
      await api.post("/api/auth/reset-password", { token, password, confirmPassword });
      setDone(true);
      toast.success("Mot de passe modifié ! Connectez-vous avec votre nouveau mot de passe.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Réinitialisation impossible.");
    } finally {
      setLoading(false);
      queryClient.invalidateQueries({ queryKey: ["me"] });
    }
  };

  return (
    <AuthCard
      title="Nouveau mot de passe"
      subtitle="Choisissez un mot de passe solide pour sécuriser votre compte Gestion Scolaire Pro Plus."
      footer={done ? undefined : <Link to="/connexion" className="font-semibold text-primary hover:underline">Retour à la connexion</Link>}
    >
      {done ? (
        <div className="space-y-5 text-center">
          <ShieldCheck className="mx-auto h-12 w-12 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
          <p className="text-sm text-muted-foreground">Votre mot de passe a été modifié avec succès.</p>
          <Button size="lg" className="w-full rounded-full" onClick={() => navigate("/connexion")}>
            Se connecter <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
          </Button>
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-4" noValidate>
          <ErrorNote message={error} />
          <div className="space-y-1">
            <Label htmlFor="rp-password">Nouveau mot de passe</Label>
            <PasswordInput id="rp-password" value={password} onChange={setPassword} autoComplete="new-password" />
            <StrengthMeter pw={password} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="rp-confirm">Confirmer le mot de passe</Label>
            <PasswordInput id="rp-confirm" value={confirmPassword} onChange={setConfirmPassword} autoComplete="new-password" />
          </div>
          <Button type="submit" size="lg" className="w-full rounded-full" disabled={loading}>
            {loading ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" /> Modification…</>
            ) : (
              "Modifier mon mot de passe"
            )}
          </Button>
        </form>
      )}
    </AuthCard>
  );
}
