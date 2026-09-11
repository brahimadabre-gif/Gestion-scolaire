import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { SITE } from "@/lib/site";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: {
    default: "Gestion Scolaire Pro Plus — Logiciel de gestion scolaire pour établissements",
    template: "%s | Gestion Scolaire Pro Plus",
  },
  description: SITE.description,
  keywords: SITE.keywords,
  authors: [{ name: "Gestion Scolaire Pro Plus" }],
  creator: "Gestion Scolaire Pro Plus",
  publisher: "Gestion Scolaire Pro Plus",
  applicationName: "Gestion Scolaire Pro Plus",
  alternates: {
    canonical: SITE.url,
  },
  icons: {
    icon: [{ url: "/favicon.svg", type: "image/svg+xml" }],
    apple: [{ url: "/favicon.svg" }],
  },
  manifest: "/manifest.webmanifest",
  openGraph: {
    type: "website",
    locale: "fr_FR",
    url: SITE.url,
    siteName: SITE.name,
    title: "Gestion Scolaire Pro Plus — La solution complète pour simplifier la gestion scolaire",
    description: SITE.description,
  },
  twitter: {
    card: "summary_large_image",
    title: "Gestion Scolaire Pro Plus — Logiciel de gestion scolaire",
    description: SITE.description,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1 },
  },
  category: "Éducation",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#047857" },
    { media: "(prefers-color-scheme: dark)", color: "#0f172a" },
  ],
  width: "device-width",
  initialScale: 1,
};

// Données structurées JSON-LD (SEO — SoftwareApplication)
const jsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "Gestion Scolaire Pro Plus",
  applicationCategory: "EducationalApplication",
  operatingSystem: "Windows 10, Windows 11, Android",
  description: SITE.description,
  slogan: SITE.slogan,
  offers: [
    { "@type": "Offer", name: "Gestion Scolaire Pro Plus", price: "15000", priceCurrency: "XOF", description: "Accès pendant 12 mois sur Windows et Android" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground min-h-screen flex flex-col`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
