import { GATE_ARITY } from "./simulator";
import type { Circuit, GateName, Operation } from "./types";

/**
 * A paleta do laboratório.
 *
 * Mora aqui, e não dentro do componente, para o teste conseguir compará-la
 * com o motor sem arrastar React junto. Os dados das portas estavam
 * espalhados por quatro fontes que saíram de sincronia — o union de tipos, a
 * paleta visual, as strings dos desafios e a prosa do README — e doze portas
 * do motor não apareciam na tela, alcançáveis só escrevendo código.
 */
export type ItemDaPaleta = { gate: GateName; label: string; group: string };

/**
 * Portas que existem no motor mas não são "portas" para o aluno.
 *
 * BARRIER é uma marca de leitura e MEASURE tem botão próprio no diagrama.
 */
export const GATES_ESTRUTURAIS: GateName[] = ["BARRIER", "MEASURE"];

export const GRUPOS = ["Básicas", "Fase", "Rotações", "Múltiplos"] as const;

export const PALETA: ItemDaPaleta[] = [
  { gate: "I", label: "Identidade", group: "Básicas" },
  { gate: "H", label: "Hadamard", group: "Básicas" },
  { gate: "X", label: "Pauli X", group: "Básicas" },
  { gate: "Y", label: "Pauli Y", group: "Básicas" },
  { gate: "Z", label: "Pauli Z", group: "Básicas" },

  { gate: "S", label: "Fase S", group: "Fase" },
  { gate: "SDG", label: "Fase S†", group: "Fase" },
  { gate: "T", label: "Fase T", group: "Fase" },
  { gate: "TDG", label: "Fase T†", group: "Fase" },
  { gate: "P", label: "Fase λ", group: "Fase" },

  { gate: "RX", label: "Rotação X", group: "Rotações" },
  { gate: "RY", label: "Rotação Y", group: "Rotações" },
  { gate: "RZ", label: "Rotação Z", group: "Rotações" },
  { gate: "SX", label: "Raiz de X", group: "Rotações" },
  { gate: "SXDG", label: "Raiz de X†", group: "Rotações" },
  { gate: "U", label: "Universal U(θ,φ,λ)", group: "Rotações" },

  { gate: "CNOT", label: "Controlada X", group: "Múltiplos" },
  { gate: "CY", label: "Controlada Y", group: "Múltiplos" },
  { gate: "CZ", label: "Controlada Z", group: "Múltiplos" },
  { gate: "CH", label: "Controlada H", group: "Múltiplos" },
  { gate: "CP", label: "Fase controlada", group: "Múltiplos" },
  { gate: "CRX", label: "Rotação X controlada", group: "Múltiplos" },
  { gate: "CRY", label: "Rotação Y controlada", group: "Múltiplos" },
  { gate: "CRZ", label: "Rotação Z controlada", group: "Múltiplos" },
  { gate: "SWAP", label: "Troca", group: "Múltiplos" },
  { gate: "ISWAP", label: "Troca com i", group: "Múltiplos" },
  { gate: "CCX", label: "Toffoli", group: "Múltiplos" },
  { gate: "CCZ", label: "Z duplamente controlada", group: "Múltiplos" },
  { gate: "CSWAP", label: "Fredkin", group: "Múltiplos" },
  { gate: "MCX", label: "X multicontrolada", group: "Múltiplos" },
  { gate: "MCZ", label: "Z multicontrolada", group: "Múltiplos" },
];

/** Quantos ângulos a porta pede. Lido do motor, nunca repetido à mão. */
export const aridadeDe = (gate: GateName) => GATE_ARITY[gate] ?? 0;
export const precisaDeAngulo = (gate: GateName) => aridadeDe(gate) > 0;

/**
 * Como uma porta escolhida na paleta vira uma operação no circuito.
 *
 * Mora aqui junto da paleta, e não no componente, porque é justamente a
 * regra que decide quantos controles cada porta recebe — e é o que o teste
 * precisa exercitar para provar que tudo que está na tela o motor executa.
 */
export function montarOperacao(
  gate: GateName,
  alvo: number,
  circuito: Circuit,
  id: string,
): Operation {
  const position = circuito.operations.length;
  const outros = Array.from({ length: circuito.qubits }, (_, i) => i).filter((q) => q !== alvo);

  // Um parâmetro por aridade declarada no motor. `U` pede três; começar com um
  // só produziria uma matriz com NaN, que é o pior tipo de erro: silencioso.
  const aridade = aridadeDe(gate);
  const base = {
    id,
    gate,
    position,
    ...(aridade > 0 ? { params: Array.from({ length: aridade }, () => Math.PI / 2) } : {}),
  };

  if (gate === "MCX" || gate === "MCZ") {
    if (circuito.qubits < 2) throw new Error(`A porta ${gate} precisa de pelo menos 2 qubits.`);
    // Multicontrolada: todo o resto do registrador controla.
    return { ...base, controls: outros, targets: [alvo] };
  }

  if (gate === "CCX" || gate === "CCZ" || gate === "CSWAP") {
    if (circuito.qubits < 3) throw new Error(`A porta ${gate} precisa de pelo menos 3 qubits.`);
    return gate === "CSWAP"
      ? { ...base, controls: [outros[0]], targets: [alvo, outros[1]] }
      : { ...base, controls: outros.slice(0, 2), targets: [alvo] };
  }

  if (["CNOT", "CY", "CZ", "CH", "CP", "CRX", "CRY", "CRZ"].includes(gate)) {
    if (circuito.qubits < 2) throw new Error(`A porta ${gate} precisa de pelo menos 2 qubits.`);
    return { ...base, controls: [outros[0]], targets: [alvo] };
  }

  if (gate === "SWAP" || gate === "ISWAP") {
    if (circuito.qubits < 2) throw new Error(`A porta ${gate} precisa de pelo menos 2 qubits.`);
    return { ...base, targets: [alvo, outros[0]] };
  }

  return { ...base, targets: [alvo] };
}
