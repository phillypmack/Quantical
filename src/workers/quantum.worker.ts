/// <reference lib="webworker" />

import { simulateCircuit } from "@/lib/quantum/simulator";
import type { Circuit } from "@/lib/quantum/types";

self.onmessage = (event: MessageEvent<Circuit>) => {
  try {
    self.postMessage({ result: simulateCircuit(event.data) });
  } catch (error) {
    self.postMessage({
      error: error instanceof Error ? error.message : "Não foi possível simular o circuito.",
    });
  }
};

export {};
