import { describe, expect, it } from "vitest";

import { evaluateExpression } from "./expr";
import { ParseError, parseQiskit } from "./parser";
import { circuitToQiskit } from "./qiskit";
import { simulateCircuit } from "./simulator";

const issuesOf = (code: string) => {
  try {
    parseQiskit(code);
    throw new Error("esperava um ParseError");
  } catch (error) {
    if (!(error instanceof ParseError)) throw error;
    return error.issues;
  }
};

describe("avaliador de expressões", () => {
  it("resolve aritmética e constantes", () => {
    expect(evaluateExpression("1 + 2 * 3")).toBe(7);
    expect(evaluateExpression("(1 + 2) * 3")).toBe(9);
    expect(evaluateExpression("pi")).toBeCloseTo(Math.PI, 12);
    expect(evaluateExpression("np.pi / 2")).toBeCloseTo(Math.PI / 2, 12);
    expect(evaluateExpression("math.pi / 4")).toBeCloseTo(Math.PI / 4, 12);
    expect(evaluateExpression("-pi / 2")).toBeCloseTo(-Math.PI / 2, 12);
    expect(evaluateExpression("2 ** 3")).toBe(8);
    expect(evaluateExpression("sqrt(16)")).toBe(4);
  });

  it("resolve variáveis do aluno", () => {
    expect(evaluateExpression("theta * 2", { theta: 1.5 })).toBe(3);
  });

  // O bug antigo: replaceAll("pi", "3.14…") no texto cru destruía qualquer
  // identificador que contivesse "pi".
  it("não corrompe identificadores que contêm 'pi'", () => {
    expect(evaluateExpression("spin + 1", { spin: 2 })).toBe(3);
    expect(() => evaluateExpression("spin")).toThrow(/spin/);
  });

  it("recusa entrada perigosa em vez de executá-la", () => {
    // Com Function() isto seria código executável.
    expect(() => evaluateExpression("globalThis")).toThrow();
    expect(() => evaluateExpression("(()=>1)()")).toThrow();
  });
});

describe("parser Qiskit", () => {
  it("interpreta o subconjunto básico", () => {
    const circuit = parseQiskit(`
      from qiskit import QuantumCircuit
      qc = QuantumCircuit(2)
      qc.h(0)
      qc.cx(0, 1)
      qc.measure_all()
    `);
    expect(circuit.qubits).toBe(2);
    expect(circuit.operations.map((operation) => operation.gate)).toEqual(["H", "CNOT", "MEASURE"]);
  });

  // Antes: toda linha com "=" era descartada em silêncio, então theta sumia
  // e o erro aparecia — confuso — na linha seguinte.
  it("aceita variáveis definidas pelo aluno", () => {
    const circuit = parseQiskit(`
      qc = QuantumCircuit(1)
      theta = pi / 2
      qc.rz(theta, 0)
    `);
    expect(circuit.operations[0].params?.[0]).toBeCloseTo(Math.PI / 2, 12);
  });

  it("aceita portas cujo nome tem dígito", () => {
    // O regex antigo era [a-z_]+ e nunca casaria com u3/u1.
    const circuit = parseQiskit(`
      qc = QuantumCircuit(1)
      qc.u3(pi, 0, pi, 0)
    `);
    expect(circuit.operations[0].gate).toBe("U");
  });

  it("interpreta Toffoli e multi-controle", () => {
    const circuit = parseQiskit(`
      qc = QuantumCircuit(4)
      qc.ccx(0, 1, 2)
      qc.mcx(0, 1, 2, 3)
    `);
    expect(circuit.operations[0].controls).toEqual([0, 1]);
    expect(circuit.operations[0].targets).toEqual([2]);
    expect(circuit.operations[1].controls).toEqual([0, 1, 2]);
    expect(circuit.operations[1].targets).toEqual([3]);
  });

  it("não corta # dentro de string nem quebra com CRLF", () => {
    const circuit = parseQiskit("qc = QuantumCircuit(1)\r\nqc.h(0)  # aplica Hadamard\r\n");
    expect(circuit.operations).toHaveLength(1);
  });

  it("lê shots do código", () => {
    expect(parseQiskit("qc = QuantumCircuit(1)\nshots = 2048").shots).toBe(2048);
  });

  it("aceita nomes de circuito em português", () => {
    const circuit = parseQiskit("circuito = QuantumCircuit(1)\ncircuito.h(0)");
    expect(circuit.operations).toHaveLength(1);
  });
});

describe("erros do parser", () => {
  it("aponta a linha do problema", () => {
    const issues = issuesOf("qc = QuantumCircuit(1)\nqc.h(0)\nqc.naoexiste(0)");
    expect(issues[0].line).toBe(3);
  });

  it("sugere a porta parecida", () => {
    const issues = issuesOf("qc = QuantumCircuit(2)\nqc.cnt(0, 1)");
    expect(issues[0].suggestion).toMatch(/cx|cnot/);
  });

  // A versão anterior lançava no primeiro problema; o aluno corrigia um erro
  // por execução.
  it("acumula todos os erros de uma vez", () => {
    const issues = issuesOf(`
      qc = QuantumCircuit(2)
      qc.naoexiste(0)
      qc.h(9)
      qc.rx(0)
    `);
    expect(issues.length).toBeGreaterThanOrEqual(3);
  });

  it("explica qubit fora do circuito", () => {
    expect(issuesOf("qc = QuantumCircuit(2)\nqc.h(5)")[0].message).toMatch(/não existe/i);
  });

  it("explica aridade errada", () => {
    expect(issuesOf("qc = QuantumCircuit(2)\nqc.rx(0)")[0].message).toMatch(/ângulo/i);
    expect(issuesOf("qc = QuantumCircuit(2)\nqc.cx(0)")[0].message).toMatch(/controle/i);
  });

  it("exige QuantumCircuit", () => {
    expect(issuesOf("qc.h(0)")[0].message).toMatch(/QuantumCircuit/);
  });

  it("recusa acima do teto de qubits", () => {
    expect(issuesOf("qc = QuantumCircuit(99)")[0].message).toMatch(/1 a 16 qubits/);
  });
});

describe("ida e volta com o exportador", () => {
  const roundTrip = (code: string) => parseQiskit(circuitToQiskit(parseQiskit(code)));

  it("preserva as portas", () => {
    const original = `
      qc = QuantumCircuit(3)
      qc.h(0)
      qc.cx(0, 1)
      qc.ccx(0, 1, 2)
      qc.swap(0, 2)
    `;
    expect(roundTrip(original).operations.map((operation) => operation.gate)).toEqual([
      "H", "CNOT", "CCX", "SWAP", "MEASURE",
    ]);
  });

  // O exportador antigo usava toFixed(4) e RX(1/3) voltava como 0.3333.
  it("preserva ângulos sem perder precisão", () => {
    const circuit = roundTrip("qc = QuantumCircuit(1)\nqc.rx(1/3, 0)");
    expect(circuit.operations[0].params?.[0]).toBeCloseTo(1 / 3, 10);
  });

  it("preserva frações de pi de forma legível", () => {
    const code = circuitToQiskit(parseQiskit("qc = QuantumCircuit(1)\nqc.rz(pi / 4, 0)"));
    expect(code).toContain("pi / 4");
  });

  it("o estado final é o mesmo depois da ida e volta", () => {
    const source = "qc = QuantumCircuit(2)\nqc.h(0)\nqc.cx(0, 1)\nqc.rz(pi / 3, 1)";
    const before = simulateCircuit({ ...parseQiskit(source), seed: 1 });
    const after = simulateCircuit({ ...roundTrip(source), seed: 1 });
    before.amplitudes.forEach((amplitude, index) => {
      expect(amplitude.re).toBeCloseTo(after.amplitudes[index].re, 10);
      expect(amplitude.im).toBeCloseTo(after.amplitudes[index].im, 10);
    });
  });
});
