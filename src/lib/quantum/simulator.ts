import { mulberry32, randomSeed } from "./rng";
import {
  MAX_QUBITS,
  type BlochVector,
  type Circuit,
  type ComplexValue,
  type GateName,
  type Operation,
  type SimulationResult,
  type StepSnapshot,
} from "./types";

/**
 * Estado como struct-of-arrays em Float64Array.
 *
 * A versão anterior guardava 2^n objetos `{re, im}` no heap, o que travava o
 * teto em 6 qubits. Aqui 16 qubits ocupam 1 MB. `ComplexValue[]` continua
 * sendo o tipo público de fronteira, convertido uma única vez no fim — então
 * a UI, os testes e o worker não precisaram mudar.
 */
type State = { re: Float64Array; im: Float64Array };

/** [a, b, c, d] representando [[a, b], [c, d]], cada entrada [re, im]. */
type Matrix = readonly [number, number, number, number, number, number, number, number];

const INV = Math.SQRT1_2;

const matrix = (
  a: [number, number], b: [number, number], c: [number, number], d: [number, number],
): Matrix => [a[0], a[1], b[0], b[1], c[0], c[1], d[0], d[1]];

/** Portas controladas resolvidas para (matriz base, número de controles). */
const CONTROLLED: Partial<Record<GateName, { base: GateName; controls: number }>> = {
  CNOT: { base: "X", controls: 1 },
  CY: { base: "Y", controls: 1 },
  CZ: { base: "Z", controls: 1 },
  CH: { base: "H", controls: 1 },
  CP: { base: "P", controls: 1 },
  CRX: { base: "RX", controls: 1 },
  CRY: { base: "RY", controls: 1 },
  CRZ: { base: "RZ", controls: 1 },
  CCX: { base: "X", controls: 2 },
  CCZ: { base: "Z", controls: 2 },
  // -1 = aceita quantos controles vierem (difusor de Grover precisa disto).
  MCX: { base: "X", controls: -1 },
  MCZ: { base: "Z", controls: -1 },
};

export const SINGLE_QUBIT_GATES: GateName[] = [
  "I", "H", "X", "Y", "Z", "S", "SDG", "T", "TDG", "SX", "SXDG", "P", "U", "RX", "RY", "RZ",
];

/** Quantos parâmetros cada porta exige. */
export const GATE_ARITY: Partial<Record<GateName, number>> = {
  P: 1, RX: 1, RY: 1, RZ: 1, CP: 1, CRX: 1, CRY: 1, CRZ: 1, U: 3,
};

export function matrixFor(gate: GateName, params: readonly number[] = []): Matrix {
  const [first = 0, second = 0, third = 0] = params;
  switch (gate) {
    case "I":
      return matrix([1, 0], [0, 0], [0, 0], [1, 0]);
    case "H":
      return matrix([INV, 0], [INV, 0], [INV, 0], [-INV, 0]);
    case "X":
      return matrix([0, 0], [1, 0], [1, 0], [0, 0]);
    case "Y":
      return matrix([0, 0], [0, -1], [0, 1], [0, 0]);
    case "Z":
      return matrix([1, 0], [0, 0], [0, 0], [-1, 0]);
    case "S":
      return matrix([1, 0], [0, 0], [0, 0], [0, 1]);
    case "SDG":
      return matrix([1, 0], [0, 0], [0, 0], [0, -1]);
    case "T":
      return matrix([1, 0], [0, 0], [0, 0], [INV, INV]);
    case "TDG":
      return matrix([1, 0], [0, 0], [0, 0], [INV, -INV]);
    case "SX":
      return matrix([0.5, 0.5], [0.5, -0.5], [0.5, -0.5], [0.5, 0.5]);
    case "SXDG":
      return matrix([0.5, -0.5], [0.5, 0.5], [0.5, 0.5], [0.5, -0.5]);
    case "P":
      return matrix([1, 0], [0, 0], [0, 0], [Math.cos(first), Math.sin(first)]);
    case "RX": {
      const half = first / 2;
      return matrix(
        [Math.cos(half), 0], [0, -Math.sin(half)],
        [0, -Math.sin(half)], [Math.cos(half), 0],
      );
    }
    case "RY": {
      const half = first / 2;
      return matrix(
        [Math.cos(half), 0], [-Math.sin(half), 0],
        [Math.sin(half), 0], [Math.cos(half), 0],
      );
    }
    case "RZ": {
      const half = first / 2;
      return matrix(
        [Math.cos(half), -Math.sin(half)], [0, 0],
        [0, 0], [Math.cos(half), Math.sin(half)],
      );
    }
    case "U": {
      // U(θ, φ, λ), a convenção do Qiskit.
      const [theta, phi, lambda] = [first, second, third];
      const cos = Math.cos(theta / 2);
      const sin = Math.sin(theta / 2);
      return matrix(
        [cos, 0],
        [-cos_of(lambda) * sin, -sin_of(lambda) * sin],
        [cos_of(phi) * sin, sin_of(phi) * sin],
        [cos_of(phi + lambda) * cos, sin_of(phi + lambda) * cos],
      );
    }
    default:
      throw new Error(`A porta ${gate} não possui uma matriz de um qubit.`);
  }
}

const cos_of = Math.cos;
const sin_of = Math.sin;

/**
 * Aplica uma matriz 2×2 ao alvo, condicionada a QUALQUER número de controles.
 *
 * A versão anterior recebia `control?: number` — exatamente um controle
 * opcional — o que tornava Toffoli, CSWAP e multi-controle estruturalmente
 * impossíveis. Trocar por máscara de bits custou ~10 linhas e destravou o
 * difusor de Grover, a QFT com fases controladas e a correção de erros.
 */
function applyControlled(
  state: State,
  target: number,
  m: Matrix,
  controls: readonly number[] = [],
) {
  const targetMask = 1 << target;
  let controlMask = 0;
  for (const control of controls) controlMask |= 1 << control;

  const { re, im } = state;
  const [m00r, m00i, m01r, m01i, m10r, m10i, m11r, m11i] = m;

  for (let index = 0; index < re.length; index += 1) {
    if ((index & targetMask) !== 0) continue;
    if ((index & controlMask) !== controlMask) continue;
    const pair = index | targetMask;

    const ar = re[index];
    const ai = im[index];
    const br = re[pair];
    const bi = im[pair];

    re[index] = m00r * ar - m00i * ai + m01r * br - m01i * bi;
    im[index] = m00r * ai + m00i * ar + m01r * bi + m01i * br;
    re[pair] = m10r * ar - m10i * ai + m11r * br - m11i * bi;
    im[pair] = m10r * ai + m10i * ar + m11r * bi + m11i * br;
  }
}

function applySwap(state: State, first: number, second: number, controls: readonly number[] = []) {
  if (first === second) return;
  const firstMask = 1 << first;
  const secondMask = 1 << second;
  let controlMask = 0;
  for (const control of controls) controlMask |= 1 << control;

  const { re, im } = state;
  for (let index = 0; index < re.length; index += 1) {
    if ((index & firstMask) !== 0 || (index & secondMask) === 0) continue;
    if ((index & controlMask) !== controlMask) continue;
    const pair = index ^ firstMask ^ secondMask;
    [re[index], re[pair]] = [re[pair], re[index]];
    [im[index], im[pair]] = [im[pair], im[index]];
  }
}

/** iSWAP: troca os qubits e acrescenta uma fase i nos estados trocados. */
function applyISwap(state: State, first: number, second: number) {
  if (first === second) return;
  const firstMask = 1 << first;
  const secondMask = 1 << second;
  const { re, im } = state;
  for (let index = 0; index < re.length; index += 1) {
    if ((index & firstMask) !== 0 || (index & secondMask) === 0) continue;
    const pair = index ^ firstMask ^ secondMask;
    const ar = re[index];
    const ai = im[index];
    // multiplica por i e troca
    re[index] = -im[pair];
    im[index] = re[pair];
    re[pair] = -ai;
    im[pair] = ar;
  }
}

export function validateCircuit(circuit: Circuit) {
  if (!Number.isInteger(circuit.qubits) || circuit.qubits < 1 || circuit.qubits > MAX_QUBITS) {
    throw new Error(`Use entre 1 e ${MAX_QUBITS} qubits neste laboratório.`);
  }
  for (const operation of circuit.operations) {
    if (operation.gate === "BARRIER" || operation.gate === "MEASURE") continue;

    const qubits = [...operation.targets, ...(operation.controls ?? [])];
    if (qubits.length === 0) {
      throw new Error(`A porta ${operation.gate} não indica nenhum qubit.`);
    }
    if (qubits.some((qubit) => !Number.isInteger(qubit) || qubit < 0 || qubit >= circuit.qubits)) {
      throw new Error(`A porta ${operation.gate} aponta para um qubit inexistente.`);
    }
    if (new Set(qubits).size !== qubits.length) {
      throw new Error(`A porta ${operation.gate} repete o mesmo qubit.`);
    }

    const arity = GATE_ARITY[operation.gate];
    if (arity !== undefined && (operation.params?.length ?? 0) < arity) {
      throw new Error(
        arity === 1
          ? `A porta ${operation.gate} precisa de um ângulo.`
          : `A porta ${operation.gate} precisa de ${arity} parâmetros.`,
      );
    }

    // A validação antiga nunca checava isto: um CNOT sem controle passava e
    // degradava em silêncio para um X comum.
    const controlled = CONTROLLED[operation.gate];
    if (controlled) {
      const provided = operation.controls?.length ?? 0;
      const required = controlled.controls;
      if (required === -1 ? provided < 1 : provided !== required) {
        throw new Error(
          `A porta ${operation.gate} precisa de ${required === -1 ? "ao menos um" : required} controle(s).`,
        );
      }
    }

    if ((operation.gate === "SWAP" || operation.gate === "ISWAP") && operation.targets.length !== 2) {
      throw new Error(`A porta ${operation.gate} precisa de dois qubits alvo.`);
    }
    if (operation.gate === "CSWAP" && (operation.targets.length !== 2 || (operation.controls?.length ?? 0) !== 1)) {
      throw new Error("A porta CSWAP precisa de dois alvos e um controle.");
    }
  }
}

function createState(qubits: number): State {
  const size = 2 ** qubits;
  const state = { re: new Float64Array(size), im: new Float64Array(size) };
  state.re[0] = 1;
  return state;
}

function toAmplitudes(state: State): ComplexValue[] {
  const result: ComplexValue[] = new Array(state.re.length);
  for (let index = 0; index < state.re.length; index += 1) {
    result[index] = { re: state.re[index], im: state.im[index] };
  }
  return result;
}

function toProbabilities(state: State): number[] {
  const result: number[] = new Array(state.re.length);
  for (let index = 0; index < state.re.length; index += 1) {
    result[index] = state.re[index] * state.re[index] + state.im[index] * state.im[index];
  }
  return result;
}

const clamp = (value: number) => {
  if (Math.abs(value) < 1e-12) return 0;
  return Math.max(-1, Math.min(1, value));
};

export function calculateBlochVectors(state: State, qubits: number): BlochVector[] {
  const { re, im } = state;
  return Array.from({ length: qubits }, (_, qubit) => {
    const mask = 1 << qubit;
    let rho00 = 0;
    let rho11 = 0;
    let rho01re = 0;
    let rho01im = 0;

    for (let index = 0; index < re.length; index += 1) {
      if ((index & mask) !== 0) continue;
      const pair = index | mask;
      rho00 += re[index] * re[index] + im[index] * im[index];
      rho11 += re[pair] * re[pair] + im[pair] * im[pair];
      // ρ01 = Σ a·conj(b)
      rho01re += re[index] * re[pair] + im[index] * im[pair];
      rho01im += im[index] * re[pair] - re[index] * im[pair];
    }

    const x = clamp(2 * rho01re);
    const y = clamp(-2 * rho01im);
    const z = clamp(rho00 - rho11);
    return { x, y, z, length: Math.min(1, Math.hypot(x, y, z)) };
  });
}

function applyOperation(state: State, operation: Operation) {
  const { gate, targets, controls = [], params = [] } = operation;

  if (gate === "BARRIER" || gate === "MEASURE" || gate === "I") return;

  if (gate === "SWAP") return applySwap(state, targets[0], targets[1]);
  if (gate === "CSWAP") return applySwap(state, targets[0], targets[1], controls);
  if (gate === "ISWAP") return applyISwap(state, targets[0], targets[1]);

  const controlled = CONTROLLED[gate];
  if (controlled) {
    return applyControlled(state, targets[0], matrixFor(controlled.base, params), controls);
  }

  applyControlled(state, targets[0], matrixFor(gate, params), controls);
}

/** Amostra `shots` medições a partir das probabilidades, com CDF acumulada. */
export function sampleCounts(
  probabilities: readonly number[],
  qubits: number,
  shots: number,
  random: () => number,
): Record<string, number> {
  const cumulative = new Float64Array(probabilities.length);
  let running = 0;
  for (let index = 0; index < probabilities.length; index += 1) {
    running += probabilities[index];
    cumulative[index] = running;
  }

  const counts: Record<string, number> = {};
  for (let shot = 0; shot < shots; shot += 1) {
    const draw = random() * running;
    let low = 0;
    let high = cumulative.length - 1;
    while (low < high) {
      const mid = (low + high) >> 1;
      if (cumulative[mid] < draw) low = mid + 1;
      else high = mid;
    }
    const label = low.toString(2).padStart(qubits, "0");
    counts[label] = (counts[label] ?? 0) + 1;
  }
  return counts;
}

/**
 * Captura passo a passo só quando o custo é razoável. Acima disto o cursor
 * de passos não é usado de qualquer forma (circuitos de aula são pequenos).
 */
function shouldCaptureSteps(circuit: Circuit) {
  if (circuit.captureSteps !== undefined) return circuit.captureSteps;
  return circuit.qubits <= 10 && circuit.operations.length <= 64;
}

const GATE_LABEL: Partial<Record<GateName, string>> = {
  H: "Hadamard", X: "Pauli X", Y: "Pauli Y", Z: "Pauli Z",
  CNOT: "CNOT", CZ: "CZ", SWAP: "SWAP", CCX: "Toffoli", CSWAP: "Fredkin",
  MEASURE: "Medição", BARRIER: "Barreira",
};

function stepLabel(operation: Operation) {
  const name = GATE_LABEL[operation.gate] ?? operation.gate;
  const targets = operation.targets.map((target) => `q${target}`).join(", ");
  const controls = operation.controls?.length
    ? ` ← ${operation.controls.map((control) => `q${control}`).join(", ")}`
    : "";
  return `${name} em ${targets}${controls}`;
}

export function simulateCircuit(circuit: Circuit): SimulationResult {
  const started = typeof performance !== "undefined" ? performance.now() : Date.now();
  validateCircuit(circuit);

  const state = createState(circuit.qubits);
  const operations = [...circuit.operations].sort((a, b) => a.position - b.position);
  const capture = shouldCaptureSteps(circuit);

  const steps: StepSnapshot[] = [];
  const snapshot = (afterOperation: number, operation?: Operation): StepSnapshot => ({
    afterOperation,
    operationId: operation?.id,
    gate: operation?.gate,
    label: operation ? stepLabel(operation) : "Estado inicial",
    amplitudes: toAmplitudes(state),
    probabilities: toProbabilities(state),
    blochVectors: calculateBlochVectors(state, circuit.qubits),
  });

  if (capture) steps.push(snapshot(-1));

  operations.forEach((operation, index) => {
    applyOperation(state, operation);
    // Barreira e medição não mudam o estado; não viram passo próprio.
    if (capture && operation.gate !== "BARRIER" && operation.gate !== "MEASURE") {
      steps.push(snapshot(index, operation));
    }
  });

  const probabilities = toProbabilities(state);
  const shots = Math.max(1, Math.min(8192, Math.round(circuit.shots || 1024)));
  const seed = circuit.seed ?? randomSeed();
  const counts = sampleCounts(probabilities, circuit.qubits, shots, mulberry32(seed));
  const blochVectors = calculateBlochVectors(state, circuit.qubits);
  const ended = typeof performance !== "undefined" ? performance.now() : Date.now();

  return {
    amplitudes: toAmplitudes(state),
    probabilities,
    counts,
    blochVectors,
    steps,
    seed,
    shots,
    executionTime: Math.max(0.01, ended - started),
  };
}
