/**
 * Teto de qubits do laboratório.
 *
 * Era 6, cravado em três arquivos diferentes sem constante compartilhada
 * (simulator, parser e o <select> da UI). Com o estado em Float64Array,
 * 16 qubits ocupam 2^16 × 16 B = 1 MB e rodam instantaneamente.
 */
export const MAX_QUBITS = 16;

/** Acima disto o histograma vira dezenas de milhares de nós DOM. */
export const HISTOGRAM_TOP_K = 16;

export type GateName =
  // Um qubit
  | "I"
  | "H"
  | "X"
  | "Y"
  | "Z"
  | "S"
  | "SDG"
  | "T"
  | "TDG"
  | "SX"
  | "SXDG"
  | "P"
  | "U"
  | "RX"
  | "RY"
  | "RZ"
  // Controladas
  | "CNOT"
  | "CY"
  | "CZ"
  | "CH"
  | "CP"
  | "CRX"
  | "CRY"
  | "CRZ"
  | "CCX"
  | "CCZ"
  | "MCX"
  | "MCZ"
  // Dois qubits com núcleo próprio
  | "SWAP"
  | "ISWAP"
  | "CSWAP"
  // Estruturais
  | "BARRIER"
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
  /** Semente do amostrador. Ausente = aleatória de verdade a cada execução. */
  seed?: number;
  /** Desliga a captura passo a passo quando ela não é necessária. */
  captureSteps?: boolean;
};

export type ComplexValue = {
  re: number;
  im: number;
};

export type BlochVector = {
  x: number;
  y: number;
  z: number;
  /**
   * Comprimento do vetor reduzido: 1 = estado puro e separável,
   * 0 = maximamente emaranhado (o qubit não tem estado próprio).
   * A versão anterior descartava isto e desenhava uma seta de tamanho zero
   * sem nenhuma explicação.
   */
  length: number;
};

/** Estado do circuito depois de uma operação — alimenta o cursor de passos. */
export type StepSnapshot = {
  /** -1 é o estado inicial, antes de qualquer porta. */
  afterOperation: number;
  operationId?: string;
  gate?: GateName;
  label: string;
  amplitudes: ComplexValue[];
  probabilities: number[];
  blochVectors: BlochVector[];
};

export type SimulationResult = {
  amplitudes: ComplexValue[];
  probabilities: number[];
  counts: Record<string, number>;
  blochVectors: BlochVector[];
  executionTime: number;
  /** Estado após cada porta. Vazio quando a captura foi dispensada. */
  steps: StepSnapshot[];
  /** Semente efetivamente usada, para o aluno reproduzir o resultado. */
  seed: number;
  shots: number;
};
