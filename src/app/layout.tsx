import type { Metadata } from "next";

import { ProgressProvider } from "@/components/progress-provider";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Quantical — Programação quântica, finalmente compreensível",
    template: "%s | Quantical",
  },
  description:
    "Aprenda computação quântica do primeiro qubit aos algoritmos avançados, com aulas visuais e um laboratório que roda no navegador.",
  metadataBase: new URL("https://quantical-lab.roriz-jp.chatgpt.site"),
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body>
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
