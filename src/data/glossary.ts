export type GlossaryEntry = {
  id: string;
  term: string;
  definition: string;
  /** Outras grafias que o marcador automático deve reconhecer no texto da aula. */
  aliases?: string[];
  seeAlso?: string[];
};

/**
 * Antes eram tuplas `[termo, definição]` sem id, o que impedia referenciar um
 * termo a partir de uma aula ou gerar página própria por termo.
 */
export const glossary: GlossaryEntry[] = [
  {
    id: "amplitude",
    term: "Amplitude",
    definition: "Número complexo que determina a probabilidade e a fase de um resultado quântico.",
    aliases: ["amplitudes"],
    seeAlso: ["fase", "probabilidade"],
  },
  {
    id: "ansatz",
    term: "Ansatz",
    definition: "Circuito parametrizado usado como hipótese em algoritmos quânticos variacionais.",
  },
  {
    id: "bra",
    term: "Bra",
    definition: "Vetor dual representado por ⟨ψ| na notação de Dirac.",
    seeAlso: ["ket"],
  },
  {
    id: "circuito-quantico",
    term: "Circuito quântico",
    definition: "Sequência ordenada de portas aplicada a um conjunto de qubits.",
    aliases: ["circuito", "circuitos quânticos"],
    seeAlso: ["porta-quantica", "qubit"],
  },
  {
    id: "coerencia",
    term: "Coerência",
    definition: "Capacidade de um sistema preservar relações de fase entre estados.",
    seeAlso: ["decoerencia", "fase"],
  },
  {
    id: "colapso",
    term: "Colapso",
    definition: "Descrição da seleção de um resultado definido durante uma medição.",
    seeAlso: ["medicao"],
  },
  {
    id: "decoerencia",
    term: "Decoerência",
    definition: "Perda de comportamento quântico causada pela interação com o ambiente.",
    seeAlso: ["coerencia", "nisq"],
  },
  {
    id: "emaranhamento",
    term: "Emaranhamento",
    definition: "Correlação quântica que impede descrever subsistemas de forma independente.",
    aliases: ["emaranhados", "emaranhado", "emaranhada"],
    seeAlso: ["estado-de-bell", "produto-tensorial"],
  },
  {
    id: "esfera-de-bloch",
    term: "Esfera de Bloch",
    definition: "Representação geométrica dos estados puros de um único qubit.",
    aliases: ["Bloch"],
    seeAlso: ["qubit"],
  },
  {
    id: "estado-de-bell",
    term: "Estado de Bell",
    definition: "Um dos quatro estados maximamente emaranhados de dois qubits.",
    aliases: ["par de Bell"],
    seeAlso: ["emaranhamento"],
  },
  {
    id: "fase",
    term: "Fase",
    definition: "Ângulo de uma amplitude complexa, essencial para os efeitos de interferência.",
    seeAlso: ["amplitude", "interferencia"],
  },
  {
    id: "fidelidade",
    term: "Fidelidade",
    definition: "Medida de proximidade entre dois estados ou processos quânticos.",
    seeAlso: ["nisq"],
  },
  {
    id: "interferencia",
    term: "Interferência",
    definition: "Combinação de amplitudes que reforça ou cancela possibilidades.",
    seeAlso: ["amplitude", "fase"],
  },
  {
    id: "ket",
    term: "Ket",
    definition: "Vetor de estado representado por |ψ⟩ na notação de Dirac.",
    seeAlso: ["bra"],
  },
  {
    id: "medicao",
    term: "Medição",
    definition: "Operação que produz um resultado clássico a partir de um estado quântico.",
    aliases: ["medir", "medida"],
    seeAlso: ["colapso", "shots"],
  },
  {
    id: "nisq",
    term: "NISQ",
    definition: "Era de dispositivos quânticos ruidosos e de escala intermediária.",
    seeAlso: ["decoerencia", "fidelidade"],
  },
  {
    id: "porta-quantica",
    term: "Porta quântica",
    definition: "Transformação unitária que altera um ou mais qubits.",
    aliases: ["porta", "portas", "portas quânticas"],
    seeAlso: ["unitaria", "circuito-quantico"],
  },
  {
    id: "produto-tensorial",
    term: "Produto tensorial",
    definition: "Operação que combina espaços de estado de sistemas diferentes.",
    seeAlso: ["emaranhamento"],
  },
  {
    id: "probabilidade",
    term: "Probabilidade",
    definition: "Chance de observar um resultado, dada pelo módulo ao quadrado da amplitude.",
    seeAlso: ["amplitude", "shots"],
  },
  {
    id: "qubit",
    term: "Qubit",
    definition: "Unidade de informação quântica, descrita por duas amplitudes complexas.",
    aliases: ["qubits"],
    seeAlso: ["superposicao", "esfera-de-bloch"],
  },
  {
    id: "shots",
    term: "Shots",
    definition: "Número de repetições de um circuito usadas para estimar probabilidades.",
    aliases: ["repetições"],
    seeAlso: ["medicao", "probabilidade"],
  },
  {
    id: "superposicao",
    term: "Superposição",
    definition: "Estado formado por uma combinação coerente de estados de uma base.",
    aliases: ["superposto", "superposta"],
    seeAlso: ["qubit", "interferencia"],
  },
  {
    id: "unitaria",
    term: "Unitária",
    definition: "Matriz reversível que preserva a norma de um estado quântico.",
    aliases: ["unitário", "unitárias"],
    seeAlso: ["porta-quantica"],
  },
];

export const glossaryById = new Map(glossary.map((entry) => [entry.id, entry]));

export function getGlossaryEntry(id: string) {
  return glossaryById.get(id);
}
