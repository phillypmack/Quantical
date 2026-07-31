import { describe, expect, it } from "vitest";

import { mulberry32 } from "./rng";
import { sampleCounts, simulateCircuit } from "./simulator";
import type { Circuit, GateName, Operation } from "./types";

let counter = 0;
const op = (gate: GateName, targets: number[], extra: Partial<Operation> = {}): Operation => ({
  id: `op-${(counter += 1)}`,
  gate,
  targets,
  position: counter,
  ...extra,
});

const run = (qubits: number, operations: Operation[], extra: Partial<Circuit> = {}) =>
  simulateCircuit({ qubits, operations, shots: 1024, ...extra });

describe("captura passo a passo", () => {
  // É o que alimenta o cursor de tempo: sem isto o aluno só vê entrada e
  // saída, e a transformação — que é o conceito — fica invisível.
  it("guarda o estado inicial mais um instantâneo por porta", () => {
    const { steps } = run(2, [op("H", [0]), op("CNOT", [1], { controls: [0] })]);
    expect(steps).toHaveLength(3);
    expect(steps[0].afterOperation).toBe(-1);
    expect(steps[0].label).toBe("Estado inicial");
  });

  it("o último instantâneo é idêntico ao estado final", () => {
    const result = run(3, [op("H", [0]), op("CNOT", [1], { controls: [0] }), op("X", [2])]);
    const last = result.steps.at(-1)!;
    expect(last.amplitudes).toEqual(result.amplitudes);
    expect(last.probabilities).toEqual(result.probabilities);
  });

  it("mostra a superposição nascendo no passo certo", () => {
    const { steps } = run(2, [op("H", [0]), op("CNOT", [1], { controls: [0] })]);
    // Antes de qualquer porta: |00⟩ com certeza.
    expect(steps[0].probabilities[0]).toBeCloseTo(1, 10);
    // Depois do H: q0 em superposição, q1 ainda em |0⟩ e separável.
    expect(steps[1].blochVectors[0].x).toBeCloseTo(1, 10);
    expect(steps[1].blochVectors[1].z).toBeCloseTo(1, 10);
    expect(steps[1].blochVectors[0].length).toBeCloseTo(1, 10);
    // Depois do CNOT: emaranhados, nenhum dos dois tem estado próprio.
    expect(steps[2].blochVectors[0].length).toBeCloseTo(0, 10);
    expect(steps[2].blochVectors[1].length).toBeCloseTo(0, 10);
  });

  it("barreira e medição não viram passo próprio", () => {
    const { steps } = run(1, [op("H", [0]), op("BARRIER", [0]), op("MEASURE", [0])]);
    expect(steps).toHaveLength(2);
  });

  it("pode ser desligada explicitamente", () => {
    expect(run(2, [op("H", [0])], { captureSteps: false }).steps).toHaveLength(0);
  });
});

describe("amostragem com semente", () => {
  it("a mesma semente devolve exatamente as mesmas contagens", () => {
    const circuit: Circuit = { qubits: 1, operations: [op("H", [0])], shots: 500, seed: 42 };
    expect(simulateCircuit(circuit).counts).toEqual(simulateCircuit(circuit).counts);
  });

  it("sementes diferentes devolvem contagens diferentes", () => {
    const operations = [op("H", [0])];
    const a = simulateCircuit({ qubits: 1, operations, shots: 500, seed: 1 }).counts;
    const b = simulateCircuit({ qubits: 1, operations, shots: 500, seed: 2 }).counts;
    expect(a).not.toEqual(b);
  });

  it("a soma das contagens é sempre igual ao número de shots", () => {
    for (const shots of [1, 7, 256, 1024, 4096]) {
      const { counts } = run(2, [op("H", [0]), op("CNOT", [1], { controls: [0] })], { shots, seed: 7 });
      const total = Object.values(counts).reduce((sum, value) => sum + value, 0);
      expect(total).toBe(shots);
    }
  });

  // O ponto pedagógico: com shots de verdade o resultado NÃO é exatamente
  // 50/50. Ver 497/1024 é justamente a lição sobre medição.
  it("um estado de Bell mostra ruído amostral, não os 50% exatos", () => {
    const { counts } = run(2, [op("H", [0]), op("CNOT", [1], { controls: [0] })], {
      shots: 1024,
      seed: 20260730,
    });
    expect(Object.keys(counts).sort()).toEqual(["00", "11"]);
    expect(counts["00"]).toBeGreaterThan(430);
    expect(counts["00"]).toBeLessThan(590);
    expect(counts["00"]).not.toBe(512);
  });

  it("nunca amostra um estado de probabilidade zero", () => {
    const { counts } = run(2, [op("H", [0]), op("CNOT", [1], { controls: [0] })], { seed: 99 });
    expect(counts["01"]).toBeUndefined();
    expect(counts["10"]).toBeUndefined();
  });

  it("respeita a distribuição em circuitos desbalanceados", () => {
    // RY(2·acos(√0.8)) deixa ~80% em |0⟩.
    const theta = 2 * Math.acos(Math.sqrt(0.8));
    const { counts } = run(1, [op("RY", [0], { params: [theta] })], { shots: 8000, seed: 5 });
    expect(counts["0"] / 8000).toBeCloseTo(0.8, 1);
  });

  it("sampleCounts distribui de acordo com as probabilidades", () => {
    const counts = sampleCounts([0.25, 0.75], 1, 4000, mulberry32(3));
    expect(counts["1"] / 4000).toBeCloseTo(0.75, 1);
  });
});

describe("portas controladas generalizadas", () => {
  // Só possível depois de trocar `control?: number` por máscara de controles.
  it("Toffoli só inverte o alvo com os dois controles em 1", () => {
    const semControles = run(3, [op("CCX", [2], { controls: [0, 1] })]);
    expect(semControles.probabilities[0]).toBeCloseTo(1, 10);

    const umControle = run(3, [op("X", [0]), op("CCX", [2], { controls: [0, 1] })]);
    expect(umControle.probabilities[0b001]).toBeCloseTo(1, 10);

    const doisControles = run(3, [op("X", [0]), op("X", [1]), op("CCX", [2], { controls: [0, 1] })]);
    expect(doisControles.probabilities[0b111]).toBeCloseTo(1, 10);
  });

  it("MCX aceita quantos controles vierem", () => {
    const targets = [0, 1, 2, 3];
    const preparar = targets.map((qubit) => op("X", [qubit]));
    const result = run(5, [...preparar, op("MCX", [4], { controls: targets })]);
    expect(result.probabilities[0b11111]).toBeCloseTo(1, 10);
  });

  it("MCZ vira o sinal só do estado com todos os qubits em 1", () => {
    // Difusor de Grover: H em tudo, MCZ, e a amplitude de |11⟩ inverte.
    const result = run(2, [op("H", [0]), op("H", [1]), op("MCZ", [1], { controls: [0] })]);
    expect(result.amplitudes[0b11].re).toBeCloseTo(-0.5, 10);
    expect(result.amplitudes[0b00].re).toBeCloseTo(0.5, 10);
  });

  it("CSWAP troca os alvos apenas com o controle ligado", () => {
    const desligado = run(3, [op("X", [0]), op("CSWAP", [0, 1], { controls: [2] })]);
    expect(desligado.probabilities[0b001]).toBeCloseTo(1, 10);

    const ligado = run(3, [op("X", [0]), op("X", [2]), op("CSWAP", [0, 1], { controls: [2] })]);
    expect(ligado.probabilities[0b110]).toBeCloseTo(1, 10);
  });

  it("CP aplica fase controlada sem mexer nas probabilidades", () => {
    const result = run(2, [op("X", [0]), op("X", [1]), op("CP", [1], { controls: [0], params: [Math.PI] })]);
    expect(result.probabilities[0b11]).toBeCloseTo(1, 10);
    expect(result.amplitudes[0b11].re).toBeCloseTo(-1, 10);
  });

  it("recusa porta controlada sem controle", () => {
    // A validação antiga deixava passar e degradava em silêncio para um X.
    expect(() => run(2, [op("CNOT", [1])])).toThrow(/controle/i);
    expect(() => run(3, [op("CCX", [2], { controls: [0] })])).toThrow(/controle/i);
  });
});

describe("portas de um qubit acrescentadas", () => {
  it("S† desfaz S", () => {
    const result = run(1, [op("H", [0]), op("S", [0]), op("SDG", [0]), op("H", [0])]);
    expect(result.probabilities[0]).toBeCloseTo(1, 10);
  });

  it("T† desfaz T", () => {
    const result = run(1, [op("H", [0]), op("T", [0]), op("TDG", [0]), op("H", [0])]);
    expect(result.probabilities[0]).toBeCloseTo(1, 10);
  });

  it("√X aplicado duas vezes é X", () => {
    const result = run(1, [op("SX", [0]), op("SX", [0])]);
    expect(result.probabilities[1]).toBeCloseTo(1, 10);
  });

  it("P(π) sobre |1⟩ é Z", () => {
    const result = run(1, [op("X", [0]), op("P", [0], { params: [Math.PI] })]);
    expect(result.amplitudes[1].re).toBeCloseTo(-1, 10);
  });

  it("U(π, 0, π) é X", () => {
    const result = run(1, [op("U", [0], { params: [Math.PI, 0, Math.PI] })]);
    expect(result.probabilities[1]).toBeCloseTo(1, 10);
  });

  it("iSWAP troca e adiciona fase i", () => {
    const result = run(2, [op("X", [0]), op("ISWAP", [0, 1])]);
    expect(result.probabilities[0b10]).toBeCloseTo(1, 10);
    expect(result.amplitudes[0b10].im).toBeCloseTo(1, 10);
  });

  it("identidade e barreira não alteram o estado", () => {
    const result = run(1, [op("H", [0]), op("I", [0]), op("BARRIER", [0])]);
    expect(result.probabilities[0]).toBeCloseTo(0.5, 10);
    expect(result.probabilities[1]).toBeCloseTo(0.5, 10);
  });
});
