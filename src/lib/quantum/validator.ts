import { ParseError, parseQiskit } from "./parser";
import { simulateCircuit } from "./simulator";
import type { Circuit, ComplexValue, GateName, SimulationResult } from "./types";

export type Assertion =
  | { kind: "probabilities"; expected: Record<string, number>; tol?: number }
  | {
      kind: "amplitudes";
      expected: Record<string, { re: number; im: number }>;
      tol?: number;
      /** Ver nota sobre fase global abaixo. Ligado por padrão. */
      upToGlobalPhase?: boolean;
    }
  | { kind: "bloch"; qubit: number; expected: Partial<{ x: number; y: number; z: number }>; tol?: number }
  | { kind: "qubits"; exactly: number }
  | { kind: "usesGates"; required?: GateName[]; forbidden?: GateName[] }
  | { kind: "gateCount"; gate?: GateName; min?: number; max?: number };

export type Exercise = {
  id: string;
  prompt: string;
  qubits: number;
  starterCode: string;
  solutionCode: string;
  /** Dicas em escada: as duas primeiras não podem entregar a resposta. */
  hints: string[];
  assertions: Assertion[];
};

export type CheckResult = {
  passed: boolean;
  label: string;
  detail?: string;
};

export type ValidationResult = {
  passed: boolean;
  checks: CheckResult[];
  error?: { message: string; line?: number; suggestion?: string };
  result?: SimulationResult;
  circuit?: Circuit;
};

const PROBABILITY_TOL = 1e-4;
const AMPLITUDE_TOL = 1e-6;

const percent = (value: number) => `${(value * 100).toFixed(1)}%`;

/** Estados da base que aparecem nas duas pontas da comparação. */
function basisIndex(label: string, qubits: number): number | null {
  if (!/^[01]+$/.test(label) || label.length !== qubits) return null;
  return Number.parseInt(label, 2);
}

/**
 * Divide a fase global antes de comparar amplitudes.
 *
 * |ψ⟩ e e^{iθ}|ψ⟩ são fisicamente o MESMO estado — nenhuma medição os
 * distingue. Um aluno que escreve `qc.z(0); qc.x(0)` em vez de
 * `qc.x(0); qc.z(0)` chega num estado que difere só por essa fase, e não
 * está errado. Sem isto o corretor reprovaria soluções corretas, que é
 * exatamente o tipo de coisa que faz alguém desistir da plataforma.
 */
function removeGlobalPhase(
  actual: readonly ComplexValue[],
  expected: readonly ComplexValue[],
  tol: number,
): ComplexValue[] {
  const reference = expected.findIndex((value) => Math.hypot(value.re, value.im) > tol);
  if (reference < 0) return [...actual];

  const a = actual[reference];
  const b = expected[reference];
  const magnitude = Math.hypot(a.re, a.im);
  if (magnitude < tol) return [...actual];

  // e^{-iφ} onde φ = arg(atual) - arg(esperado)
  const phi = Math.atan2(a.im, a.re) - Math.atan2(b.im, b.re);
  const cos = Math.cos(-phi);
  const sin = Math.sin(-phi);
  return actual.map((value) => ({
    re: value.re * cos - value.im * sin,
    im: value.re * sin + value.im * cos,
  }));
}

function checkAssertion(
  assertion: Assertion,
  circuit: Circuit,
  result: SimulationResult,
): CheckResult {
  switch (assertion.kind) {
    case "qubits": {
      const passed = circuit.qubits === assertion.exactly;
      return {
        passed,
        label: `Usa ${assertion.exactly} qubit${assertion.exactly === 1 ? "" : "s"}`,
        detail: passed ? undefined : `Seu circuito tem ${circuit.qubits}.`,
      };
    }

    case "probabilities": {
      const tol = assertion.tol ?? PROBABILITY_TOL;
      const misses: string[] = [];
      for (const [label, expected] of Object.entries(assertion.expected)) {
        const index = basisIndex(label, circuit.qubits);
        if (index === null) {
          misses.push(`|${label}⟩ não existe num circuito de ${circuit.qubits} qubits`);
          continue;
        }
        const actual = result.probabilities[index] ?? 0;
        if (Math.abs(actual - expected) > tol) {
          misses.push(`P(|${label}⟩) = ${percent(actual)}, esperado ${percent(expected)}`);
        }
      }
      // Qualquer estado não listado precisa ter probabilidade desprezível.
      result.probabilities.forEach((probability, index) => {
        const label = index.toString(2).padStart(circuit.qubits, "0");
        if (label in assertion.expected) return;
        if (probability > tol) misses.push(`P(|${label}⟩) = ${percent(probability)}, esperado 0%`);
      });

      return {
        passed: misses.length === 0,
        label: "As probabilidades batem com o alvo",
        detail: misses.slice(0, 3).join(" · ") || undefined,
      };
    }

    case "amplitudes": {
      const tol = assertion.tol ?? AMPLITUDE_TOL;
      const size = 2 ** circuit.qubits;
      const expected: ComplexValue[] = Array.from({ length: size }, () => ({ re: 0, im: 0 }));
      let malformed: string | undefined;

      for (const [label, value] of Object.entries(assertion.expected)) {
        const index = basisIndex(label, circuit.qubits);
        if (index === null) {
          malformed = `|${label}⟩ não existe num circuito de ${circuit.qubits} qubits`;
          break;
        }
        expected[index] = value;
      }
      if (malformed) return { passed: false, label: "As amplitudes batem com o alvo", detail: malformed };

      const actual =
        assertion.upToGlobalPhase === false
          ? result.amplitudes
          : removeGlobalPhase(result.amplitudes, expected, tol);

      const misses: string[] = [];
      for (let index = 0; index < size; index += 1) {
        const dre = actual[index].re - expected[index].re;
        const dim = actual[index].im - expected[index].im;
        if (Math.hypot(dre, dim) > tol) {
          const label = index.toString(2).padStart(circuit.qubits, "0");
          misses.push(
            `|${label}⟩: ${actual[index].re.toFixed(3)}${actual[index].im >= 0 ? "+" : ""}${actual[index].im.toFixed(3)}i, esperado ${expected[index].re.toFixed(3)}${expected[index].im >= 0 ? "+" : ""}${expected[index].im.toFixed(3)}i`,
          );
        }
      }

      return {
        passed: misses.length === 0,
        label: "O estado é exatamente o pedido",
        detail: misses.slice(0, 2).join(" · ") || undefined,
      };
    }

    case "bloch": {
      const tol = assertion.tol ?? PROBABILITY_TOL;
      const vector = result.blochVectors[assertion.qubit];
      if (!vector) {
        return { passed: false, label: `Vetor de Bloch de q${assertion.qubit}`, detail: "Qubit inexistente." };
      }
      const misses: string[] = [];
      for (const axis of ["x", "y", "z"] as const) {
        const target = assertion.expected[axis];
        if (target === undefined) continue;
        if (Math.abs(vector[axis] - target) > tol) {
          misses.push(`${axis} = ${vector[axis].toFixed(3)}, esperado ${target.toFixed(3)}`);
        }
      }
      return {
        passed: misses.length === 0,
        label: `q${assertion.qubit} aponta na direção certa`,
        detail: misses.join(" · ") || undefined,
      };
    }

    case "usesGates": {
      const used = new Set(circuit.operations.map((operation) => operation.gate));
      const missing = (assertion.required ?? []).filter((gate) => !used.has(gate));
      const banned = (assertion.forbidden ?? []).filter((gate) => used.has(gate));
      const parts: string[] = [];
      if (missing.length) parts.push(`falta usar ${missing.join(", ")}`);
      if (banned.length) parts.push(`não pode usar ${banned.join(", ")}`);
      return {
        passed: parts.length === 0,
        label: assertion.required?.length
          ? `Usa ${assertion.required.join(", ")}`
          : `Evita ${(assertion.forbidden ?? []).join(", ")}`,
        detail: parts.join(" · ") || undefined,
      };
    }

    case "gateCount": {
      const relevant = circuit.operations.filter(
        (operation) =>
          operation.gate !== "MEASURE" &&
          operation.gate !== "BARRIER" &&
          (assertion.gate ? operation.gate === assertion.gate : true),
      );
      const count = relevant.length;
      const okMin = assertion.min === undefined || count >= assertion.min;
      const okMax = assertion.max === undefined || count <= assertion.max;
      const what = assertion.gate ? `portas ${assertion.gate}` : "portas";
      const limit =
        assertion.max !== undefined && assertion.min !== undefined
          ? `entre ${assertion.min} e ${assertion.max}`
          : assertion.max !== undefined
            ? `no máximo ${assertion.max}`
            : `pelo menos ${assertion.min}`;
      return {
        passed: okMin && okMax,
        label: `Usa ${limit} ${what}`,
        detail: okMin && okMax ? undefined : `Seu circuito usa ${count}.`,
      };
    }
  }
}

/**
 * Roda o código do aluno e confere contra as asserções do exercício.
 *
 * Reusa `parseQiskit` + `simulateCircuit` — não acrescenta nada ao motor. É
 * o que transforma os desafios de cartões decorativos, que só linkavam para
 * um laboratório vazio, em algo onde dá para errar e descobrir.
 */
export function validateExercise(code: string, exercise: Exercise): ValidationResult {
  let circuit: Circuit;
  try {
    circuit = parseQiskit(code);
  } catch (error) {
    if (error instanceof ParseError) {
      const [first] = error.issues;
      return {
        passed: false,
        checks: [],
        error: { message: first.message, line: first.line, suggestion: first.suggestion },
      };
    }
    return {
      passed: false,
      checks: [],
      error: { message: error instanceof Error ? error.message : "Não consegui ler seu circuito." },
    };
  }

  let result: SimulationResult;
  try {
    // Semente fixa: a correção não pode depender de sorte na amostragem.
    result = simulateCircuit({ ...circuit, seed: 1, captureSteps: false });
  } catch (error) {
    return {
      passed: false,
      checks: [],
      error: { message: error instanceof Error ? error.message : "Não consegui simular seu circuito." },
      circuit,
    };
  }

  const checks = exercise.assertions.map((assertion) => checkAssertion(assertion, circuit, result));
  return {
    passed: checks.every((check) => check.passed),
    checks,
    result,
    circuit,
  };
}
