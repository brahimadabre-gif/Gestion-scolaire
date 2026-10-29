import { MessageCircle, Phone } from "lucide-react";
import { SITE } from "@/lib/site";

const phoneDigits = SITE.phone.replace(/\D/g, "");
export const formattedPhone = phoneDigits.startsWith("225") && phoneDigits.length === 13
  ? `+225 ${phoneDigits.slice(3, 5)} ${phoneDigits.slice(5, 7)} ${phoneDigits.slice(7, 9)} ${phoneDigits.slice(9, 11)} ${phoneDigits.slice(11, 13)}`
  : SITE.phone;

export function developerWhatsAppHref(message = "Bonjour, je souhaite obtenir une clé d’activation pour Gestion Scolaire Pro Plus.") {
  return `https://wa.me/${phoneDigits}?text=${encodeURIComponent(message)}`;
}

export function DeveloperContact({ compact = false }: { compact?: boolean }) {
  return (
    <section className={`rounded-3xl border bg-card ${compact ? "p-5" : "p-6 sm:p-8"}`} aria-labelledby="developer-contact-title">
      <div className="mx-auto max-w-2xl text-center">
        <h2 id="developer-contact-title" className="text-xl font-bold">Besoin d’une clé d’activation ?</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Contactez le développeur sur WhatsApp ou par appel pour connaître les étapes d’activation.
        </p>
        <p className="mt-3 font-mono text-lg font-semibold">{formattedPhone}</p>
        <div className="mt-5 flex flex-wrap justify-center gap-3">
          <a className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-orange-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-orange-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-600 focus-visible:ring-offset-2" href={developerWhatsAppHref()} target="_blank" rel="noopener noreferrer">
            <MessageCircle className="h-4 w-4" aria-hidden="true" /> WhatsApp
          </a>
          <a className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border px-5 py-2.5 text-sm font-semibold transition hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-600 focus-visible:ring-offset-2" href={`tel:+${phoneDigits}`}>
            <Phone className="h-4 w-4" aria-hidden="true" /> Appeler
          </a>
        </div>
      </div>
    </section>
  );
}
