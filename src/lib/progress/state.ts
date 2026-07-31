import { registrar } from "@/lib/revisao/agenda";
import type { Revisao, Tentativa } from "@/lib/revisao/types";
import type { ProgressState, SavedProject } from "./types";

export const STORAGE_KEY = "quantical:progress:v2";
export const LEGACY_STORAGE_KEY = "quantical:progress:v1";

/**
 * Teto de tentativas guardadas no navegador.
 *
 * O que importa para a revisão é o passado recente; e o localStorage tem
 * cota. As antigas são descartadas depois de sincronizadas — o histórico
 * completo vive no servidor, não aqui.
 */
export const MAX_TENTATIVAS = 400;

export const emptyState: ProgressState = {
  version: 2,
  completed: [],
  completedAt: {},
  quizScores: {},
  streak: 0,
  projects: [],
  deletedProjects: {},
  unlockedOverrides: [],
  tentativas: [],
  revisao: {},
};

/**
 * Data de estudo no fuso do aluno, não em UTC.
 *
 * A v1 usava `new Date().toISOString().slice(0, 10)`: quem estudasse às
 * 21h30 em Brasília recebia a data do dia seguinte e a sequência contava
 * dois dias de uma vez. "sv-SE" é o atalho para o formato YYYY-MM-DD.
 */
export const STUDY_TIME_ZONE = "America/Sao_Paulo";

export function studyDate(now: Date = new Date(), timeZone: string = STUDY_TIME_ZONE) {
  return new Intl.DateTimeFormat("sv-SE", { timeZone, dateStyle: "short" }).format(now);
}

export function dayDifference(first: string, second: string) {
  const a = Date.parse(`${first}T12:00:00Z`);
  const b = Date.parse(`${second}T12:00:00Z`);
  if (Number.isNaN(a) || Number.isNaN(b)) return Number.NaN;
  return Math.round((b - a) / 86_400_000);
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const stringArray = (value: unknown): string[] =>
  Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];

function stringMap(value: unknown): Record<string, string> {
  if (!isRecord(value)) return {};
  const result: Record<string, string> = {};
  for (const [key, entry] of Object.entries(value)) {
    if (typeof entry === "string") result[key] = entry;
  }
  return result;
}

function numberMap(value: unknown): Record<string, number> {
  if (!isRecord(value)) return {};
  const result: Record<string, number> = {};
  for (const [key, entry] of Object.entries(value)) {
    if (typeof entry === "number" && Number.isFinite(entry)) {
      result[key] = Math.max(0, Math.min(100, entry));
    }
  }
  return result;
}

function parseProject(value: unknown): SavedProject | null {
  if (!isRecord(value)) return null;
  const { id, title, code, updatedAt, circuit } = value;
  if (typeof id !== "string" || id.length === 0) return null;
  if (typeof title !== "string" || typeof code !== "string") return null;
  return {
    id,
    title,
    code,
    updatedAt: typeof updatedAt === "string" ? updatedAt : new Date(0).toISOString(),
    // Só repassa o circuito se ele tiver forma plausível; nunca `{}`.
    circuit:
      isRecord(circuit) && typeof circuit.qubits === "number" && Array.isArray(circuit.operations)
        ? (circuit as SavedProject["circuit"])
        : undefined,
  };
}

function parseTentativa(value: unknown): Tentativa | null {
  if (!isRecord(value)) return null;
  const { id, tipo, licaoId, itemId, acertou, conceitos, equivocoId, detalhe, em, sincronizada } =
    value;
  if (typeof id !== "string" || typeof licaoId !== "string" || typeof itemId !== "string") {
    return null;
  }
  if (tipo !== "quiz" && tipo !== "previsao" && tipo !== "exercicio") return null;
  if (typeof acertou !== "boolean" || typeof em !== "string") return null;

  return {
    id,
    tipo,
    licaoId,
    itemId,
    acertou,
    conceitos: stringArray(conceitos),
    equivocoId: typeof equivocoId === "string" ? equivocoId : undefined,
    detalhe: isRecord(detalhe) ? detalhe : undefined,
    em,
    sincronizada: sincronizada === true,
  };
}

function parseRevisao(value: unknown): Record<string, Revisao> {
  if (!isRecord(value)) return {};
  const result: Record<string, Revisao> = {};
  for (const [conceitoId, entry] of Object.entries(value)) {
    if (!isRecord(entry)) continue;
    const { forca, proximaEm, ultimaEm, errosTotais } = entry;
    if (typeof proximaEm !== "string") continue;
    result[conceitoId] = {
      conceitoId,
      forca: typeof forca === "number" && Number.isFinite(forca) ? Math.max(0, Math.floor(forca)) : 0,
      proximaEm,
      ultimaEm: typeof ultimaEm === "string" ? ultimaEm : undefined,
      errosTotais:
        typeof errosTotais === "number" && Number.isFinite(errosTotais)
          ? Math.max(0, Math.floor(errosTotais))
          : 0,
    };
  }
  return result;
}

/**
 * Valida o que veio do localStorage antes de deixar entrar no app.
 *
 * A v1 fazia `{ ...initialState, ...JSON.parse(saved) }` sem checar nada: um
 * payload truncado com `completed: null` derrubava todo consumidor que
 * chamasse `.includes` ou `.map`. Escrito à mão de propósito — validar isto
 * não justifica arrastar um Zod para dentro do bundle de toda página.
 */
export function parseProgressState(input: unknown): ProgressState {
  if (!isRecord(input)) return { ...emptyState };

  const completed = Array.from(new Set(stringArray(input.completed)));
  const completedAt = stringMap(input.completedAt);

  // Migração v1 -> v2: a v1 não guardava completedAt. Sem data conhecida, o
  // mais honesto é deixar em branco em vez de inventar "agora".
  const projects = Array.isArray(input.projects)
    ? input.projects.map(parseProject).filter((project): project is SavedProject => project !== null)
    : [];

  const streak = typeof input.streak === "number" && Number.isFinite(input.streak)
    ? Math.max(0, Math.floor(input.streak))
    : 0;

  return {
    version: 2,
    completed,
    completedAt,
    quizScores: numberMap(input.quizScores),
    lastLesson: typeof input.lastLesson === "string" ? input.lastLesson : undefined,
    lastStudyDate: typeof input.lastStudyDate === "string" ? input.lastStudyDate : undefined,
    streak,
    // Um mesmo id não pode aparecer duas vezes; o último vence.
    projects: Array.from(new Map(projects.map((project) => [project.id, project])).values()),
    deletedProjects: stringMap(input.deletedProjects),
    resetAt: typeof input.resetAt === "string" ? input.resetAt : undefined,
    unlockedOverrides: Array.from(new Set(stringArray(input.unlockedOverrides))),
    alunoId: typeof input.alunoId === "string" ? input.alunoId : undefined,
    tentativas: Array.isArray(input.tentativas)
      ? input.tentativas
          .map(parseTentativa)
          .filter((tentativa): tentativa is Tentativa => tentativa !== null)
          .slice(0, MAX_TENTATIVAS)
      : [],
    revisao: parseRevisao(input.revisao),
  };
}

/** Acrescenta uma tentativa e reagenda os conceitos que ela toca. */
export function aplicarTentativa(
  state: ProgressState,
  tentativa: Tentativa,
  now: Date = new Date(),
): ProgressState {
  const hoje = studyDate(now);
  return {
    ...state,
    // Mais recente primeiro, para o corte por MAX_TENTATIVAS descartar o velho.
    tentativas: [tentativa, ...state.tentativas].slice(0, MAX_TENTATIVAS),
    revisao: registrar(state.revisao, tentativa, hoje),
  };
}

/**
 * Marca como sincronizadas as tentativas que a API confirmou ter recebido.
 *
 * Só uma marcação — as linhas continuam no navegador. Apagar o que subiu
 * deixaria a revisão dependente da rede para saber o que você errou, e a
 * primeira regra deste produto é que ele funciona com a API fora do ar.
 */
export function marcarSincronizadas(state: ProgressState, ids: string[]): ProgressState {
  if (ids.length === 0) return state;
  const enviadas = new Set(ids);
  return {
    ...state,
    tentativas: state.tentativas.map((tentativa) =>
      enviadas.has(tentativa.id) ? { ...tentativa, sincronizada: true } : tentativa,
    ),
  };
}

/** Aplica a conclusão de uma aula, preservando a data original e recalculando a sequência. */
export function applyCompletion(
  state: ProgressState,
  lessonId: string,
  score: number | undefined,
  now: Date = new Date(),
): ProgressState {
  const today = studyDate(now);
  const difference = state.lastStudyDate ? dayDifference(state.lastStudyDate, today) : undefined;
  const streak =
    difference === 0 ? Math.max(1, state.streak) : difference === 1 ? state.streak + 1 : 1;

  return {
    ...state,
    completed: state.completed.includes(lessonId)
      ? state.completed
      : [...state.completed, lessonId],
    completedAt: state.completedAt[lessonId]
      ? state.completedAt
      : { ...state.completedAt, [lessonId]: now.toISOString() },
    quizScores:
      score === undefined
        ? state.quizScores
        : { ...state.quizScores, [lessonId]: Math.max(score, state.quizScores[lessonId] ?? 0) },
    lastLesson: lessonId,
    lastStudyDate: today,
    streak,
  };
}
