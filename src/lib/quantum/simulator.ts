import type {
  BlochVector,
  Circuit,
  ComplexValue,
  GateName,
  SimulationResult,
} from "./types";

type Matrix = [[ComplexValue, ComplexValue], [ComplexValue, ComplexValue]];

const c = (re: number, im = 0): ComplexValue => ({ re, im });
const add = (a: ComplexValue, b: ComplexValue) => c(a.re + b.re, a.im + b.im);
const mul = (a: ComplexValue, b: ComplexValue) =>
  c(a.re * b.re - a.im * b.im, a.re * b.im + a.im * b.re);
const conjugate = (a: ComplexValue) => c(a.re, -a.im);
const magnitudeSquared = (a: ComplexValue) => a.re * a.re + a.im * a.im;

function matrixFor(gate: GateName, parameter = 0): Matrix {
  const inv = 1 / Math.sqrt(2);
  switch (gate) {
    case "H":
      return [[c(inv), c(inv)], [c(inv), c(-inv)]];
    case "X":
      return [[c(0), c(1)], [c(1), c(0)]];
    case "Y":
      return [[c(0), c(0, -1)], [c(0, 1), c(0)]];
    case "Z":
      return [[c(1), c(0)], [c(0), c(-1)]];
    case "S":
      return [[c(1), c(0)], [c(0), c(0, 1)]];
    case "T":
      return [[c(1), c(0)], [c(0), c(inv, inv)]];
    case "RX": {
      const half = parameter / 2;
      return [[c(Math.cos(half)), c(0, -Math.sin(half))], [c(0, -Math.sin(half)), c(Math.cos(half))]];
    }
    case "RY": {
      const half = parameter / 2;
      return [[c(Math.cos(half)), c(-Math.sin(half))], [c(Math.sin(half)), c(Math.cos(half))]];
    }
    case "RZ": {
      const half = parameter / 2;
      return [[c(Math.cos(half), -Math.sin(half)), c(0)], [c(0), c(Math.cos(half), Math.sin(half))]];
    }
    default:
      throw new Error(`A porta ${gate} não possui uma matriz de um qubit.`);
  }
}

function applyMatrix(
  state: ComplexValue[],
  target: number,
  matrix: Matrix,
  control?: number,
) {
  const targetMask = 1 << target;
  const controlMask = control === undefined ? 0 : 1 << control;
  for (let index = 0; index < state.length; index += 1) {
    if ((index & targetMask) !== 0) continue;
    if (control !== undefined && (index & controlMask) === 0) continue;
    const pair = index | targetMask;
    const a = state[index];
    const b = state[pair];
    state[index] = add(mul(matrix[0][0], a), mul(matrix[0][1], b));
    state[pair] = add(mul(matrix[1][0], a), mul(matrix[1][1], b));
  }
}

function applySwap(state: ComplexValue[], first: number, second: number) {
  if (first === second) return;
  const firstMask = 1 << first;
  const secondMask = 1 << second;
  for (let index = 0; index < state.length; index += 1) {
    const firstBit = (index & firstMask) !== 0;
    const secondBit = (index & secondMask) !== 0;
    if (firstBit || !secondBit) continue;
    const pair = index ^ firstMask ^ secondMask;
    [state[index], state[pair]] = [state[pair], state[index]];
  }
}

function validateCircuit(circuit: Circuit) {
  if (!Number.isInteger(circuit.qubits) || circuit.qubits < 1 || circuit.qubits > 6) {
    throw new Error("Use entre 1 e 6 qubits neste laboratório.");
  }
  circuit.operations.forEach((operation) => {
    const qubits = [...operation.targets, ...(operation.controls ?? [])];
    if (qubits.some((qubit) => !Number.isInteger(qubit) || qubit < 0 || qubit >= circuit.qubits)) {
      throw new Error(`A porta ${operation.gate} aponta para um qubit inexistente.`);
    }
    if (new Set(qubits).size !== qubits.length) {
      throw new Error(`A porta ${operation.gate} repete o mesmo qubit.`);
    }
    if (["RX", "RY", "RZ"].includes(operation.gate) && operation.params?.[0] === undefined) {
      throw new Error(`A porta ${operation.gate} precisa de um ângulo.`);
    }
  });
}

function calculateBlochVectors(state: ComplexValue[], qubits: number): BlochVector[] {
  return Array.from({ length: qubits }, (_, qubit) => {
    const mask = 1 << qubit;
    let rho00 = 0;
    let rho11 = 0;
    let rho01 = c(0);
    for (let index = 0; index < state.length; index += 1) {
      if ((index & mask) !== 0) continue;
      const pair = index | mask;
      rho00 += magnitudeSquared(state[index]);
      rho11 += magnitudeSquared(state[pair]);
      rho01 = add(rho01, mul(state[index], conjugate(state[pair])));
    }
    return {
      x: clamp(2 * rho01.re),
      y: clamp(-2 * rho01.im),
      z: clamp(rho00 - rho11),
    };
  });
}

function clamp(value: number) {
  if (Math.abs(value) < 1e-12) return 0;
  return Math.max(-1, Math.min(1, value));
}

function sampleCounts(probabilities: number[], qubits: number, shots: number) {
  const counts: Record<string, number> = {};
  let seed = 0x51f15e;
  const random = () => {
    seed = (1664525 * seed + 1013904223) >>> 0;
    return seed / 4294967296;
  };

  for (let shot = 0; shot < shots; shot += 1) {
    const draw = random();
    let cumulative = 0;
    let selected = probabilities.length - 1;
    for (let index = 0; index < probabilities.length; index += 1) {
      cumulative += probabilities[index];
      if (draw <= cumulative) {
        selected = index;
        break;
      }
    }
    const label = selected.toString(2).padStart(qubits, "0");
    counts[label] = (counts[label] ?? 0) + 1;
  }
  return counts;
}

export function simulateCircuit(circuit: Circuit): SimulationResult {
  const started = typeof performance !== "undefined" ? performance.now() : Date.now();
  validateCircuit(circuit);
  const state: ComplexValue[] = Array.from(
    { length: 2 ** circuit.qubits },
    (_, index) => c(index === 0 ? 1 : 0),
  );

  const operations = [...circuit.operations].sort((a, b) => a.position - b.position);
  for (const operation of operations) {
    if (operation.gate === "MEASURE") continue;
    if (operation.gate === "SWAP") {
      applySwap(state, operation.targets[0], operation.targets[1]);
      continue;
    }
    if (operation.gate === "CNOT" || operation.gate === "CZ") {
      applyMatrix(
        state,
        operation.targets[0],
        matrixFor(operation.gate === "CNOT" ? "X" : "Z"),
        operation.controls?.[0],
      );
      continue;
    }
    applyMatrix(state, operation.targets[0], matrixFor(operation.gate, operation.params?.[0]));
  }

  const probabilities = state.map(magnitudeSquared);
  const shots = Math.max(1, Math.min(8192, Math.round(circuit.shots || 1024)));
  const ended = typeof performance !== "undefined" ? performance.now() : Date.now();
  return {
    amplitudes: state,
    probabilities,
    counts: sampleCounts(probabilities, circuit.qubits, shots),
    blochVectors: calculateBlochVectors(state, circuit.qubits),
    executionTime: Math.max(0.01, ended - started),
  };
}
