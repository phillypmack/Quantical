export type GateName =
  | "H"
  | "X"
  | "Y"
  | "Z"
  | "S"
  | "T"
  | "RX"
  | "RY"
  | "RZ"
  | "CNOT"
  | "CZ"
  | "SWAP"
  | "MEASURE";

export type Operation = {
  id: string;
  gate: GateName;
  targets: number[];
  controls?: number[];
  params?: number[];
  position: number;
};

export type Circuit = {
  qubits: number;
  operations: Operation[];
  shots: number;
};

export type ComplexValue = {
  re: number;
  im: number;
};

export type BlochVector = {
  x: number;
  y: number;
  z: number;
};

export type SimulationResult = {
  amplitudes: ComplexValue[];
  probabilities: number[];
  counts: Record<string, number>;
  blochVectors: BlochVector[];
  executionTime: number;
};
