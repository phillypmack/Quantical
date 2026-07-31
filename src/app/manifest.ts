import type { MetadataRoute } from "next";

import { SITE_DESCRIPTION, SITE_NAME } from "@/lib/site";

export const dynamic = "force-static";

/**
 * O app é 100% estático e o simulador roda inteiro no navegador — ou seja,
 * o produto funciona offline por inteiro. Isso pesa no Brasil, onde muito
 * aluno estuda em plano pré-pago com dados irregulares.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${SITE_NAME} — Computação quântica em português`,
    short_name: SITE_NAME,
    description: SITE_DESCRIPTION,
    start_url: "/",
    display: "standalone",
    background_color: "#f5f4ef",
    theme_color: "#101d3c",
    lang: "pt-BR",
    categories: ["education", "science"],
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
    ],
  };
}
