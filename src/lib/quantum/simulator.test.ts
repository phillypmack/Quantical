import { describe, expect, it } from "vitest";

import { challenges } from "@/data/challenges";
import { distanciaDeBloch } from "@/components/quantum/bloch-sphere";
import { parseQiskit } from "./parser";
import { circuitToQiskit } from "./qiskit";
import { simulateCircuit } from "./simulator";
import { MAX_QUBITS, type Circuit } from "./types";

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
    expect(() => simulateCircuit(circuit(MAX_QUBITS + 1, []))).toThrow(
      new RegExp(`1 e ${MAX_QUBITS} qubits`),
    );
  });

  // O teto era 6, cravado em três arquivos. Com Float64Array, 16 qubits são
  // 2^16 amplitudes e rodam instantaneamente.
  it("simula no teto de qubits sem estourar", () => {
    const result = simulateCircuit(circuit(MAX_QUBITS, [
      { id: "h", gate: "H", targets: [0], position: 0 },
      { id: "cx", gate: "CNOT", controls: [0], targets: [MAX_QUBITS - 1], position: 1 },
    ]));
    expect(result.probabilities).toHaveLength(2 ** MAX_QUBITS);
    expect(result.probabilities.reduce((sum, value) => sum + value, 0)).toBeCloseTo(1, 8);
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

describe("distância até o estado alvo", () => {
  it("é zero quando o estado já é o alvo", () => {
    const alvo = { x: 1, y: 0, z: 0, length: 1 };
    expect(distanciaDeBloch(alvo, alvo)).toBe(0);
  });

  it("é máxima entre polos opostos", () => {
    // |0⟩ e |1⟩ são antípodas: a distância é o diâmetro.
    expect(
      distanciaDeBloch({ x: 0, y: 0, z: 1, length: 1 }, { x: 0, y: 0, z: -1, length: 1 }),
    ).toBe(2);
  });

  it("encolhe conforme o estado se aproxima do alvo", () => {
    const alvo = { x: 1, y: 0, z: 0, length: 1 };
    const longe = distanciaDeBloch({ x: 0, y: 0, z: 1, length: 1 }, alvo);
    const perto = distanciaDeBloch({ x: 0.9, y: 0, z: 0.44, length: 1 }, alvo);
    expect(perto).toBeLessThan(longe);
  });

  it("o alvo de cada exercício sai da própria solução de referência", () => {
    // Se isto quebrar, algum exercício ganhou uma solução que não parseia — e
    // aí a esfera deixaria de mostrar para onde ir, em silêncio.
    for (const challenge of challenges) {
      const circuito = parseQiskit(challenge.exercise.solutionCode);
      const alvo = simulateCircuit({ ...circuito, seed: 1, captureSteps: false }).blochVectors;
      expect(alvo, challenge.id).toHaveLength(circuito.qubits);
      for (const vetor of alvo) {
        expect(Number.isFinite(vetor.x) && Number.isFinite(vetor.z), challenge.id).toBe(true);
      }
    }
  });
});
