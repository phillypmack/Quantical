import type { Circuit, SimulationResult } from "./types";

/**
 * Protocolo do worker de simulação.
 *
 * A versão anterior mandava um `Circuit` cru e recebia
 * `{ result } | { error: string }` — sem id, sem versão, sem tipo. Isso
 * causava dois problemas concretos: uma execução lenta podia sobrescrever o
 * resultado de uma execução rápida disparada depois, e qualquer detalhe do
 * erro (linha, coluna, sugestão) era achatado para uma string.
 */
export const PROTOCOL_VERSION = 1;

export type WorkerRequest = {
  v: typeof PROTOCOL_VERSION;
  id: string;
  type: "simulate";
  payload: Circuit;
};

export type WorkerFailure = {
  message: string;
  issues?: { line: number; column?: number; message: string; suggestion?: string }[];
};

export type WorkerResponse =
  | { v: typeof PROTOCOL_VERSION; id: string; ok: true; result: SimulationResult }
  | { v: typeof PROTOCOL_VERSION; id: string; ok: false; error: WorkerFailure };
