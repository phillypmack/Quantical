import type { Metadata } from "next";

import { RevisaoSessao } from "@/components/revisao-sessao";

export const metadata: Metadata = {
  title: "Revisar",
  description:
    "Revisão espaçada por conceito: a pergunta que você errou, a previsão que furou e o exercício que falhou voltam no espaçamento certo.",
  alternates: { canonical: "/revisar" },
  // Página inteiramente pessoal: para um robô ela é uma tela vazia. Fora do
  // índice e fora do sitemap, como o /progresso deveria estar.
  robots: { index: false, follow: true },
};

export default function RevisarPage() {
  return <RevisaoSessao />;
}
