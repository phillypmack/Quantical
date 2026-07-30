import type { Circuit } from "./types";

const method: Record<string, string> = {
  H: "h",
  X: "x",
  Y: "y",
  Z: "z",
  S: "s",
  T: "t",
  RX: "rx",
  RY: "ry",
  RZ: "rz",
  CNOT: "cx",
  CZ: "cz",
  SWAP: "swap",
};

function angle(value = 0) {
  const ratio = value / Math.PI;
  if (Math.abs(ratio - 1) < 1e-8) return "pi";
  if (Math.abs(ratio - 0.5) < 1e-8) return "pi / 2";
  if (Math.abs(ratio - 0.25) < 1e-8) return "pi / 4";
  return value.toFixed(4).replace(/0+$/, "").replace(/\.$/, "");
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
    const name = method[operation.gate];
    if (["RX", "RY", "RZ"].includes(operation.gate)) {
      lines.push(`qc.${name}(${angle(operation.params?.[0])}, ${operation.targets[0]})`);
    } else if (operation.gate === "CNOT" || operation.gate === "CZ") {
      lines.push(`qc.${name}(${operation.controls?.[0]}, ${operation.targets[0]})`);
    } else if (operation.gate === "SWAP") {
      lines.push(`qc.swap(${operation.targets[0]}, ${operation.targets[1]})`);
    } else {
      lines.push(`qc.${name}(${operation.targets[0]})`);
    }
  }
  lines.push("qc.measure_all()", "", `# Execute com ${circuit.shots} shots no backend de sua escolha`);
  return lines.join("\n");
}
