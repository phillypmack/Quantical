import { describe, expect, it } from "vitest";

import { validateExercise, type Exercise } from "./validator";

const bell: Exercise = {
  id: "bell-phi-plus",
  prompt: "Prepare o estado |Φ⁺⟩ = (|00⟩ + |11⟩)/√2 em dois qubits.",
  qubits: 2,
  starterCode: "qc = QuantumCircuit(2)\n",
  solutionCode: "qc = QuantumCircuit(2)\nqc.h(0)\nqc.cx(0, 1)\n",
  hints: [],
  assertions: [
    { kind: "qubits", exactly: 2 },
    {
      kind: "amplitudes",
      upToGlobalPhase: true,
      expected: {
        "00": { re: Math.SQRT1_2, im: 0 },
        "11": { re: Math.SQRT1_2, im: 0 },
      },
    },
    { kind: "gateCount", max: 4 },
  ],
};

describe("validador de exercícios", () => {
  it("aprova a solução de referência", () => {
    const result = validateExercise(bell.solutionCode, bell);
    expect(result.passed).toBe(true);
    expect(result.checks.every((check) => check.passed)).toBe(true);
  });

  it("reprova um circuito vazio e diz o que faltou", () => {
    const result = validateExercise(bell.starterCode, bell);
    expect(result.passed).toBe(false);
    const amplitudeCheck = result.checks.find((check) => check.label.includes("estado"));
    expect(amplitudeCheck?.passed).toBe(false);
    expect(amplitudeCheck?.detail).toBeTruthy();
  });

  it("reprova superposição sem emaranhamento", () => {
    // Só H: dá 50/50, mas em |00⟩ e |01⟩, não |00⟩ e |11⟩.
    const result = validateExercise("qc = QuantumCircuit(2)\nqc.h(0)", bell);
    expect(result.passed).toBe(false);
  });

  it("devolve erro de sintaxe com a linha em vez de estourar", () => {
    const result = validateExercise("qc = QuantumCircuit(2)\nqc.naoexiste(0)", bell);
    expect(result.passed).toBe(false);
    expect(result.error?.line).toBe(2);
    expect(result.error?.message).toMatch(/naoexiste/);
  });

  it("limita a força bruta pelo número de portas", () => {
    const excessive = ["qc = QuantumCircuit(2)", "qc.h(0)", "qc.cx(0, 1)"]
      .concat(Array.from({ length: 6 }, () => "qc.z(0)\nqc.z(0)"))
      .join("\n");
    const result = validateExercise(excessive, bell);
    expect(result.checks.find((check) => check.label.includes("portas"))?.passed).toBe(false);
  });
});

describe("fase global", () => {
  // |ψ⟩ e e^{iθ}|ψ⟩ são fisicamente o mesmo estado. Sem dividir a fase fora,
  // o corretor reprovaria soluções corretas — o jeito mais rápido de fazer
  // um aluno desistir da plataforma.
  const alvo: Exercise = {
    id: "estado-um",
    prompt: "Leve o qubit para |1⟩.",
    qubits: 1,
    starterCode: "qc = QuantumCircuit(1)\n",
    solutionCode: "qc = QuantumCircuit(1)\nqc.x(0)\n",
    hints: [],
    assertions: [{ kind: "amplitudes", expected: { "1": { re: 1, im: 0 } } }],
  };

  it("aceita a solução que difere apenas por fase global", () => {
    // X depois Z sobre |0⟩ dá -|1⟩: mesma física, fase global diferente.
    expect(validateExercise("qc = QuantumCircuit(1)\nqc.x(0)\nqc.z(0)", alvo).passed).toBe(true);
    // Y|0⟩ = i|1⟩: idem.
    expect(validateExercise("qc = QuantumCircuit(1)\nqc.y(0)", alvo).passed).toBe(true);
  });

  it("mas continua reprovando um estado fisicamente diferente", () => {
    expect(validateExercise("qc = QuantumCircuit(1)\nqc.h(0)", alvo).passed).toBe(false);
  });

  it("pode ser desligada quando a fase importa de fato", () => {
    const estrito: Exercise = {
      ...alvo,
      assertions: [{ kind: "amplitudes", upToGlobalPhase: false, expected: { "1": { re: 1, im: 0 } } }],
    };
    expect(validateExercise("qc = QuantumCircuit(1)\nqc.x(0)\nqc.z(0)", estrito).passed).toBe(false);
  });
});

describe("outras asserções", () => {
  const kickback: Exercise = {
    id: "phase-kickback",
    prompt: "Leve q0 de |0⟩ a |1⟩ com determinismo, usando apenas H e Z.",
    qubits: 1,
    starterCode: "qc = QuantumCircuit(1)\n",
    solutionCode: "qc = QuantumCircuit(1)\nqc.h(0)\nqc.z(0)\nqc.h(0)\n",
    hints: [],
    assertions: [
      { kind: "probabilities", expected: { "1": 1 } },
      { kind: "usesGates", required: ["H", "Z"], forbidden: ["X", "Y", "RX", "RY"] },
      { kind: "bloch", qubit: 0, expected: { z: -1 } },
    ],
  };

  it("aprova a solução de referência do phase kickback", () => {
    expect(validateExercise(kickback.solutionCode, kickback).passed).toBe(true);
  });

  it("reprova quem burla usando X direto", () => {
    const result = validateExercise("qc = QuantumCircuit(1)\nqc.x(0)", kickback);
    expect(result.passed).toBe(false);
    expect(result.checks.find((check) => check.label.includes("Usa H"))?.passed).toBe(false);
  });

  it("exige que estados fora da lista tenham probabilidade zero", () => {
    const meio: Exercise = {
      ...kickback,
      assertions: [{ kind: "probabilities", expected: { "1": 1 } }],
    };
    const result = validateExercise("qc = QuantumCircuit(1)\nqc.h(0)", meio);
    expect(result.passed).toBe(false);
    expect(result.checks[0].detail).toMatch(/esperado 0%/);
  });

  it("confere o número de qubits", () => {
    const result = validateExercise("qc = QuantumCircuit(3)\nqc.h(0)\nqc.cx(0, 1)", bell);
    expect(result.checks[0].passed).toBe(false);
    expect(result.checks[0].detail).toMatch(/3/);
  });
});
