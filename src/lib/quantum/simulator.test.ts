import { describe, expect, it } from "vitest";

import { parseQiskit } from "./parser";
import { circuitToQiskit } from "./qiskit";
import { simulateCircuit } from "./simulator";
import type { Circuit } from "./types";

const circuit = (qubits: number, operations: Circuit["operations"]): Circuit => ({
  qubits,
  operations,
  shots: 1024,
});

describe("simulador statevector", () => {
  it("cria superposição uniforme com H|0⟩", () => {
    const result = simulateCircuit(
      circuit(1, [{ id: "h", gate: "H", targets: [0], position: 0 }]),
    );
    expect(result.probabilities[0]).toBeCloseTo(0.5, 8);
    expect(result.probabilities[1]).toBeCloseTo(0.5, 8);
    expect(result.blochVectors[0].x).toBeCloseTo(1, 8);
  });

  it("cria um estado de Bell", () => {
    const result = simulateCircuit(
      circuit(2, [
        { id: "h", gate: "H", targets: [0], position: 0 },
        { id: "cx", gate: "CNOT", controls: [0], targets: [1], position: 1 },
      ]),
    );
    expect(result.probabilities[0]).toBeCloseTo(0.5, 8);
    expect(result.probabilities[3]).toBeCloseTo(0.5, 8);
    expect(result.probabilities[1]).toBeCloseTo(0, 8);
  });

  it("preserva a normalização após rotações", () => {
    const result = simulateCircuit(
      circuit(1, [
        { id: "rx", gate: "RX", targets: [0], params: [Math.PI / 3], position: 0 },
        { id: "ry", gate: "RY", targets: [0], params: [Math.PI / 5], position: 1 },
      ]),
    );
    expect(result.probabilities.reduce((sum, value) => sum + value, 0)).toBeCloseTo(1, 8);
  });

  it("cria um estado GHZ de três qubits", () => {
    const result = simulateCircuit(
      circuit(3, [
        { id: "h", gate: "H", targets: [0], position: 0 },
        { id: "cx-1", gate: "CNOT", controls: [0], targets: [1], position: 1 },
        { id: "cx-2", gate: "CNOT", controls: [1], targets: [2], position: 2 },
      ]),
    );
    expect(result.probabilities[0]).toBeCloseTo(0.5, 8);
    expect(result.probabilities[7]).toBeCloseTo(0.5, 8);
  });

  it("troca dois qubits com SWAP", () => {
    const result = simulateCircuit(
      circuit(2, [
        { id: "x", gate: "X", targets: [0], position: 0 },
        { id: "swap", gate: "SWAP", targets: [0, 1], position: 1 },
      ]),
    );
    expect(result.probabilities[2]).toBeCloseTo(1, 8);
  });

  it("recusa circuitos acima do limite", () => {
    expect(() => simulateCircuit(circuit(7, []))).toThrow(/1 e 6 qubits/);
  });
});

describe("Qiskit", () => {
  it("interpreta um subconjunto de Python", () => {
    const parsed = parseQiskit(`
      from qiskit import QuantumCircuit
      qc = QuantumCircuit(2)
      qc.h(0)
      qc.cx(0, 1)
      qc.measure_all()
    `);
    expect(parsed.qubits).toBe(2);
    expect(parsed.operations.map((operation) => operation.gate)).toEqual(["H", "CNOT", "MEASURE"]);
  });

  it("serializa e reinterpreta um circuito", () => {
    const source = circuit(2, [
      { id: "h", gate: "H", targets: [0], position: 0 },
      { id: "cx", gate: "CNOT", controls: [0], targets: [1], position: 1 },
    ]);
    const parsed = parseQiskit(circuitToQiskit(source));
    expect(parsed.operations.slice(0, 2).map((operation) => operation.gate)).toEqual(["H", "CNOT"]);
  });
});
