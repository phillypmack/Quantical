"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useSyncExternalStore,
  type ReactNode,
} from "react";

import { applyCompletion, emptyState } from "@/lib/progress/state";
import * as store from "@/lib/progress/store";
import { synchronize } from "@/lib/progress/sync";
import type { ProgressState, SavedProject, SyncStatus } from "@/lib/progress/types";
import { getSupabaseBrowserClient, isSupabaseConfigured } from "@/lib/supabase/client";

export type { SavedProject } from "@/lib/progress/types";

type ProgressContextValue = ProgressState & {
  hydrated: boolean;
  syncStatus: SyncStatus;
  syncError?: string;
  completeLesson: (id: string, score?: number) => void;
  saveProject: (project: { id?: string; title: string; code: string; circuit?: SavedProject["circuit"] }) => string;
  removeProject: (id: string) => void;
  resetProgress: () => void;
  setUnlockOverride: (moduleId: string) => void;
};

const ProgressContext = createContext<ProgressContextValue | null>(null);

export function ProgressProvider({ children }: { children: ReactNode }) {
  // O estado vive num store externo (localStorage). useSyncExternalStore é o
  // encaixe certo e evita o setState-dentro-de-efeito que a v1 fazia na
  // hidratação, que dispara renders em cascata.
  const snapshot = useSyncExternalStore(
    store.subscribe,
    store.getSnapshot,
    store.getServerSnapshot,
  );

  const completeLesson = useCallback((id: string, score?: number) => {
    store.update((current) => applyCompletion(current, id, score));
  }, []);

  const saveProject = useCallback(
    (project: { id?: string; title: string; code: string; circuit?: SavedProject["circuit"] }) => {
      const id = project.id ?? crypto.randomUUID();
      store.update((current) => ({
        ...current,
        // Salvar de novo não pode ressuscitar a lápide de um id reaproveitado.
        deletedProjects: Object.fromEntries(
          Object.entries(current.deletedProjects).filter(([key]) => key !== id),
        ),
        projects: [
          {
            id,
            title: project.title,
            code: project.code,
            circuit: project.circuit,
            updatedAt: new Date().toISOString(),
          },
          ...current.projects.filter((item) => item.id !== id),
        ],
      }));
      return id;
    },
    [],
  );

  const removeProject = useCallback((id: string) => {
    store.update((current) => ({
      ...current,
      projects: current.projects.filter((project) => project.id !== id),
      // Lápide: sem ela o próximo sync baixa o projeto de volta.
      deletedProjects: { ...current.deletedProjects, [id]: new Date().toISOString() },
    }));
  }, []);

  const resetProgress = useCallback(() => {
    const resetAt = new Date().toISOString();
    store.update((current) => ({
      ...emptyState,
      // Marca o corte para o merge descartar conclusões remotas anteriores.
      resetAt,
      deletedProjects: Object.fromEntries(
        current.projects.map((project) => [project.id, resetAt]),
      ),
    }));
  }, []);

  const setUnlockOverride = useCallback((moduleId: string) => {
    store.update((current) =>
      current.unlockedOverrides.includes(moduleId)
        ? current
        : { ...current, unlockedOverrides: [...current.unlockedOverrides, moduleId] },
    );
  }, []);

  // Sincroniza ao hidratar e a cada mudança de sessão. Diferente da v1, não
  // depende de state.completed/state.projects — aquelas dependências faziam
  // toda conclusão disparar um getSession() novo quando ninguém estava logado.
  useEffect(() => {
    if (!snapshot.hydrated || !isSupabaseConfigured()) return;

    let cancelled = false;
    let unsubscribe: (() => void) | undefined;

    const run = async (userId: string | undefined) => {
      if (!userId || cancelled) return;
      const supabase = await getSupabaseBrowserClient();
      if (!supabase || cancelled) return;

      store.setSyncStatus("syncing");
      try {
        const merged = await synchronize(supabase, userId, store.getSnapshot().state);
        if (cancelled) return;
        store.update(() => merged);
        store.setSyncStatus("synced");
      } catch (error) {
        if (cancelled) return;
        // Falha de sync não pode travar o aprendizado: o app segue local e
        // avisa sem bloquear.
        store.setSyncStatus(
          typeof navigator !== "undefined" && !navigator.onLine ? "offline" : "error",
          error instanceof Error ? error.message : "Não foi possível sincronizar.",
        );
      }
    };

    void (async () => {
      const supabase = await getSupabaseBrowserClient();
      if (!supabase || cancelled) return;

      const { data } = await supabase.auth.getSession();
      void run(data.session?.user.id);

      const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
        void run(session?.user.id);
      });
      unsubscribe = () => listener.subscription.unsubscribe();
    })();

    return () => {
      cancelled = true;
      unsubscribe?.();
    };
  }, [snapshot.hydrated]);

  const value = useMemo<ProgressContextValue>(
    () => ({
      ...snapshot.state,
      hydrated: snapshot.hydrated,
      syncStatus: snapshot.syncStatus,
      syncError: snapshot.syncError,
      completeLesson,
      saveProject,
      removeProject,
      resetProgress,
      setUnlockOverride,
    }),
    [snapshot, completeLesson, saveProject, removeProject, resetProgress, setUnlockOverride],
  );

  return <ProgressContext.Provider value={value}>{children}</ProgressContext.Provider>;
}

export function useProgress() {
  const context = useContext(ProgressContext);
  if (!context) throw new Error("useProgress precisa estar dentro de ProgressProvider");
  return context;
}
