import type { ProgressState, SavedProject } from "./types";

export const STORAGE_KEY = "quantical:progress:v2";
export const LEGACY_STORAGE_KEY = "quantical:progress:v1";

export const emptyState: ProgressState = {
  version: 2,
  completed: [],
  completedAt: {},
  quizScores: {},
  streak: 0,
  projects: [],
  deletedProjects: {},
  unlockedOverrides: [],
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
