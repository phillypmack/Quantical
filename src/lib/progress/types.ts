import type { Circuit } from "@/lib/quantum/types";

export type SavedProject = {
  id: string;
  title: string;
  code: string;
  /**
   * O circuito estruturado. A v1 nunca guardava isto e o sync empurrava
   * `circuit: {}` a cada execução, zerando a coluna jsonb remota.
   */
  circuit?: Circuit;
  updatedAt: string;
};

export type ProgressState = {
  version: 2;
  completed: string[];
  /** lessonId -> ISO da PRIMEIRA conclusão. A v1 reescrevia isto para "agora" a cada sync. */
  completedAt: Record<string, string>;
  quizScores: Record<string, number>;
  lastLesson?: string;
  /** Data local em America/Sao_Paulo (YYYY-MM-DD), não UTC. */
  lastStudyDate?: string;
  streak: number;
  projects: SavedProject[];
  /** Lápides: id do projeto -> ISO da exclusão. Sem isto o sync ressuscita o que foi apagado. */
  deletedProjects: Record<string, string>;
  /** ISO do último resetProgress. Conclusões remotas anteriores a ele são descartadas. */
  resetAt?: string;
  /** Módulos que o aluno abriu apesar da recomendação (travas suaves). */
  unlockedOverrides: string[];
};

export type SyncStatus = "idle" | "syncing" | "synced" | "error" | "offline";
