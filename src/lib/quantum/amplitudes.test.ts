import { describe, expect, it } from "vitest";

import { simulateCircuit } from "./simulator";
import type { Circuit, ComplexValue, GateName, Operation } from "./types";

/**
 * Testes no nível de AMPLITUDE, com parte real e imaginária.
 *
 * A suíte anterior só verificava `probabilities` (mais um único bloch.x), e
 * `|amp|²` descarta a fase: Y, Z, S, T e RZ não eram executadas por teste
 * nenhum, então um sinal trocado numa componente imaginária passaria pelo CI
 * em silêncio. Estes testes existem para travar a fase ANTES de qualquer
 * refatoração do núcleo (Float64Array, applyControlled).
 */

const INV = Math.SQRT1_2;

let counter = 0;
const op = (gate: GateName, targets: number[], extra: Partial<Operation> = {}): Operation => ({
  id: `op-${(counter += 1)}`,
  gate,
  targets,
  position: counter,
  ...extra,
});

const circuit = (qubits: number, operations: Operation[]): Circuit => ({
  qubits,
  operations,
  shots: 128,
});

const run = (qubits: number, operations: Operation[]) => simulateCircuit(circuit(qubits, operations));

function expectAmplitudes(actual: ComplexValue[], expected: [number, number][], precision = 10) {
  expect(actual).toHaveLength(expected.length);
  actual.forEach((amplitude, index) => {
    const [re, im] = expected[index];
    expect(amplitude.re, `re[${index}]`).toBeCloseTo(re, precision);
    expect(amplitude.im, `im[${index}]`).toBeCloseTo(im, precision);
  });
}

describe("amplitudes de cada porta sobre |0⟩", () => {
  it("H|0⟩ = (|0⟩ + |1⟩)/√2", () => {
    expectAmplitudes(run(1, [op("H", [0])]).amplitudes, [[INV, 0], [INV, 0]]);
  });

  it("X|0⟩ = |1⟩", () => {
    expectAmplitudes(run(1, [op("X", [0])]).amplitudes, [[0, 0], [1, 0]]);
  });

  // Y|0⟩ = i|1⟩ — a parte imaginária é o ponto do teste.
  it("Y|0⟩ = i|1⟩", () => {
    expectAmplitudes(run(1, [op("Y", [0])]).amplitudes, [[0, 0], [0, 1]]);
  });

  it("Z|0⟩ = |0⟩ e Z|1⟩ = −|1⟩", () => {
    expectAmplitudes(run(1, [op("Z", [0])]).amplitudes, [[1, 0], [0, 0]]);
    expectAmplitudes(run(1, [op("X", [0]), op("Z", [0])]).amplitudes, [[0, 0], [-1, 0]]);
  });

  it("S|1⟩ = i|1⟩", () => {
    expectAmplitudes(run(1, [op("X", [0]), op("S", [0])]).amplitudes, [[0, 0], [0, 1]]);
  });

  it("T|1⟩ = e^{iπ/4}|1⟩", () => {
    expectAmplitudes(run(1, [op("X", [0]), op("T", [0])]).amplitudes, [[0, 0], [INV, INV]]);
  });

  it("RX(π)|0⟩ = −i|1⟩", () => {
    expectAmplitudes(run(1, [op("RX", [0], { params: [Math.PI] })]).amplitudes, [[0, 0], [0, -1]]);
  });

  it("RY(π)|0⟩ = |1⟩ (sem fase imaginária)", () => {
    expectAmplitudes(run(1, [op("RY", [0], { params: [Math.PI] })]).amplitudes, [[0, 0], [1, 0]]);
  });

  // RZ só mexe na fase: sobre |0⟩ as probabilidades não mudam nada, e é por
  // isso que a suíte antiga não conseguiria detectar erro nenhum aqui.
  it("RZ(π/2)|0⟩ = e^{−iπ/4}|0⟩", () => {
    expectAmplitudes(run(1, [op("RZ", [0], { params: [Math.PI / 2] })]).amplitudes, [
      [Math.cos(Math.PI / 4), -Math.sin(Math.PI / 4)],
      [0, 0],
    ]);
  });

  it("RZ sobre |+⟩ leva a fase relativa para o eixo y", () => {
    const { blochVectors } = run(1, [op("H", [0]), op("RZ", [0], { params: [Math.PI / 2] })]);
    expect(blochVectors[0].x).toBeCloseTo(0, 10);
    expect(blochVectors[0].y).toBeCloseTo(1, 10);
    expect(blochVectors[0].z).toBeCloseTo(0, 10);
  });
});

describe("identidades algébricas", () => {
  const identity = (qubits: number, operations: Operation[]) => {
    const { amplitudes } = run(qubits, operations);
    const expected: [number, number][] = Array.from({ length: 2 ** qubits }, (_, index) =>
      index === 0 ? [1, 0] : [0, 0],
    );
    expectAmplitudes(amplitudes, expected);
  };

  it("H·H = I", () => identity(1, [op("H", [0]), op("H", [0])]));
  it("X·X = I", () => identity(1, [op("X", [0]), op("X", [0])]));
  it("Y·Y = I", () => identity(1, [op("Y", [0]), op("Y", [0])]));
  it("S·S = Z, então S⁴ = I", () => identity(1, [op("S", [0]), op("S", [0]), op("S", [0]), op("S", [0])]));
  it("T⁸ = I", () => identity(1, Array.from({ length: 8 }, () => op("T", [0]))));

  // H·Z·H = X. É a base pedagógica do phase kickback: a fase invisível de Z
  // vira resultado determinístico depois da interferência.
  it("H·Z·H = X", () => {
    expectAmplitudes(run(1, [op("H", [0]), op("Z", [0]), op("H", [0])]).amplitudes, [[0, 0], [1, 0]]);
  });

  it("H·X·H = Z", () => {
    // Sobre |1⟩, Z devolve −|1⟩; via H·X·H o resultado tem que ser o mesmo.
    expectAmplitudes(run(1, [op("X", [0]), op("H", [0]), op("X", [0]), op("H", [0])]).amplitudes, [
      [0, 0],
      [-1, 0],
    ]);
  });

  it("S·S aplicado a |1⟩ equivale a Z", () => {
    expectAmplitudes(run(1, [op("X", [0]), op("S", [0]), op("S", [0])]).amplitudes, [[0, 0], [-1, 0]]);
  });

  it("CZ = H(alvo)·CNOT·H(alvo)", () => {
    const viaCZ = run(2, [op("H", [0]), op("X", [1]), op("CZ", [1], { controls: [0] })]);
    const viaCNOT = run(2, [
      op("H", [0]),
      op("X", [1]),
      op("H", [1]),
      op("CNOT", [1], { controls: [0] }),
      op("H", [1]),
    ]);
    expect(viaCZ.amplitudes.map((a) => [a.re, a.im])).toEqual(
      viaCNOT.amplitudes.map((a) => [
        expect.closeTo(a.re, 10) as unknown as number,
        expect.closeTo(a.im, 10) as unknown as number,
      ]),
    );
  });

  it("SWAP = CNOT(a,b)·CNOT(b,a)·CNOT(a,b)", () => {
    const viaSwap = run(2, [op("H", [0]), op("SWAP", [0, 1])]);
    const viaCnots = run(2, [
      op("H", [0]),
      op("CNOT", [1], { controls: [0] }),
      op("CNOT", [0], { controls: [1] }),
      op("CNOT", [1], { controls: [0] }),
    ]);
    viaSwap.amplitudes.forEach((amplitude, index) => {
      expect(amplitude.re).toBeCloseTo(viaCnots.amplitudes[index].re, 10);
      expect(amplitude.im).toBeCloseTo(viaCnots.amplitudes[index].im, 10);
    });
  });
});

describe("vetores de Bloch nos três eixos", () => {
  it("|+⟩ aponta para +x", () => {
    const [vector] = run(1, [op("H", [0])]).blochVectors;
    expect(vector.x).toBeCloseTo(1, 10);
    expect(vector.y).toBeCloseTo(0, 10);
    expect(vector.z).toBeCloseTo(0, 10);
  });

  // Este é o teste que fixa o SINAL do y (−2·Im ρ01). Nada na suíte antiga
  // tocava nessa componente.
  it("|+i⟩ = S·H|0⟩ aponta para +y", () => {
    const [vector] = run(1, [op("H", [0]), op("S", [0])]).blochVectors;
    expect(vector.x).toBeCloseTo(0, 10);
    expect(vector.y).toBeCloseTo(1, 10);
    expect(vector.z).toBeCloseTo(0, 10);
  });

  it("|−i⟩ aponta para −y", () => {
    const [vector] = run(1, [op("H", [0]), op("S", [0]), op("Z", [0])]).blochVectors;
    expect(vector.y).toBeCloseTo(-1, 10);
  });

  it("|0⟩ aponta para +z e |1⟩ para −z", () => {
    expect(run(1, []).blochVectors[0].z).toBeCloseTo(1, 10);
    expect(run(1, [op("X", [0])]).blochVectors[0].z).toBeCloseTo(-1, 10);
  });

  // Num par de Bell nenhum qubit tem estado próprio: o vetor reduzido tem
  // comprimento zero. Hoje a UI desenha isso como uma seta de tamanho zero
  // sem explicação nenhuma.
  it("qubits emaranhados têm vetor de comprimento zero", () => {
    const { blochVectors } = run(2, [op("H", [0]), op("CNOT", [1], { controls: [0] })]);
    for (const vector of blochVectors) {
      const length = Math.hypot(vector.x, vector.y, vector.z);
      expect(length).toBeCloseTo(0, 10);
    }
  });

  it("qubits separáveis têm vetor de comprimento um", () => {
    const { blochVectors } = run(2, [op("H", [0]), op("X", [1])]);
    for (const vector of blochVectors) {
      expect(Math.hypot(vector.x, vector.y, vector.z)).toBeCloseTo(1, 10);
    }
  });
});

describe("unitariedade", () => {
  const gates: { gate: GateName; params?: number[] }[] = [
    { gate: "H" }, { gate: "X" }, { gate: "Y" }, { gate: "Z" }, { gate: "S" }, { gate: "T" },
    { gate: "RX", params: [0.7] }, { gate: "RY", params: [1.9] }, { gate: "RZ", params: [2.4] },
  ];

  it("a norma se mantém em circuitos aleatórios", () => {
    // Sequência determinística: um teste que falha só às vezes não serve.
    let seed = 12345;
    const next = () => {
      seed = (1103515245 * seed + 12345) % 2147483648;
      return seed / 2147483648;
    };

    for (let trial = 0; trial < 40; trial += 1) {
      const qubits = 1 + Math.floor(next() * 4);
      const operations: Operation[] = [];
      for (let index = 0; index < 12; index += 1) {
        const target = Math.floor(next() * qubits);
        if (qubits > 1 && next() < 0.3) {
          const control = (target + 1 + Math.floor(next() * (qubits - 1))) % qubits;
          operations.push(op(next() < 0.5 ? "CNOT" : "CZ", [target], { controls: [control] }));
          continue;
        }
        const pick = gates[Math.floor(next() * gates.length)];
        operations.push(op(pick.gate, [target], { params: pick.params }));
      }
      const { probabilities } = run(qubits, operations);
      const total = probabilities.reduce((sum, value) => sum + value, 0);
      expect(total).toBeCloseTo(1, 10);
    }
  });
});

describe("validação de circuito", () => {
  it("recusa qubit fora do intervalo", () => {
    expect(() => run(2, [op("H", [5])])).toThrow(/qubit inexistente/i);
  });

  it("recusa a mesma porta apontando duas vezes para o mesmo qubit", () => {
    expect(() => run(2, [op("CNOT", [0], { controls: [0] })])).toThrow(/repete o mesmo qubit/i);
  });

  it("recusa rotação sem ângulo", () => {
    expect(() => run(1, [op("RX", [0])])).toThrow(/ângulo/i);
  });
});
