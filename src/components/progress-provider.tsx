"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

import { getSupabaseBrowserClient } from "@/lib/supabase/client";

export type SavedProject = {
  id: string;
  title: string;
  code: string;
  updatedAt: string;
};

type ProgressState = {
  completed: string[];
  quizScores: Record<string, number>;
  lastLesson?: string;
  lastStudyDate?: string;
  streak: number;
  projects: SavedProject[];
};

type ProgressContextValue = ProgressState & {
  hydrated: boolean;
  completeLesson: (id: string, score?: number) => void;
  saveProject: (project: Omit<SavedProject, "id" | "updatedAt"> & { id?: string }) => string;
  removeProject: (id: string) => void;
  resetProgress: () => void;
};

const initialState: ProgressState = {
  completed: [],
  quizScores: {},
  streak: 0,
  projects: [],
};

const ProgressContext = createContext<ProgressContextValue | null>(null);
const storageKey = "quantical:progress:v1";

function dayDifference(first: string, second: string) {
  const a = new Date(`${first}T12:00:00`).getTime();
  const b = new Date(`${second}T12:00:00`).getTime();
  return Math.round((b - a) / 86_400_000);
}

export function ProgressProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<ProgressState>(initialState);
  const [hydrated, setHydrated] = useState(false);
  const syncAttempted = useRef(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) setState({ ...initialState, ...JSON.parse(saved) });
    } catch {
      localStorage.removeItem(storageKey);
    } finally {
      setHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (hydrated) localStorage.setItem(storageKey, JSON.stringify(state));
  }, [state, hydrated]);

  useEffect(() => {
    if (!hydrated || syncAttempted.current) return;
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;
    syncAttempted.current = true;

    async function synchronize() {
      const { data: sessionData } = await supabase!.auth.getSession();
      const user = sessionData.session?.user;
      if (!user) {
        syncAttempted.current = false;
        return;
      }

      if (state.completed.length) {
        await supabase!.from("lesson_progress").upsert(
          state.completed.map((lessonId) => ({
            user_id: user.id,
            lesson_id: lessonId,
            progress: 100,
            completed_at: new Date().toISOString(),
          })),
          { onConflict: "user_id,lesson_id" },
        );
      }
      if (state.projects.length) {
        await supabase!.from("projects").upsert(
          state.projects.map((project) => ({
            id: /^[0-9a-f-]{36}$/i.test(project.id) ? project.id : crypto.randomUUID(),
            user_id: user.id,
            title: project.title,
            code: project.code,
            circuit: {},
            updated_at: project.updatedAt,
          })),
        );
      }

      const [remoteProgress, remoteProjects] = await Promise.all([
        supabase!.from("lesson_progress").select("lesson_id").eq("user_id", user.id).eq("progress", 100),
        supabase!.from("projects").select("id,title,code,updated_at").eq("user_id", user.id).order("updated_at", { ascending: false }),
      ]);

      setState((current) => ({
        ...current,
        completed: Array.from(
          new Set([
            ...current.completed,
            ...(remoteProgress.data ?? []).map((item) => item.lesson_id as string),
          ]),
        ),
        projects: [
          ...(remoteProjects.data ?? []).map((project) => ({
            id: project.id as string,
            title: project.title as string,
            code: project.code as string,
            updatedAt: project.updated_at as string,
          })),
          ...current.projects.filter(
            (local) => !(remoteProjects.data ?? []).some((remote) => remote.id === local.id),
          ),
        ],
      }));
    }

    void synchronize();
  }, [hydrated, state.completed, state.projects]);

  const completeLesson = useCallback((id: string, score?: number) => {
    setState((current) => {
      const today = new Date().toISOString().slice(0, 10);
      const difference = current.lastStudyDate
        ? dayDifference(current.lastStudyDate, today)
        : undefined;
      const streak =
        difference === 0
          ? current.streak
          : difference === 1
            ? current.streak + 1
            : 1;
      return {
        ...current,
        completed: current.completed.includes(id)
          ? current.completed
          : [...current.completed, id],
        quizScores:
          score === undefined
            ? current.quizScores
            : { ...current.quizScores, [id]: Math.max(score, current.quizScores[id] ?? 0) },
        lastLesson: id,
        lastStudyDate: today,
        streak,
      };
    });
  }, []);

  const saveProject = useCallback(
    (project: Omit<SavedProject, "id" | "updatedAt"> & { id?: string }) => {
      const id = project.id ?? crypto.randomUUID();
      setState((current) => ({
        ...current,
        projects: [
          { id, title: project.title, code: project.code, updatedAt: new Date().toISOString() },
          ...current.projects.filter((item) => item.id !== id),
        ],
      }));
      return id;
    },
    [],
  );

  const removeProject = useCallback((id: string) => {
    setState((current) => ({
      ...current,
      projects: current.projects.filter((project) => project.id !== id),
    }));
  }, []);

  const resetProgress = useCallback(() => setState(initialState), []);

  const value = useMemo(
    () => ({
      ...state,
      hydrated,
      completeLesson,
      saveProject,
      removeProject,
      resetProgress,
    }),
    [state, hydrated, completeLesson, saveProject, removeProject, resetProgress],
  );

  return <ProgressContext.Provider value={value}>{children}</ProgressContext.Provider>;
}

export function useProgress() {
  const context = useContext(ProgressContext);
  if (!context) throw new Error("useProgress precisa estar dentro de ProgressProvider");
  return context;
}
