import type { Circuit } from "@/lib/quantum/types";
import type { Revisao, Tentativa } from "@/lib/revisao/types";

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

  /**
   * Identidade anônima do dispositivo. Existe só para a API conseguir juntar
   * as tentativas do mesmo aluno — não pede conta nem e-mail, coerente com o
   * "Continuar sem conta" que o site oferece desde sempre.
   */
  alunoId?: string;

  /**
   * Tentativas registradas, das mais recentes para as mais antigas.
   *
   * Antes disso, errar não deixava rastro: o `retry()` do quiz apagava as
   * respostas e a previsão errada era descartada ao navegar. Limitada em
   * `MAX_TENTATIVAS` para o localStorage não crescer sem fim.
   */
  tentativas: Tentativa[];

  /** Agenda de revisão espaçada, por conceito. */
  revisao: Record<string, Revisao>;
};

export type SyncStatus = "idle" | "syncing" | "synced" | "error" | "offline";
