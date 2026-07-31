import type { TrackId } from "./curriculum";
import type { Exercise } from "@/lib/quantum/validator";

export type Challenge = {
  id: string;
  trackId: TrackId;
  level: string;
  title: string;
  description: string;
  gates: string[];
  /** Meta legível para o cartão. A verificação de verdade está em `exercise`. */
  goal: string;
  accent: "violet" | "cyan" | "orange";
  exercise: Exercise;
};

const START = (qubits: number) =>
  `from qiskit import QuantumCircuit\nfrom math import pi\n\nqc = QuantumCircuit(${qubits})\n# seu código aqui\n`;

/**
 * Os desafios tinham apenas uma meta em prosa ("50% / 50%") e um link para
 * /laboratorio sem nenhum parâmetro — o aluno caía num laboratório vazio, sem
 * enunciado e sem correção. Agora cada um carrega um Exercise verificável
 * pelo validador, e a solução de referência é conferida no CI.
 */
export const challenges: Challenge[] = [
  {
    id: "moeda",
    trackId: "iniciante",
    level: "Iniciante",
    title: "Moeda quântica",
    description: "Crie uma distribuição exatamente equilibrada entre |0⟩ e |1⟩.",
    gates: ["H"],
    goal: "50% / 50%",
    accent: "violet",
    exercise: {
      id: "moeda",
      prompt: "Deixe um único qubit com a mesma chance de sair 0 ou 1.",
      qubits: 1,
      starterCode: START(1),
      solutionCode: "from qiskit import QuantumCircuit\n\nqc = QuantumCircuit(1)\nqc.h(0)\n",
      hints: [
        "Um qubit começa sempre em |0⟩, com 100% de certeza. Você precisa de uma porta que divida essa certeza em duas.",
        "Não é X: X apenas troca 0 por 1, continua tendo certeza — só que do outro valor.",
        "É a porta Hadamard: qc.h(0).",
      ],
      assertions: [
        { kind: "qubits", exactly: 1 },
        { kind: "probabilities", expected: { "0": 0.5, "1": 0.5 } },
        { kind: "gateCount", max: 2 },
      ],
    },
  },
  {
    id: "inversor",
    trackId: "iniciante",
    level: "Iniciante",
    title: "O inversor",
    description: "Leve um qubit de |0⟩ para |1⟩ com uma única operação.",
    gates: ["X"],
    goal: "P(|1⟩) = 100%",
    accent: "violet",
    exercise: {
      id: "inversor",
      prompt: "Use uma única porta para levar o qubit de |0⟩ até |1⟩ com certeza.",
      qubits: 1,
      starterCode: START(1),
      solutionCode: "from qiskit import QuantumCircuit\n\nqc = QuantumCircuit(1)\nqc.x(0)\n",
      hints: [
        "Procure a porta que faz o papel do NOT clássico.",
        "Ela troca as amplitudes de |0⟩ e |1⟩ de lugar.",
        "É a Pauli X: qc.x(0).",
      ],
      assertions: [
        { kind: "qubits", exactly: 1 },
        { kind: "probabilities", expected: { "1": 1 } },
        { kind: "gateCount", max: 1 },
      ],
    },
  },
  {
    id: "bell",
    trackId: "programador",
    level: "Programador",
    title: "Par inseparável",
    description: "Produza somente os estados |00⟩ e |11⟩ com pesos iguais.",
    gates: ["H", "CNOT"],
    goal: "Estado de Bell",
    accent: "cyan",
    exercise: {
      id: "bell",
      prompt: "Prepare o estado |Φ⁺⟩ = (|00⟩ + |11⟩)/√2 em dois qubits.",
      qubits: 2,
      starterCode: START(2),
      solutionCode: "from qiskit import QuantumCircuit\n\nqc = QuantumCircuit(2)\nqc.h(0)\nqc.cx(0, 1)\n",
      hints: [
        "Comece criando superposição em um único qubit.",
        "Depois use uma porta controlada para levar essa indecisão ao segundo qubit.",
        "H no qubit 0, depois CX(0, 1).",
      ],
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
    },
  },
  {
    id: "ghz",
    trackId: "programador",
    level: "Programador",
    title: "Constelação GHZ",
    description: "Emaranhe três qubits em uma correlação perfeita.",
    gates: ["H", "CNOT", "CNOT"],
    goal: "|000⟩ + |111⟩",
    accent: "cyan",
    exercise: {
      id: "ghz",
      prompt: "Prepare o estado GHZ = (|000⟩ + |111⟩)/√2 em três qubits.",
      qubits: 3,
      starterCode: START(3),
      solutionCode:
        "from qiskit import QuantumCircuit\n\nqc = QuantumCircuit(3)\nqc.h(0)\nqc.cx(0, 1)\nqc.cx(1, 2)\n",
      hints: [
        "O GHZ é o par de Bell esticado para três qubits.",
        "Depois de emaranhar q0 com q1, propague a mesma correlação de q1 para q2.",
        "H(0), CX(0, 1) e então CX(1, 2).",
      ],
      assertions: [
        { kind: "qubits", exactly: 3 },
        {
          kind: "amplitudes",
          upToGlobalPhase: true,
          expected: {
            "000": { re: Math.SQRT1_2, im: 0 },
            "111": { re: Math.SQRT1_2, im: 0 },
          },
        },
        { kind: "gateCount", max: 5 },
      ],
    },
  },
  {
    id: "fase",
    trackId: "universitario",
    level: "Universitário",
    title: "Fase invisível",
    description: "Mude a fase e use interferência para torná-la observável.",
    gates: ["H", "Z", "H"],
    goal: "Phase kickback",
    accent: "orange",
    exercise: {
      id: "fase",
      prompt:
        "Leve q0 de |0⟩ até |1⟩ com 100% de certeza, usando apenas H e Z. Nada de X ou rotações.",
      qubits: 1,
      starterCode: START(1),
      solutionCode:
        "from qiskit import QuantumCircuit\n\nqc = QuantumCircuit(1)\nqc.h(0)\nqc.z(0)\nqc.h(0)\n",
      hints: [
        "Sozinha, Z não muda nenhuma probabilidade. Confirme isso no laboratório antes de continuar.",
        "Você precisa de uma base em que a fase deixe de ser invisível e vire amplitude.",
        "H leva Z em X: a identidade é H·Z·H = X.",
      ],
      assertions: [
        { kind: "qubits", exactly: 1 },
        { kind: "probabilities", expected: { "1": 1 } },
        { kind: "usesGates", required: ["H", "Z"], forbidden: ["X", "Y", "RX", "RY"] },
        { kind: "bloch", qubit: 0, expected: { z: -1 } },
      ],
    },
  },
  {
    id: "swap",
    trackId: "universitario",
    level: "Universitário",
    title: "Troca unitária",
    description: "Transfira a excitação de q0 para q1 sem medir.",
    gates: ["X", "SWAP"],
    goal: "|01⟩ → |10⟩",
    accent: "orange",
    exercise: {
      id: "swap",
      prompt:
        "Coloque q0 em |1⟩ e transfira essa excitação para q1, terminando em |10⟩ com certeza.",
      qubits: 2,
      starterCode: START(2),
      solutionCode:
        "from qiskit import QuantumCircuit\n\nqc = QuantumCircuit(2)\nqc.x(0)\nqc.swap(0, 1)\n",
      hints: [
        "Primeiro excite q0 — leve-o para |1⟩.",
        "Depois troque os dois qubits de lugar sem medir nenhum deles.",
        "X(0) e então SWAP(0, 1).",
      ],
      assertions: [
        { kind: "qubits", exactly: 2 },
        { kind: "probabilities", expected: { "10": 1 } },
        { kind: "gateCount", max: 4 },
      ],
    },
  },
];

export const challengeById = new Map(challenges.map((challenge) => [challenge.id, challenge]));
