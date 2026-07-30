export const challenges = [
  { id: "moeda", level: "Iniciante", title: "Moeda quântica", description: "Crie uma distribuição exatamente equilibrada entre |0⟩ e |1⟩.", gates: ["H"], goal: "50% / 50%", accent: "violet" },
  { id: "inversor", level: "Iniciante", title: "O inversor", description: "Leve um qubit de |0⟩ para |1⟩ com uma única operação.", gates: ["X"], goal: "P(|1⟩) = 100%", accent: "violet" },
  { id: "bell", level: "Programador", title: "Par inseparável", description: "Produza somente os estados |00⟩ e |11⟩ com pesos iguais.", gates: ["H", "CNOT"], goal: "Estado de Bell", accent: "cyan" },
  { id: "ghz", level: "Programador", title: "Constelação GHZ", description: "Emaranhe três qubits em uma correlação perfeita.", gates: ["H", "CNOT", "CNOT"], goal: "|000⟩ + |111⟩", accent: "cyan" },
  { id: "fase", level: "Universitário", title: "Fase invisível", description: "Mude a fase e use interferência para torná-la observável.", gates: ["H", "Z", "H"], goal: "Phase kickback", accent: "orange" },
  { id: "swap", level: "Universitário", title: "Troca unitária", description: "Transfira a excitação de q0 para q1 sem medir.", gates: ["X", "SWAP"], goal: "|01⟩ → |10⟩", accent: "orange" },
];
