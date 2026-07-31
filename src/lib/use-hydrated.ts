"use client";

import { useSyncExternalStore } from "react";

const subscribe = () => () => {};

/**
 * `false` durante o render do servidor e na primeira passada de hidratação;
 * `true` depois disso.
 *
 * Serve para valores que só existem em tempo de execução — semente aleatória,
 * tempo medido, formatação dependente de locale. Renderizá-los direto quebra
 * a hidratação, porque servidor e cliente produzem textos diferentes.
 */
export function useHydrated() {
  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
}
