import type { Circuit, GateName, Operation } from "./types";

const gateMap: Record<string, GateName> = {
  h: "H",
  x: "X",
  y: "Y",
  z: "Z",
  s: "S",
  t: "T",
  rx: "RX",
  ry: "RY",
  rz: "RZ",
  cx: "CNOT",
  cnot: "CNOT",
  cz: "CZ",
  swap: "SWAP",
  measure_all: "MEASURE",
};

function parseNumber(expression: string) {
  const normalized = expression
    .trim()
    .replaceAll("np.pi", String(Math.PI))
    .replaceAll("math.pi", String(Math.PI))
    .replaceAll("pi", String(Math.PI));
  if (!/^[\d+\-*/().\s]+$/.test(normalized)) {
    throw new Error(`Não entendi o valor “${expression}”. Use números ou pi.`);
  }
  // A expressão já foi limitada a números e operadores aritméticos.
  const value = Function(`"use strict"; return (${normalized})`)() as number;
  if (!Number.isFinite(value)) throw new Error(`O valor “${expression}” não é finito.`);
  return value;
}

export function parseQiskit(code: string, defaultShots = 1024): Circuit {
  const constructor = code.match(/QuantumCircuit\s*\(\s*(\d+)/);
  if (!constructor) {
    throw new Error("Crie um circuito com QuantumCircuit(n), onde n é o número de qubits.");
  }
  const qubits = Number(constructor[1]);
  if (qubits < 1 || qubits > 6) throw new Error("O laboratório aceita de 1 a 6 qubits.");

  const operations: Operation[] = [];
  const lines = code.split(/\r?\n/);
  for (let lineIndex = 0; lineIndex < lines.length; lineIndex += 1) {
    const line = lines[lineIndex].replace(/#.*$/, "").trim();
    if (!line || line.startsWith("from ") || line.startsWith("import ") || line.includes("QuantumCircuit(")) {
      continue;
    }
    if (/^(print|display)\s*\(/.test(line)) continue;
    const call = line.match(/(?:qc|circuit)\.([a-z_]+)\s*\((.*)\)\s*;?$/i);
    if (!call) {
      if (line.includes("=") || line.startsWith("shots")) continue;
      throw new Error(`Linha ${lineIndex + 1}: use chamadas como qc.h(0) ou qc.cx(0, 1).`);
    }
    const method = call[1].toLowerCase();
    const gate = gateMap[method];
    if (!gate) throw new Error(`Linha ${lineIndex + 1}: a operação “${method}” ainda não é suportada.`);
    const args = call[2].trim() ? call[2].split(",").map((item) => item.trim()) : [];
    const position = operations.length;

    if (gate === "MEASURE") {
      operations.push({
        id: `op-${position}`,
        gate,
        targets: Array.from({ length: qubits }, (_, index) => index),
        position,
      });
      continue;
    }
    if (["RX", "RY", "RZ"].includes(gate)) {
      if (args.length !== 2) throw new Error(`Linha ${lineIndex + 1}: ${method} espera ângulo e qubit.`);
      operations.push({
        id: `op-${position}`,
        gate,
        targets: [parseNumber(args[1])],
        params: [parseNumber(args[0])],
        position,
      });
      continue;
    }
    if (gate === "CNOT" || gate === "CZ") {
      if (args.length !== 2) throw new Error(`Linha ${lineIndex + 1}: ${method} espera controle e alvo.`);
      operations.push({
        id: `op-${position}`,
        gate,
        controls: [parseNumber(args[0])],
        targets: [parseNumber(args[1])],
        position,
      });
      continue;
    }
    if (gate === "SWAP") {
      if (args.length !== 2) throw new Error(`Linha ${lineIndex + 1}: swap espera dois qubits.`);
      operations.push({
        id: `op-${position}`,
        gate,
        targets: [parseNumber(args[0]), parseNumber(args[1])],
        position,
      });
      continue;
    }
    if (args.length !== 1) throw new Error(`Linha ${lineIndex + 1}: ${method} espera um qubit.`);
    operations.push({
      id: `op-${position}`,
      gate,
      targets: [parseNumber(args[0])],
      position,
    });
  }

  const shotsMatch = code.match(/shots\s*=\s*(\d+)/);
  return {
    qubits,
    operations,
    shots: shotsMatch ? Number(shotsMatch[1]) : defaultShots,
  };
}
