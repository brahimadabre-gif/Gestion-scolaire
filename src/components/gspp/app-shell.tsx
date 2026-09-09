"use client";

// ── App Shell — aiguillage des routes de la SPA ──────────────
import { useEffect } from "react";
import { RouterProvider, useRoute } from "./router";
import { AuthProvider, useAuth } from "./auth-context";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "next-themes";
import { Toaster } from "@/components/ui/sonner";
import { SiteHeader } from "./site-header";
import { SiteFooter } from "./site-footer";
import { HomePage } from "./pages/home";
import { FeaturesPage } from "./pages/features";
import { PricingPage } from "./pages/pricing";
import { DownloadPage } from "./pages/download";
import { DocsPage } from "./pages/docs";
import { TutorialPage } from "./pages/tutorial";
import { FaqPage } from "./pages/faq";
import { SupportPage } from "./pages/support";
import { NewsListPage, NewsArticlePage } from "./pages/news";
import { LoginPage, RegisterPage, ForgotPasswordPage } from "./pages/auth";
import { AccountDashboard, AccountPaymentsPage } from "./pages/account";
import { AccountSubscriptionPage } from "./pages/account-subscription";
import { AdminPage } from "./pages/admin";
import { LegalPage } from "./pages/legal";
import { Button } from "@/components/ui/button";
import { navigate } from "./router";
import { Compass, Loader2 } from "lucide-react";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { refetchOnWindowFocus: false, retry: 1 },
  },
});

// ── Garde d'accès aux pages protégées ────────────────────────
function Protected({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  useEffect(() => {
    if (!isLoading && !user) navigate("/connexion");
  }, [isLoading, user]);
  if (isLoading) {
    return (
      <main className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" aria-hidden="true" />
        <span className="sr-only">Vérification de la session…</span>
      </main>
    );
  }
  if (!user) {
    return (
      <main className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-4 text-center">
        <p className="text-lg font-semibold">Connexion requise</p>
        <p className="text-sm text-muted-foreground">Connectez-vous pour accéder à votre espace client.</p>
        <Button className="rounded-full" onClick={() => navigate("/connexion")}>Se connecter</Button>
      </main>
    );
  }
  return <>{children}</>;
}

// ── Aiguillage principal ─────────────────────────────────────
function Routes() {
  const { path, query } = useRoute();

  switch (path) {
    case "/":
    case "/accueil":
      return <HomePage />;
    case "/fonctionnalites":
      return <FeaturesPage />;
    case "/tarifs":
      return <PricingPage />;
    case "/telecharger":
      return <DownloadPage />;
    case "/notice":
      return <DocsPage />;
    case "/tutoriel-compte":
      return <TutorialPage />;
    case "/faq":
      return <FaqPage />;
    case "/support":
      return <SupportPage />;
    case "/actualites":
      return query.article ? <NewsArticlePage slug={query.article} /> : <NewsListPage />;
    case "/connexion":
      return <LoginPage />;
    case "/inscription":
      return <RegisterPage />;
    case "/mot-de-passe-oublie":
      return <ForgotPasswordPage />;
    case "/compte":
      return (
        <Protected>
          <AccountDashboard />
        </Protected>
      );
    case "/compte/abonnement":
      return (
        <Protected>
          <AccountSubscriptionPage />
        </Protected>
      );
    case "/compte/paiements":
      return (
        <Protected>
          <AccountPaymentsPage />
        </Protected>
      );
    case "/admin":
      return <AdminPage />;
    case "/legal/cgu":
    case "/legal/confidentialite":
    case "/legal/cookies":
    case "/legal/mentions":
      return <LegalPage kind={path.split("/")[2] as "cgu" | "confidentialite" | "cookies" | "mentions"} />;
    default:
      return (
        <main className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-4 text-center">
          <Compass className="h-14 w-14 text-muted-foreground/40" aria-hidden="true" />
          <h1 className="text-2xl font-extrabold">Page introuvable</h1>
          <p className="max-w-md text-sm text-muted-foreground">
            La page <span className="font-mono">{path}</span> n&apos;existe pas ou a été déplacée.
          </p>
          <div className="flex gap-3">
            <Button className="rounded-full" onClick={() => navigate("/")}>Retour à l&apos;accueil</Button>
            <Button variant="outline" className="rounded-full" onClick={() => navigate("/support")}>Besoin d&apos;aide ?</Button>
          </div>
        </main>
      );
  }
}

function Shell() {
  return (
    <>
      <SiteHeader />
      <div className="flex-1">
        <Routes />
      </div>
      <SiteFooter />
    </>
  );
}

export function AppShell() {
  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
      <QueryClientProvider client={queryClient}>
        <RouterProvider>
          <AuthProvider>
            <Shell />
          </AuthProvider>
        </RouterProvider>
        <Toaster position="top-center" richColors />
      </QueryClientProvider>
    </ThemeProvider>
  );
}
