/**
 * Origem canônica do site.
 *
 * O metadataBase estava cravado em `quantical-lab.roriz-jp.chatgpt.site`
 * enquanto o nginx serve `quantical.com.br` — toda URL canônica, OG e entrada
 * de sitemap nasceria apontando para o host errado.
 */
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://quantical.com.br"
).replace(/\/$/, "");

export const SITE_NAME = "Quantical";

export const SITE_DESCRIPTION =
  "Aprenda computação quântica em português, do primeiro qubit aos algoritmos avançados, com experimentos guiados e um laboratório que roda no seu navegador.";
