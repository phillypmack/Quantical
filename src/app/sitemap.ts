import type { MetadataRoute } from "next";

import { challenges } from "@/data/challenges";
import { getAllLessons } from "@/data/curriculum";
import { SITE_URL } from "@/lib/site";

// Sob `output: "export"` isto vira um sitemap.xml estático no build.
export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  const staticRoutes = [
    { path: "/", priority: 1 },
    { path: "/aprender", priority: 0.9 },
    { path: "/laboratorio", priority: 0.9 },
    { path: "/desafios", priority: 0.8 },
    { path: "/glossario", priority: 0.7 },
    { path: "/projetos", priority: 0.4 },
    { path: "/progresso", priority: 0.4 },
    { path: "/entrar", priority: 0.3 },
  ];

  return [
    ...staticRoutes.map((route) => ({
      url: `${SITE_URL}${route.path}`,
      changeFrequency: "weekly" as const,
      priority: route.priority,
    })),
    ...getAllLessons().map((lesson) => ({
      url: `${SITE_URL}${lesson.href}`,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
    ...challenges.map((challenge) => ({
      url: `${SITE_URL}/desafios/${challenge.id}`,
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
  ];
}
