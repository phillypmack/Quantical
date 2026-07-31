import {
  LEGACY_STORAGE_KEY,
  STORAGE_KEY,
  emptyState,
  parseProgressState,
} from "./state";
import type { ProgressState, SyncStatus } from "./types";

export type StoreSnapshot = {
  state: ProgressState;
  hydrated: boolean;
  syncStatus: SyncStatus;
  syncError?: string;
};

const serverSnapshot: StoreSnapshot = {
  state: emptyState,
  hydrated: false,
  syncStatus: "idle",
};

let snapshot: StoreSnapshot = serverSnapshot;
const listeners = new Set<() => void>();

function emit() {
  for (const listener of listeners) listener();
}

function persist(state: ProgressState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Cota estourada ou storage bloqueado (modo privado): o app segue
    // funcionando em memória, só não sobrevive ao reload.
  }
}

function readStoredState(): ProgressState {
  try {
    const current = localStorage.getItem(STORAGE_KEY);
    if (current) return parseProgressState(JSON.parse(current));

    // Migração v1 -> v2. O parser aceita a forma antiga e preenche o resto.
    const legacy = localStorage.getItem(LEGACY_STORAGE_KEY);
    if (legacy) {
      const migrated = parseProgressState(JSON.parse(legacy));
      persist(migrated);
      return migrated;
    }
  } catch {
    // Payload corrompido: recomeça limpo em vez de derrubar o app.
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignora */
    }
  }
  return { ...emptyState };
}

function hydrate() {
  if (snapshot.hydrated) return;
  snapshot = { ...snapshot, state: readStoredState(), hydrated: true };
}

export function subscribe(listener: () => void) {
  hydrate();
  listeners.add(listener);

  // Mantém abas do mesmo navegador em sincronia.
  const onStorage = (event: StorageEvent) => {
    if (event.key !== STORAGE_KEY) return;
    snapshot = { ...snapshot, state: readStoredState() };
    emit();
  };
  if (listeners.size === 1) window.addEventListener("storage", onStorage);

  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

export const getSnapshot = () => snapshot;
export const getServerSnapshot = () => serverSnapshot;

export function update(updater: (state: ProgressState) => ProgressState) {
  const next = updater(snapshot.state);
  if (next === snapshot.state) return;
  snapshot = { ...snapshot, state: next };
  if (snapshot.hydrated) persist(next);
  emit();
}

export function setSyncStatus(syncStatus: SyncStatus, syncError?: string) {
  if (snapshot.syncStatus === syncStatus && snapshot.syncError === syncError) return;
  snapshot = { ...snapshot, syncStatus, syncError };
  emit();
}

/** Só para testes: devolve o store ao estado inicial. */
export function resetStoreForTests() {
  snapshot = { state: { ...emptyState }, hydrated: false, syncStatus: "idle" };
  listeners.clear();
}
