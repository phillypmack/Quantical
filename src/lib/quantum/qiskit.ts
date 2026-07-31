import { GATE_ARITY } from "./simulator";
import type { Circuit, GateName, Operation } from "./types";

const method: Partial<Record<GateName, string>> = {
  I: "id", H: "h", X: "x", Y: "y", Z: "z",
  S: "s", SDG: "sdg", T: "t", TDG: "tdg",
  SX: "sx", SXDG: "sxdg", P: "p", U: "u",
  RX: "rx", RY: "ry", RZ: "rz",
  CNOT: "cx", CY: "cy", CZ: "cz", CH: "ch",
  CP: "cp", CRX: "crx", CRY: "cry", CRZ: "crz",
  CCX: "ccx", CCZ: "ccz", MCX: "mcx", MCZ: "mcz",
  SWAP: "swap", ISWAP: "iswap", CSWAP: "cswap",
  BARRIER: "barrier",
};

/** Frações comuns de π saem legíveis; o resto vai com precisão suficiente. */
function angle(value = 0) {
  if (value === 0) return "0";
  const ratio = value / Math.PI;
  for (const [numerator, denominator] of [[1, 1], [1, 2], [1, 4], [1, 8], [3, 4], [3, 2], [2, 1]]) {
    for (const sign of [1, -1]) {
      if (Math.abs(ratio - (sign * numerator) / denominator) < 1e-9) {
        const prefix = sign < 0 ? "-" : "";
        const head = numerator === 1 ? "pi" : `${numerator} * pi`;
        return denominator === 1 ? `${prefix}${head}` : `${prefix}${head} / ${denominator}`;
      }
    }
  }
  // Precisão suficiente para o round-trip não perder o valor.
  return String(Number(value.toPrecision(12)));
}

function renderOperation(operation: Operation): string | null {
  const name = method[operation.gate];
  if (!name) return null;

  if (operation.gate === "BARRIER") {
    return `qc.barrier(${operation.targets.join(", ")})`;
  }

  const paramCount = GATE_ARITY[operation.gate] ?? 0;
  const args = [
    ...Array.from({ length: paramCount }, (_, index) => angle(operation.params?.[index])),
    ...(operation.controls ?? []).map(String),
    ...operation.targets.map(String),
  ];
  return `qc.${name}(${args.join(", ")})`;
}

export function circuitToQiskit(circuit: Circuit) {
  const lines = [
    "from qiskit import QuantumCircuit",
    "from math import pi",
    "",
    `qc = QuantumCircuit(${circuit.qubits})`,
  ];

  for (const operation of [...circuit.operations].sort((a, b) => a.position - b.position)) {
    if (operation.gate === "MEASURE") continue;
    const rendered = renderOperation(operation);
    if (rendered) lines.push(rendered);
  }

  lines.push("qc.measure_all()", "", `shots = ${circuit.shots}`);
  return lines.join("\n");
}
