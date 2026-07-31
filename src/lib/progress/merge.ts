import type { ProgressState, SavedProject } from "./types";

export type RemoteLessonRow = { lesson_id: string; completed_at: string | null };
export type RemoteProjectRow = {
  id: string;
  title: string;
  code: string;
  circuit: unknown;
  updated_at: string;
};

const time = (iso: string | null | undefined, fallback = 0) => {
  if (!iso) return fallback;
  const parsed = Date.parse(iso);
  return Number.isNaN(parsed) ? fallback : parsed;
};

/**
 * Junta o estado local com o que veio do Supabase.
 *
 * A v1 fazia união pura e sem lápides, então três coisas quebravam:
 * apagar um projeto não colava (o sync baixava a linha de volta),
 * `resetProgress` era desfeito na sincronização seguinte, e projetos
 * editados em dois dispositivos se duplicavam. Aqui é last-write-wins por
 * `updatedAt`, com lápides ganhando de linhas remotas mais antigas.
 */
export function mergeProgress(
  local: ProgressState,
  remote: { lessons: RemoteLessonRow[]; projects: RemoteProjectRow[] },
): ProgressState {
  const resetAt = time(local.resetAt);

  const completed = new Set(local.completed);
  const completedAt = { ...local.completedAt };

  for (const row of remote.lessons) {
    // Conclusões anteriores ao último reset local não voltam.
    if (resetAt > 0 && time(row.completed_at, resetAt) <= resetAt) continue;
    completed.add(row.lesson_id);
    const remoteAt = row.completed_at;
    if (!remoteAt) continue;
    const current = completedAt[row.lesson_id];
    // Vale a data mais ANTIGA: é quando o aluno realmente concluiu.
    if (!current || time(remoteAt) < time(current)) completedAt[row.lesson_id] = remoteAt;
  }

  const byId = new Map<string, SavedProject>();
  for (const project of local.projects) byId.set(project.id, project);

  for (const row of remote.projects) {
    const deletedAt = local.deletedProjects[row.id];
    // Lápide mais nova que a linha remota => o projeto continua apagado.
    if (deletedAt && time(deletedAt) >= time(row.updated_at)) continue;

    const incoming: SavedProject = {
      id: row.id,
      title: row.title,
      code: row.code,
      circuit:
        typeof row.circuit === "object" &&
        row.circuit !== null &&
        "operations" in (row.circuit as Record<string, unknown>)
          ? (row.circuit as SavedProject["circuit"])
          : undefined,
      updatedAt: row.updated_at,
    };

    const existing = byId.get(row.id);
    if (!existing || time(incoming.updatedAt) > time(existing.updatedAt)) {
      byId.set(row.id, incoming);
    }
  }

  const projects = [...byId.values()]
    .filter((project) => {
      const deletedAt = local.deletedProjects[project.id];
      return !deletedAt || time(deletedAt) < time(project.updatedAt);
    })
    .sort((a, b) => time(b.updatedAt) - time(a.updatedAt));

  return { ...local, completed: [...completed], completedAt, projects };
}

/** Linhas remotas que o aluno apagou localmente e precisam ser removidas no servidor. */
export function projectsToDelete(
  local: ProgressState,
  remoteProjects: RemoteProjectRow[],
): string[] {
  return remoteProjects
    .filter((row) => {
      const deletedAt = local.deletedProjects[row.id];
      return Boolean(deletedAt) && time(deletedAt) >= time(row.updated_at);
    })
    .map((row) => row.id);
}
