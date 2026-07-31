import type { SupabaseClient } from "@supabase/supabase-js";

import { mergeProgress, projectsToDelete, type RemoteLessonRow, type RemoteProjectRow } from "./merge";
import type { ProgressState } from "./types";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export class SyncError extends Error {
  constructor(step: string, cause: string) {
    super(`Falha ao sincronizar (${step}): ${cause}`);
    this.name = "SyncError";
  }
}

/**
 * Empurra o estado local, baixa o remoto e devolve a fusão dos dois.
 *
 * A v1 ignorava o campo `error` das quatro chamadas, então uma sessão
 * expirada ou uma rejeição de RLS viravam silenciosamente "nenhum dado
 * remoto" — e o merge aditivo então reescrevia o servidor com o que havia
 * localmente. Aqui qualquer passo que falhe interrompe e propaga.
 */
export async function synchronize(
  supabase: SupabaseClient,
  userId: string,
  local: ProgressState,
): Promise<ProgressState> {
  // 1. Conclusões. `completed_at` vai com a data ORIGINAL guardada em
  //    completedAt — a v1 mandava new Date() e apagava o histórico a cada sync.
  if (local.completed.length > 0) {
    const { error } = await supabase.from("lesson_progress").upsert(
      local.completed.map((lessonId) => ({
        user_id: userId,
        lesson_id: lessonId,
        progress: 100,
        completed_at: local.completedAt[lessonId] ?? null,
      })),
      { onConflict: "user_id,lesson_id" },
    );
    if (error) throw new SyncError("enviar progresso", error.message);
  }

  // 2. Projetos. Ids não-UUID são deixados de fora em vez de ganharem um
  //    randomUUID novo a cada execução (a v1 inseria uma linha extra por sync).
  const uploadable = local.projects.filter((project) => UUID.test(project.id));
  if (uploadable.length > 0) {
    const { error } = await supabase.from("projects").upsert(
      uploadable.map((project) => ({
        id: project.id,
        user_id: userId,
        title: project.title,
        code: project.code,
        // Só manda `circuit` quando existe de fato; a v1 mandava {} sempre
        // e zerava a coluna jsonb remota.
        ...(project.circuit ? { circuit: project.circuit } : {}),
        updated_at: project.updatedAt,
      })),
      { onConflict: "id" },
    );
    if (error) throw new SyncError("enviar projetos", error.message);
  }

  // 3. Metadados de progresso, que antes nunca saíam do dispositivo.
  const { error: profileError } = await supabase.from("profiles").upsert(
    {
      id: userId,
      streak: local.streak,
      last_lesson: local.lastLesson ?? null,
      last_study_date: local.lastStudyDate ?? null,
      quiz_scores: local.quizScores,
    },
    { onConflict: "id" },
  );
  if (profileError) throw new SyncError("enviar perfil", profileError.message);

  // 4. Baixa o remoto.
  const [lessons, projects] = await Promise.all([
    supabase.from("lesson_progress").select("lesson_id,completed_at").eq("user_id", userId).eq("progress", 100),
    supabase.from("projects").select("id,title,code,circuit,updated_at").eq("user_id", userId).order("updated_at", { ascending: false }),
  ]);
  if (lessons.error) throw new SyncError("baixar progresso", lessons.error.message);
  if (projects.error) throw new SyncError("baixar projetos", projects.error.message);

  const remoteProjects = (projects.data ?? []) as RemoteProjectRow[];

  // 5. Propaga exclusões: sem isto o passo 4 ressuscita o que foi apagado.
  const toDelete = projectsToDelete(local, remoteProjects);
  if (toDelete.length > 0) {
    const { error } = await supabase.from("projects").delete().in("id", toDelete).eq("user_id", userId);
    if (error) throw new SyncError("remover projetos", error.message);
  }

  return mergeProgress(local, {
    lessons: (lessons.data ?? []) as RemoteLessonRow[],
    projects: remoteProjects.filter((row) => !toDelete.includes(row.id)),
  });
}

/** Registra a tentativa de quiz. A tabela existia no schema e nunca era escrita. */
export async function recordQuizAttempt(
  supabase: SupabaseClient,
  userId: string,
  lessonId: string,
  score: number,
  answers: Record<string, unknown>,
) {
  const { error } = await supabase
    .from("quiz_attempts")
    .insert({ user_id: userId, lesson_id: lessonId, score, answers });
  if (error) throw new SyncError("registrar tentativa", error.message);
}
