/// <reference lib="webworker" />

import { ParseError } from "@/lib/quantum/parser";
import { simulateCircuit } from "@/lib/quantum/simulator";
import {
  PROTOCOL_VERSION,
  type WorkerRequest,
  type WorkerResponse,
} from "@/lib/quantum/worker-protocol";

const reply = (response: WorkerResponse) => self.postMessage(response);

self.onmessage = (event: MessageEvent<WorkerRequest>) => {
  const request = event.data;

  // Mensagem de versão desconhecida ainda recebe resposta. Ficar em silêncio
  // deixava a UI presa em "Simulando…" para sempre.
  if (!request || request.v !== PROTOCOL_VERSION || request.type !== "simulate") {
    reply({
      v: PROTOCOL_VERSION,
      id: request?.id ?? "desconhecido",
      ok: false,
      error: { message: "Mensagem não reconhecida pelo simulador." },
    });
    return;
  }

  try {
    reply({
      v: PROTOCOL_VERSION,
      id: request.id,
      ok: true,
      result: simulateCircuit(request.payload),
    });
  } catch (error) {
    reply({
      v: PROTOCOL_VERSION,
      id: request.id,
      ok: false,
      error: {
        message: error instanceof Error ? error.message : "Não foi possível simular o circuito.",
        // Preserva linha, coluna e sugestão — antes tudo virava uma string só.
        issues: error instanceof ParseError ? error.issues : undefined,
      },
    });
  }
};

export {};
