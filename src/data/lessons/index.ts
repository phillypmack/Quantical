import { bitsEQubits } from "./iniciante/bits-e-qubits";
import { medicao } from "./iniciante/medicao";
import { portas } from "./iniciante/portas";
import { superposicao } from "./iniciante/superposicao";
import type { Lesson } from "./types";

export type { Block, Lesson, Question, QuestionOption, StageId } from "./types";

/**
 * Camada de CONTEÚDO. O curriculum.ts continua sendo o índice ESTRUTURAL
 * (trilhas → módulos); aqui ficam as aulas escritas.
 *
 * Módulos ainda não escritos simplesmente não aparecem neste mapa, e a rota
 * cai no formato genérico — assim a autoria pode avançar módulo a módulo sem
 * quebrar as 54 rotas que já existem.
 */
export const lessons: Lesson[] = [...bitsEQubits, ...superposicao, ...medicao, ...portas];

export const lessonsById = new Map(lessons.map((lesson) => [lesson.id, lesson]));

export function getLesson(id: string): Lesson | undefined {
  return lessonsById.get(id);
}

export function hasAuthoredContent(id: string) {
  return lessonsById.has(id);
}

/** Módulos com as três aulas escritas — usado pelo índice das trilhas. */
export const authoredModules = new Set(
  Object.entries(
    lessons.reduce<Record<string, number>>((accumulator, lesson) => {
      const key = `${lesson.trackId}/${lesson.moduleId}`;
      accumulator[key] = (accumulator[key] ?? 0) + 1;
      return accumulator;
    }, {}),
  )
    .filter(([, count]) => count === 3)
    .map(([key]) => key),
);
