"use client";

import { ParseError, type ParseIssue } from "./parser";
import { simulateCircuit } from "./simulator";
import type { Circuit, SimulationResult } from "./types";
import { PROTOCOL_VERSION, type WorkerRequest, type WorkerResponse } from "./worker-protocol";

export class SimulationFailure extends Error {
  constructor(message: string, readonly issues?: ParseIssue[]) {
    super(message);
    this.name = "SimulationFailure";
  }
}

/** Acima disto o worker é considerado travado e reiniciado. */
const WATCHDOG_MS = 10_000;

type Pending = {
  resolve: (result: SimulationResult) => void;
  reject: (error: SimulationFailure) => void;
  timer: ReturnType<typeof setTimeout>;
};

/**
 * Cliente do worker de simulação.
 *
 * A versão anterior não tinha timeout, nem `onerror`, nem correlação de
 * requisições: se o worker falhasse ao carregar, `running` ficava true para
 * sempre e o botão Executar morria até recarregar a página. E uma execução
 * lenta podia sobrescrever o resultado de outra disparada depois dela.
 */
export class SimulatorClient {
  private worker: Worker | null = null;
  private pending = new Map<string, Pending>();
  private counter = 0;
  private workerBroken = false;

  private spawn(): Worker | null {
    if (this.workerBroken) return null;
    if (this.worker) return this.worker;

    try {
      const worker = new Worker(new URL("../../workers/quantum.worker.ts", import.meta.url));
      worker.onmessage = (event: MessageEvent<WorkerResponse>) => this.receive(event.data);
      // Sem isto, uma falha de carregamento do módulo passava despercebida.
      worker.onerror = () => this.failAll("O simulador parou de responder. Tentando de novo…");
      worker.onmessageerror = () => this.failAll("Resposta ilegível do simulador.");
      this.worker = worker;
      return worker;
    } catch {
      // Ambiente sem Worker: cai para o caminho síncrono.
      this.workerBroken = true;
      return null;
    }
  }

  private receive(response: WorkerResponse) {
    if (!response || response.v !== PROTOCOL_VERSION) return;
    const entry = this.pending.get(response.id);
    // Resposta de uma execução já superada: descarta em vez de sobrescrever.
    if (!entry) return;
    clearTimeout(entry.timer);
    this.pending.delete(response.id);

    if (response.ok) entry.resolve(response.result);
    else entry.reject(new SimulationFailure(response.error.message, response.error.issues));
  }

  private failAll(message: string) {
    for (const [, entry] of this.pending) {
      clearTimeout(entry.timer);
      entry.reject(new SimulationFailure(message));
    }
    this.pending.clear();
    this.restart();
  }

  private restart() {
    this.worker?.terminate();
    this.worker = null;
  }

  async run(circuit: Circuit): Promise<SimulationResult> {
    const worker = this.spawn();

    // Sem worker: simula na thread principal. Circuitos de aula são pequenos.
    if (!worker) return runSync(circuit);

    const id = `req-${(this.counter += 1)}`;
    const request: WorkerRequest = { v: PROTOCOL_VERSION, id, type: "simulate", payload: circuit };

    return new Promise<SimulationResult>((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pending.delete(id);
        // Worker travado: mata, reinicia e avisa em vez de pendurar a UI.
        this.restart();
        reject(new SimulationFailure("A simulação demorou demais e foi interrompida."));
      }, WATCHDOG_MS);

      this.pending.set(id, { resolve, reject, timer });
      worker.postMessage(request);
    });
  }

  dispose() {
    for (const [, entry] of this.pending) clearTimeout(entry.timer);
    this.pending.clear();
    this.restart();
  }
}

/** Execução síncrona, para o fallback e para simulações minúsculas ao vivo. */
export function runSync(circuit: Circuit): SimulationResult {
  try {
    return simulateCircuit(circuit);
  } catch (error) {
    if (error instanceof ParseError) throw new SimulationFailure(error.message, error.issues);
    throw new SimulationFailure(
      error instanceof Error ? error.message : "Não foi possível simular o circuito.",
    );
  }
}
