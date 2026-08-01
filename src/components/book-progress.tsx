"use client";

import Link from "next/link";
import { useEffect, useMemo, useSyncExternalStore } from "react";
import { BookmarkCheck } from "lucide-react";

const STORAGE_KEY = "quantical:book-progress:v1";
const PROGRESS_EVENT = "quantical:book-progress";

type ReadingProgress = {
  lastPage: number;
  visited: number[];
  updatedAt: string;
};

function parseProgress(raw: string | null): ReadingProgress | null {
  try {
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<ReadingProgress>;
    if (!Number.isInteger(parsed.lastPage) || !Array.isArray(parsed.visited)) return null;
    return parsed as ReadingProgress;
  } catch {
    return null;
  }
}

function subscribe(callback: () => void) {
  const onStorage = (event: StorageEvent) => {
    if (event.key === STORAGE_KEY) callback();
  };
  window.addEventListener("storage", onStorage);
  window.addEventListener(PROGRESS_EVENT, callback);
  return () => {
    window.removeEventListener("storage", onStorage);
    window.removeEventListener(PROGRESS_EVENT, callback);
  };
}

function useReadingProgress() {
  const raw = useSyncExternalStore(
    subscribe,
    () => window.localStorage.getItem(STORAGE_KEY),
    () => null,
  );
  return useMemo(() => parseProgress(raw), [raw]);
}

export function BookProgressMarker({ pageNumber }: { pageNumber: number }) {
  const progress = useReadingProgress();

  useEffect(() => {
    const current = parseProgress(window.localStorage.getItem(STORAGE_KEY));
    const visited = Array.from(new Set([...(current?.visited ?? []), pageNumber])).sort((a, b) => a - b);
    const next: ReadingProgress = {
      lastPage: pageNumber,
      visited,
      updatedAt: new Date().toISOString(),
    };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    window.dispatchEvent(new Event(PROGRESS_EVENT));
  }, [pageNumber]);

  return (
    <span className="book-saved" aria-live="polite">
      <BookmarkCheck aria-hidden="true" size={15} />
      {progress?.visited.includes(pageNumber) ? "Página salva neste navegador" : "Salvando leitura…"}
    </span>
  );
}

export function BookResume({ publishedPages }: { publishedPages: number }) {
  const progress = useReadingProgress();
  const lastPage = progress?.lastPage ?? 1;
  const page = lastPage >= 1 && lastPage <= publishedPages ? lastPage : 1;

  return (
    <Link className="button button--light" href={`/livro/${page}`}>
      {page > 1 ? `Retomar na página ${page}` : "Começar a leitura"}
    </Link>
  );
}
