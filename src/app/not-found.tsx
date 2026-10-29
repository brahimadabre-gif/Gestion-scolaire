import { AppShell } from "@/components/gspp/app-shell";

// Adresse inconnue : vraie réponse 404, affichée avec l'en-tête et le pied du site.
export default function NotFound() {
  return <AppShell initialPath="/page-introuvable" />;
}
