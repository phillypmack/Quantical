import { describe, expect, it } from "vitest";

import { circuitHref, decodeCircuit, encodeCircuit, readCircuitFromHash } from "./permalink";
import { simulateCircuit } from "./simulator";
import type { Circuit } from "./types";

const bell: Circuit = {
  qubits: 2,
  shots: 1024,
  operations: [
    { id: "op-0", gate: "H", targets: [0], position: 0 },
    { id: "op-1", gate: "CNOT", controls: [0], targets: [1], position: 1 },
  ],
};

describe("permalink de circuito", () => {
  it("ida e volta preserva o circuito", () => {
    const decoded = decodeCircuit(encodeCircuit(bell))!;
    expect(decoded.qubits).toBe(2);
    expect(decoded.operations.map((operation) => operation.gate)).toEqual(["H", "CNOT"]);
    expect(decoded.operations[1].controls).toEqual([0]);
  });

  it("preserva parâmetros de rotação", () => {
    const circuit: Circuit = {
      qubits: 1,
      shots: 1024,
      operations: [{ id: "op-0", gate: "RZ", targets: [0], params: [Math.PI / 3], position: 0 }],
    };
    const decoded = decodeCircuit(encodeCircuit(circuit))!;
    expect(decoded.operations[0].params?.[0]).toBeCloseTo(Math.PI / 3, 8);
  });

  it("o estado simulado é idêntico depois da ida e volta", () => {
    const before = simulateCircuit({ ...bell, seed: 1 });
    const after = simulateCircuit({ ...decodeCircuit(encodeCircuit(bell))!, seed: 1 });
    expect(after.probabilities).toEqual(before.probabilities);
  });

  it("usa apenas caracteres seguros para URL", () => {
    expect(encodeCircuit(bell)).toMatch(/^[A-Za-z0-9_-]+$/);
  });

  it("gera um link para o laboratório", () => {
    expect(circuitHref(bell)).toMatch(/^\/laboratorio#c=[A-Za-z0-9_-]+$/);
  });

  it("lê o circuito a partir do fragmento", () => {
    const decoded = readCircuitFromHash(circuitHref(bell).split("/laboratorio")[1]);
    expect(decoded?.operations).toHaveLength(2);
  });

  it("devolve null para entrada inválida em vez de quebrar", () => {
    for (const input of ["", "lixo", "!!!", encodeCircuit(bell).slice(0, 5)]) {
      expect(() => decodeCircuit(input)).not.toThrow();
    }
    expect(readCircuitFromHash("#semcircuito")).toBeNull();
  });

  it("recusa contagem de qubits fora do intervalo", () => {
    const forged = Buffer.from(JSON.stringify({ q: 99, o: [] })).toString("base64url");
    expect(decodeCircuit(forged)).toBeNull();
  });

  it("mantém o link curto para circuitos de aula", () => {
    expect(encodeCircuit(bell).length).toBeLessThan(120);
  });
});
