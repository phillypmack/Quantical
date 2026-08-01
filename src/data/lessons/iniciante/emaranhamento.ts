import type { Circuit } from "@/lib/quantum/types";
import type { Lesson } from "../types";

/**
 * Módulo 5. A explicação preguiçosa de emaranhamento é "duas moedas que caem
 * sempre iguais porque foram preparadas assim". A demolição que derruba isso é
 * a invariância do par de Bell sob troca de base: aplique H nos DOIS qubits e a
 * correlação perfeita continua lá. Duas moedas preparadas iguais perderiam a
 * correlação nessa troca.
 *
 * O comprimento do vetor de Bloch, que o motor passou a expor com honestidade,
 * é a outra metade do argumento: num par de Bell nenhum dos dois qubits tem
 * estado próprio.
 */

let sequence = 0;
const circuit = (qubits: number, gates: [string, number[], number[]?][]): Circuit => ({
  qubits,
  shots: 1024,
  operations: gates.map(([gate, targets, controls], index) => ({
    id: `e${(sequence += 1)}-${index}`,
    gate: gate as Circuit["operations"][number]["gate"],
    targets,
    ...(controls ? { controls } : {}),
    position: index,
  })),
});

const bell = circuit(2, [["H", [0]], ["CNOT", [1], [0]]]);
const produtoMais = circuit(2, [["H", [0]], ["H", [1]]]);
const bellComHH = circuit(2, [["H", [0]], ["CNOT", [1], [0]], ["H", [0]], ["H", [1]]]);
const produtoComHH = circuit(2, [["H", [0]], ["H", [1]], ["H", [0]], ["H", [1]]]);
const bellMenosComHH = circuit(2, [
  ["H", [0]],
  ["CNOT", [1], [0]],
  ["Z", [0]],
  ["H", [0]],
  ["H", [1]],
]);

export const emaranhamento: Lesson[] = [
  {
    id: "iniciante/emaranhamento/teoria",
    trackId: "iniciante",
    moduleId: "emaranhamento",
    stage: "teoria",
    title: "Correlação que sobrevive à troca de pergunta",
    summary:
      "Duas moedas preparadas iguais também caem sempre iguais. O que distingue o emaranhamento é que a correlação continua perfeita mesmo quando você muda a pergunta para os dois.",
    minutes: 12,
    objectives: [
      "Preparar um par de Bell e reconhecer a correlação",
      "Explicar por que qubits emaranhados não têm estado próprio",
      "Distinguir emaranhamento de correlação clássica pela troca de base",
    ],
    glossaryRefs: ["emaranhamento", "estado-de-bell", "esfera-de-bloch", "produto-tensorial", "medicao"],
    blocks: [
      {
        kind: "p",
        text:
          "Até aqui trabalhamos com um qubit só. Com dois, aparece um fenômeno que não tem equivalente em nada da computação clássica — e que costuma ser explicado de um jeito que erra o alvo.",
      },
      {
        kind: "p",
        text:
          "O circuito é curto: uma Hadamard no primeiro qubit e uma CNOT do primeiro para o segundo. O resultado é o par de Bell, e ao medir só aparecem dois resultados, |00⟩ e |11⟩, cada um com metade das vezes. Os dois qubits sempre concordam.",
      },
      {
        kind: "formula",
        latex: "|Φ⁺⟩ = (|00⟩ + |11⟩)/√2",
        caption: "Nunca |01⟩, nunca |10⟩ — a concordância é perfeita",
      },
      {
        kind: "h",
        text: "Por que a explicação óbvia não serve",
      },
      {
        kind: "metaphor",
        image:
          "É como preparar duas moedas idênticas, selar cada uma num envelope e mandar para lados opostos do mundo. Quando alguém abre, as duas mostram a mesma face — porque já eram iguais desde o começo. O emaranhamento seria isso, só que com qubits.",
        ilustracao: {
          src: "/images/metafora-envelopes-gemeos.webp",
          alt: "Dois envelopes lacrados se afastam em sentidos opostos, cada um com o contorno de uma moeda dentro.",
        },
        breaks:
          "Essa imagem explica a concordância, e é por isso que engana. O teste que a derruba é mudar a pergunta para os dois lados ao mesmo tempo: aplique uma Hadamard em cada qubit antes de medir. Se cada envelope carregasse um valor já decidido, essa troca destruiria a correlação e os quatro resultados apareceriam igualmente. Rode o circuito ao lado: continuam só |00⟩ e |11⟩. A concordância sobreviveu à troca de pergunta, e é isso que nenhum par de moedas consegue fazer.",
        circuit: bellComHH,
        caption: "Par de Bell com Hadamard nos dois qubits: a correlação perfeita permanece",
      },
      {
        kind: "callout",
        variant: "ideia",
        title: "Ideia-chave",
        text:
          "A correlação clássica vale para uma pergunta específica. A correlação do par de Bell vale para uma família inteira de perguntas ao mesmo tempo — e nenhuma combinação de valores decididos de antemão consegue imitar isso.",
      },
      {
        kind: "h",
        text: "Nenhum dos dois tem estado próprio",
      },
      {
        kind: "p",
        text:
          "Há um segundo sinal, e ele aparece na esfera de Bloch. Nos módulos anteriores a seta sempre tinha comprimento um, apontando para algum lugar da superfície. Num par de Bell, a seta de cada qubit tem comprimento zero.",
      },
      {
        kind: "figure",
        view: "bloch",
        circuit: bell,
        caption:
          "Os dois qubits do par de Bell: seta de comprimento zero. Não é que o estado seja desconhecido — é que nenhum estado individual descreve cada um deles separadamente.",
      },
      {
        kind: "callout",
        variant: "atencao",
        title: "O que comprimento zero significa",
        text:
          "Não é ignorância sobre qual estado o qubit tem. É que a descrição completa do par não pode ser separada em uma descrição para cada um. A informação está na relação, não nas partes — e por isso olhar um qubit sozinho não revela absolutamente nada.",
      },
      {
        kind: "p",
        text:
          "Compare com o circuito que aplica uma Hadamard em cada qubit, sem CNOT nenhuma. Ali os quatro resultados aparecem igualmente, não há correlação, e cada seta de Bloch tem comprimento um. Esse é um estado separável: dois qubits independentes, cada um com sua própria história. A CNOT é o que costura os dois numa história só.",
      },
    ],
    quiz: [
      {
        id: "q1",
        prompt: "O que distingue o par de Bell de duas moedas preparadas iguais?",
        options: [
          {
            text: "A correlação do par de Bell continua perfeita mesmo quando se muda a base de medição dos dois.",
            correct: true,
            explanation:
              "Exato. Valores decididos de antemão não conseguem reproduzir a correlação em várias bases ao mesmo tempo.",
          },
          {
            text: "O par de Bell dá resultados iguais e as moedas dão resultados aleatórios.",
            correct: false,
            explanation:
              "As moedas preparadas iguais também dão sempre resultados iguais. Na medição padrão os dois casos são indistinguíveis.",
            equivoco: "moedas-correlacionadas",
          },
          {
            text: "O par de Bell transmite informação instantaneamente entre os dois qubits.",
            correct: false,
            explanation:
              "Não transmite. Olhando só um dos qubits você vê ruído puro; a correlação só aparece ao comparar os dois resultados, e comparar exige comunicação comum.",
            equivoco: "emaranhamento-transmite",
          },
        ],
      },
      {
        id: "q2",
        prompt: "O vetor de Bloch de um qubit emaranhado tem comprimento zero. O que isso quer dizer?",
        options: [
          {
            text: "Que nenhum estado individual descreve aquele qubit sozinho — a informação está na relação com o outro.",
            correct: true,
            explanation:
              "Certo. É a marca do emaranhamento, e o motivo pelo qual olhar um qubit isolado não revela nada.",
          },
          {
            text: "Que o qubit foi apagado ou perdeu energia.",
            correct: false,
            explanation:
              "O par continua com toda a informação. O que não existe é uma descrição separada para cada metade.",
          },
          {
            text: "Que o estado é desconhecido, mas existe e poderia ser descoberto.",
            correct: false,
            explanation:
              "É mais forte que ignorância: não existe estado individual a ser descoberto. Foi exatamente essa a diferença testada pela troca de base.",
            equivoco: "qubit-emaranhado-tem-estado",
          },
        ],
      },
      {
        id: "q3",
        prompt: "Para que serve a porta CNOT na preparação do par de Bell?",
        options: [
          {
            text: "Ela liga o segundo qubit ao primeiro, transformando dois estados independentes em um só estado conjunto.",
            correct: true,
            explanation:
              "Isso. Sem ela, H nos dois qubits produziria um estado separável, com os quatro resultados e nenhuma correlação.",
          },
          {
            text: "Ela copia o valor do primeiro qubit para o segundo.",
            correct: false,
            explanation:
              "Copiar um estado quântico desconhecido é impossível. O que a CNOT faz é correlacionar, não duplicar — e o resultado é justamente que nenhum dos dois tem valor próprio.",
            equivoco: "qubit-emaranhado-tem-estado",
          },
        ],
      },
    ],
  },

  {
    id: "iniciante/emaranhamento/experimento",
    trackId: "iniciante",
    moduleId: "emaranhamento",
    stage: "experimento",
    title: "A correlação que muda de pergunta",
    summary:
      "Você vai construir um par de Bell, comparar com dois qubits independentes, e então testar a explicação das moedas até ela quebrar.",
    minutes: 14,
    objectives: [
      "Distinguir estado emaranhado de estado separável no histograma e na esfera",
      "Prever o efeito de mudar a base de medição dos dois qubits",
    ],
    glossaryRefs: ["emaranhamento", "estado-de-bell", "esfera-de-bloch", "medicao"],
    blocks: [
      {
        kind: "p",
        text:
          "Neste roteiro, alterne entre o histograma e a aba Bloch a cada passo. O histograma mostra a correlação; a esfera mostra o que sobrou de cada qubit individualmente.",
      },
    ],
    guided: {
      title: "A correlação que muda de pergunta",
      steps: [
        {
          id: "separavel",
          instruction:
            "Comece pelo caso fácil: uma Hadamard em cada qubit, sem CNOT. Dois qubits independentes, cada um em superposição. Preveja o histograma.",
          circuit: produtoMais,
          predict: {
            instrument: "choice",
            question: "Como ficam os quatro resultados?",
            states: ["00", "01", "10", "11"],
            choices: [
              {
                id: "todos",
                label: "Os quatro iguais",
                distribution: { "00": 0.25, "01": 0.25, "10": 0.25, "11": 0.25 },
              },
              {
                id: "correlacionado",
                label: "Só 00 e 11",
                distribution: { "00": 0.5, "01": 0, "10": 0, "11": 0.5 },
              },
            ],
          },
          reveal:
            "Vinte e cinco por cento para cada um dos quatro. Nenhuma correlação: saber o resultado de um qubit não diz nada sobre o outro. Veja a aba Bloch — cada seta tem comprimento um, porque cada qubit tem estado próprio. Isto é um estado separável.",
        },
        {
          id: "bell",
          instruction:
            "Agora acrescente a CNOT depois da primeira Hadamard, e tire a segunda. É o par de Bell. Preveja.",
          circuit: bell,
          predict: {
            instrument: "choice",
            question: "E agora?",
            states: ["00", "01", "10", "11"],
            choices: [
              {
                id: "correlacionado",
                label: "Só 00 e 11",
                distribution: { "00": 0.5, "01": 0, "10": 0, "11": 0.5 },
              },
              {
                id: "todos",
                label: "Os quatro iguais",
                distribution: { "00": 0.25, "01": 0.25, "10": 0.25, "11": 0.25 },
              },
            ],
          },
          reveal:
            "Só |00⟩ e |11⟩, metade cada. Os dois qubits sempre concordam. Agora abra a aba Bloch: as duas setas encolheram até comprimento zero. Cada qubit, olhado sozinho, virou ruído puro — e mesmo assim os dois juntos concordam perfeitamente. É a primeira pista de que a informação não está nas partes.",
        },
        {
          id: "moedas",
          instruction:
            "Antes do passo decisivo, guarde a hipótese das moedas: cada qubit já teria um valor decidido, os dois iguais, e a medição só revelaria. Ela explica tudo que você viu até agora. Vamos testá-la mudando a pergunta nos DOIS lados — uma Hadamard em cada qubit antes de medir. Preveja com cuidado.",
          circuit: bellComHH,
          predict: {
            instrument: "choice",
            question: "Trocando a pergunta dos dois, o que aparece?",
            states: ["00", "01", "10", "11"],
            choices: [
              {
                id: "todos",
                label: "Os quatro iguais: a correlação se perde",
                distribution: { "00": 0.25, "01": 0.25, "10": 0.25, "11": 0.25 }, equivoco: "moedas-correlacionadas",
              },
              {
                id: "correlacionado",
                label: "Continua só 00 e 11",
                distribution: { "00": 0.5, "01": 0, "10": 0, "11": 0.5 },
              },
              {
                id: "anti",
                label: "Vira só 01 e 10",
                distribution: { "00": 0, "01": 0.5, "10": 0.5, "11": 0 },
              },
            ],
          },
          reveal:
            "Continua só |00⟩ e |11⟩. A concordância sobreviveu inteira à troca de pergunta — e é aqui que a explicação das moedas morre. Se cada qubit carregasse um valor já decidido, mudar a base espalharia os resultados pelos quatro cantos, exatamente como acontece com dois qubits independentes. O par de Bell concorda em mais de uma base ao mesmo tempo, e nenhuma combinação de valores pré-decididos consegue imitar isso.",
          branches: [
            {
              id: "produto-com-hh",
              label: "E o estado separável, com a mesma troca?",
              question:
                "Os dois qubits independentes do primeiro passo, agora com Hadamard extra em cada um antes de medir. Preveja.",
              circuit: produtoComHH,
              reveal:
                "Cem por cento em |00⟩. Duas Hadamards em cada qubit se desfazem e sobra o estado inicial. É o contraste que fecha o argumento: o estado separável muda completamente de comportamento quando você troca a pergunta, e o par de Bell mantém a correlação.",
            },
            {
              id: "bell-menos",
              label: "E se eu acrescentar um Z antes?",
              question:
                "O mesmo par de Bell, mas com uma porta Z no primeiro qubit antes da troca de base. Preveja o histograma final.",
              circuit: bellMenosComHH,
              reveal:
                "Agora saem |01⟩ e |10⟩: a correlação virou anticorrelação, os qubits sempre discordam. Uma única porta Z, que sozinha nem mexeria nas probabilidades, inverteu o tipo de correlação do par inteiro. Existem quatro estados de Bell, e eles se distinguem exatamente por esse jogo de sinais.",
            },
          ],
        },
      ],
    },
    quiz: [
      {
        id: "q1",
        prompt: "Por que o teste com Hadamard nos dois qubits derruba a explicação das moedas?",
        options: [
          {
            text: "Porque valores decididos de antemão só produzem correlação numa base; ao trocar de base, ela se perderia.",
            correct: true,
            explanation:
              "Exato. O par de Bell mantém a correlação, e nenhuma atribuição prévia de valores reproduz isso.",
          },
          {
            text: "Porque a Hadamard apaga a informação clássica que estava guardada.",
            correct: false,
            explanation:
              "Se apagasse informação, o resultado seria aleatório. Aconteceu o contrário: a correlação continuou perfeita.",
            equivoco: "moedas-correlacionadas",
          },
        ],
      },
      {
        id: "q2",
        prompt: "No estado separável, o que aconteceu ao aplicar Hadamard duas vezes em cada qubit?",
        options: [
          {
            text: "Voltou a |00⟩, porque duas Hadamards no mesmo qubit se desfazem.",
            correct: true,
            explanation:
              "Certo, é o H·H do módulo 1 aplicado aos dois qubits em paralelo. Cada um seguiu sua própria história, o que é a definição de separável.",
          },
          {
            text: "Continuou com os quatro resultados iguais.",
            correct: false,
            explanation:
              "Isso aconteceria se as Hadamards fossem sorteios independentes — mas elas são rotações reversíveis, e duas seguidas se cancelam.",
          },
        ],
      },
    ],
  },

  {
    id: "iniciante/emaranhamento/desafio",
    trackId: "iniciante",
    moduleId: "emaranhamento",
    stage: "desafio",
    title: "O par que sempre discorda",
    summary:
      "Prepare dois qubits emaranhados que nunca concordam: um dá 0 quando o outro dá 1.",
    minutes: 11,
    objectives: ["Construir um estado de Bell anticorrelacionado"],
    glossaryRefs: ["emaranhamento", "estado-de-bell"],
    blocks: [
      {
        kind: "p",
        text:
          "O par de Bell que você construiu sempre concorda. Existe outro em que os dois qubits sempre discordam: medir 0 num garante 1 no outro. Prepare esse.",
      },
    ],
    exercise: {
      id: "bell-anticorrelacionado",
      prompt:
        "Prepare dois qubits emaranhados que nunca dão o mesmo resultado: só |01⟩ e |10⟩, cada um com metade das vezes.",
      qubits: 2,
      starterCode:
        "from qiskit import QuantumCircuit\n\nqc = QuantumCircuit(2)\n# seu código aqui\n",
      solutionCode:
        "from qiskit import QuantumCircuit\n\nqc = QuantumCircuit(2)\nqc.h(0)\nqc.cx(0, 1)\nqc.x(1)\n",
      hints: [
        "Comece pelo par de Bell comum, aquele que sempre concorda.",
        "Depois dele, você só precisa inverter um dos dois qubits para que a concordância vire discordância.",
        "H(0), CX(0, 1) e então X em um dos qubits.",
      ],
      assertions: [
        { kind: "qubits", exactly: 2 },
        { kind: "probabilities", expected: { "01": 0.5, "10": 0.5 } },
        { kind: "gateCount", max: 5 },
      ],
    },
    quiz: [
      {
        id: "q1",
        prompt: "Esse par anticorrelacionado ainda é emaranhado?",
        options: [
          {
            text: "Sim: nenhum dos dois qubits tem estado próprio, e a seta de Bloch de cada um continua com comprimento zero.",
            correct: true,
            explanation:
              "Certo. Concordar sempre e discordar sempre são dois tipos de correlação perfeita — e ambos exigem emaranhamento.",
          },
          {
            text: "Não: anticorrelação é apenas correlação clássica invertida.",
            correct: false,
            explanation:
              "A troca de base testaria isso do mesmo jeito, e a correlação sobreviveria. É emaranhamento tanto quanto o outro par.",
            equivoco: "moedas-correlacionadas",
          },
        ],
      },
    ],
  },
];
