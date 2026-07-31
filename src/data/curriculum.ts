export type TrackId = "iniciante" | "programador" | "universitario";

export type Module = {
  id: string;
  number: number;
  title: string;
  shortTitle: string;
  description: string;
  concepts: string[];
  duration: number;
  project: string;
};

export type Track = {
  id: TrackId;
  eyebrow: string;
  title: string;
  audience: string;
  description: string;
  accent: string;
  modules: Module[];
};

export const lessonStages = [
  { id: "teoria", label: "Conceito", suffix: "entender" },
  { id: "experimento", label: "Experimento", suffix: "experimentar" },
  { id: "desafio", label: "Desafio", suffix: "construir" },
] as const;

export const tracks: Track[] = [
  {
    id: "iniciante",
    eyebrow: "Comece do zero",
    title: "Fundamentos quânticos",
    audience: "Para mentes curiosas",
    description:
      "Uma introdução visual, sem pré-requisitos, para pensar como um computador quântico.",
    accent: "#5d42cc",
    modules: [
      { id: "bits-e-qubits", number: 1, title: "Do bit ao qubit", shortTitle: "Bits → Qubits", description: "Descubra por que um qubit é muito mais que um 0 ou 1.", concepts: ["bit clássico", "qubit", "estado"], duration: 34, project: "Seu primeiro qubit" },
      { id: "superposicao", number: 2, title: "A arte da superposição", shortTitle: "Superposição", description: "Explore estados que guardam possibilidades ao mesmo tempo.", concepts: ["amplitude", "probabilidade", "Hadamard"], duration: 42, project: "Moeda quântica" },
      { id: "medicao", number: 3, title: "Medir é transformar", shortTitle: "Medição", description: "Veja como observar um sistema muda o resultado.", concepts: ["colapso", "shots", "histograma"], duration: 38, project: "Laboratório de medidas" },
      { id: "portas", number: 4, title: "Portas que movem estados", shortTitle: "Portas", description: "Controle qubits com as operações X, Z, H e rotações.", concepts: ["X", "Z", "H", "rotações"], duration: 52, project: "Sintetizador de estados" },
      { id: "emaranhamento", number: 5, title: "Conexões impossíveis", shortTitle: "Emaranhamento", description: "Crie pares de qubits que passam a compartilhar um destino.", concepts: ["CNOT", "Bell", "correlação"], duration: 48, project: "Par de Bell" },
      { id: "primeiro-circuito", number: 6, title: "Seu primeiro algoritmo", shortTitle: "Algoritmo", description: "Combine tudo em um circuito quântico completo.", concepts: ["circuito", "interferência", "execução"], duration: 60, project: "Gerador quântico" },
    ],
  },
  {
    id: "programador",
    eyebrow: "Código em primeiro lugar",
    title: "Engenharia de circuitos",
    audience: "Para quem já programa",
    description:
      "Traduza lógica clássica para circuitos quânticos e escreva seus primeiros programas em Qiskit.",
    accent: "#076f88",
    modules: [
      { id: "qiskit", number: 1, title: "Qiskit sem mistério", shortTitle: "Qiskit", description: "Modele, execute e inspecione circuitos com uma API familiar.", concepts: ["QuantumCircuit", "simulador", "counts"], duration: 45, project: "Hello, quantum" },
      { id: "estados-bell", number: 2, title: "Estados de Bell", shortTitle: "Bell", description: "Programe e teste correlações quânticas fundamentais.", concepts: ["H", "CX", "correlação"], duration: 50, project: "Teste de Bell" },
      { id: "teleportacao", number: 3, title: "Teleportação de informação", shortTitle: "Teleportação", description: "Transfira um estado usando emaranhamento e bits clássicos.", concepts: ["Bell pair", "medição", "correção"], duration: 70, project: "Protocolo de teleportação" },
      { id: "grover", number: 4, title: "Busca com Grover", shortTitle: "Grover", description: "Amplifique a resposta certa em um espaço de possibilidades.", concepts: ["oráculo", "difusor", "amplitude"], duration: 75, project: "Busca em quatro estados" },
      { id: "ruido", number: 5, title: "Ruído e mundo real", shortTitle: "Ruído", description: "Entenda decoerência, fidelidade e mitigação.", concepts: ["noise model", "fidelidade", "NISQ"], duration: 58, project: "Circuito resistente" },
      { id: "projeto-dev", number: 6, title: "Projeto: protocolo quântico", shortTitle: "Projeto final", description: "Projete, documente e valide um protocolo do início ao fim.", concepts: ["design", "testes", "análise"], duration: 90, project: "Portfólio quântico" },
    ],
  },
  {
    id: "universitario",
    eyebrow: "Rigor matemático",
    title: "Teoria e algoritmos",
    audience: "Para formação acadêmica",
    description:
      "Conecte a intuição ao formalismo: espaços de Hilbert, operadores e algoritmos.",
    accent: "#9f481f",
    modules: [
      { id: "algebra-linear", number: 1, title: "Álgebra linear essencial", shortTitle: "Álgebra linear", description: "Revise vetores complexos, bases, matrizes e autovalores.", concepts: ["vetores", "matrizes unitárias", "autovalores"], duration: 80, project: "Notebook vetorial" },
      { id: "dirac", number: 2, title: "Notação de Dirac", shortTitle: "Dirac", description: "Leia e manipule kets, bras, produtos internos e operadores.", concepts: ["ket", "bra", "operador"], duration: 65, project: "Atlas de estados" },
      { id: "produto-tensorial", number: 3, title: "Sistemas compostos", shortTitle: "Tensor", description: "Construa espaços de múltiplos qubits e estados emaranhados.", concepts: ["tensor", "separabilidade", "densidade"], duration: 78, project: "Classificador de estados" },
      { id: "qft", number: 4, title: "Transformada de Fourier quântica", shortTitle: "QFT", description: "Derive e implemente um dos blocos centrais da computação quântica.", concepts: ["fase", "QFT", "phase kickback"], duration: 95, project: "Circuito QFT" },
      { id: "variacionais", number: 5, title: "Algoritmos variacionais", shortTitle: "VQA", description: "Combine otimizadores clássicos e circuitos parametrizados.", concepts: ["ansatz", "observável", "otimização"], duration: 100, project: "VQE mínimo" },
      { id: "correcao-erros", number: 6, title: "Correção de erros", shortTitle: "QEC", description: "Proteja informação quântica com redundância e síndromes.", concepts: ["bit flip", "síndrome", "código lógico"], duration: 105, project: "Código de três qubits" },
    ],
  },
];

export const totalLessons = tracks.reduce(
  (total, track) => total + track.modules.length * lessonStages.length,
  0,
);

export function getTrack(id: string) {
  return tracks.find((track) => track.id === id);
}

export function getModule(trackId: string, moduleId: string) {
  return getTrack(trackId)?.modules.find((module) => module.id === moduleId);
}

export function getLessonId(trackId: string, moduleId: string, stageId: string) {
  return `${trackId}/${moduleId}/${stageId}`;
}

export function getModuleLessons(trackId: string, moduleId: string) {
  return lessonStages.map((stage, index) => ({
    ...stage,
    index,
    href: `/curso/${trackId}/${moduleId}/${stage.id}`,
    id: getLessonId(trackId, moduleId, stage.id),
  }));
}

export function getAllLessons() {
  return tracks.flatMap((track) =>
    track.modules.flatMap((module) =>
      getModuleLessons(track.id, module.id).map((lesson) => ({
        ...lesson,
        track,
        module,
      })),
    ),
  );
}

export function getNextLesson(trackId: string, moduleId: string, lessonId: string) {
  const all = getAllLessons();
  const index = all.findIndex(
    (item) =>
      item.track.id === trackId &&
      item.module.id === moduleId &&
      item.id.endsWith(`/${lessonId}`),
  );
  return index >= 0 ? all[index + 1] : undefined;
}
