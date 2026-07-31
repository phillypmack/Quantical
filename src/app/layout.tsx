import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";

import { ProgressProvider } from "@/components/progress-provider";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL } from "@/lib/site";

import "./globals.css";

// O CSS pedia Inter e ela NUNCA era carregada: todo mundo recebia o fallback
// do sistema. latin-ext é necessário para ã, ç e õ.
const inter = Inter({
  subsets: ["latin", "latin-ext"],
  display: "swap",
  variable: "--font-sans",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Quantical — Programação quântica, finalmente compreensível",
    template: "%s | Quantical",
  },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  keywords: [
    "computação quântica",
    "curso de computação quântica",
    "qubit",
    "Qiskit em português",
    "simulador quântico online",
    "portas quânticas",
    "emaranhamento quântico",
  ],
  authors: [{ name: SITE_NAME }],
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "pt_BR",
    url: SITE_URL,
    siteName: SITE_NAME,
    title: "Quantical — Programação quântica, finalmente compreensível",
    description: SITE_DESCRIPTION,
  },
  twitter: {
    card: "summary_large_image",
    title: "Quantical",
    description: SITE_DESCRIPTION,
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#f5f4ef",
  colorScheme: "light",
};

/** Dados estruturados: ajuda o Google a entender que isto é um curso. */
const structuredData = {
  "@context": "https://schema.org",
  "@type": "Course",
  name: "Quantical — Computação quântica em português",
  description: SITE_DESCRIPTION,
  inLanguage: "pt-BR",
  url: SITE_URL,
  provider: { "@type": "Organization", name: SITE_NAME, url: SITE_URL },
  isAccessibleForFree: true,
  offers: { "@type": "Offer", price: "0", priceCurrency: "BRL", category: "Free" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html className={inter.variable} lang="pt-BR">
      <body>
        <script
          type="application/ld+json"
          // Conteúdo estático definido acima; nada vem de entrada de usuário.
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
        <a className="skip-link" href="#conteudo">
          Pular para o conteúdo
        </a>
        <ProgressProvider>
          <SiteHeader />
          <main id="conteudo">{children}</main>
          <SiteFooter />
        </ProgressProvider>
      </body>
    </html>
  );
}
