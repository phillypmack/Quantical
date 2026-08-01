import type { Circuit } from "@/lib/quantum/types";
import type { Lesson } from "../types";

/**
 * Módulo 1, escrito à mão. É o padrão-ouro do formato: todo módulo gerado
 * depois entra com estes três arquivos como exemplar no contexto.
 */

let sequence = 0;
const circuit = (qubits: number, gates: [string, number[], number[]?][]): Circuit => ({
  qubits,
  shots: 1024,
  operations: gates.map(([gate, targets, controls], index) => ({
    id: `c${(sequence += 1)}-${index}`,
    gate: gate as Circuit["operations"][number]["gate"],
    targets,
    ...(controls ? { controls } : {}),
    position: index,
  })),
});

const vazio = circuit(1, []);
const comX = circuit(1, [["X", [0]]]);
const comH = circuit(1, [["H", [0]]]);
const doisH = circuit(1, [["H", [0]], ["H", [0]]]);
const duasX = circuit(1, [["X", [0]], ["X", [0]]]);
const hDepoisX = circuit(1, [["H", [0]], ["X", [0]]]);

export const bitsEQubits: Lesson[] = [
  {
    id: "iniciante/bits-e-qubits/teoria",
    trackId: "iniciante",
    moduleId: "bits-e-qubits",
    stage: "teoria",
    title: "O que um qubit tem que um bit não tem",
    summary:
      "Um bit guarda um valor. Um qubit guarda uma indecisão com estrutura — e essa estrutura é o que torna a computação quântica possível.",
    minutes: 9,
    objectives: [
      "Explicar por que um qubit não é apenas um bit mais rápido",
      "Ler a notação |0⟩, |1⟩ e α|0⟩ + β|1⟩",
      "Reconhecer que probabilidade não é a mesma coisa que amplitude",
    ],
    glossaryRefs: ["qubit", "superposicao", "amplitude", "probabilidade", "medicao"],
    blocks: [
      {
        kind: "p",
        text:
          "Um bit clássico é uma resposta. Ele vale 0 ou vale 1, e se você perguntar dez vezes vai receber dez vezes a mesma coisa. Toda a computação que você já usou é construída em cima dessa firmeza.",
      },
      {
        kind: "p",
        text:
          "Um qubit é outra coisa. Antes de ser medido ele não guarda uma resposta: guarda o quanto ele pende para cada resposta possível. Escrevemos isso como α|0⟩ + β|1⟩, onde α e β são números que dizem o peso de cada saída.",
      },
      {
        kind: "formula",
        latex: "|ψ⟩ = α|0⟩ + β|1⟩",
        caption: "|α|² + |β|² = 1 — os pesos ao quadrado sempre somam 100%",
      },
      {
        kind: "callout",
        variant: "atencao",
        title: "O detalhe que muda tudo",
        text:
          "α e β não são probabilidades. São números que podem ser negativos — e mais adiante, complexos. A probabilidade é |α|², o quadrado. Guardar o número antes de elevá-lo ao quadrado é exatamente o que abre espaço para algo que a computação clássica não tem: dois caminhos que se cancelam.",
      },
      {
        kind: "h",
        text: "Por que isso não é só aleatoriedade",
      },
      {
        kind: "p",
        text:
          "É tentador achar que um qubit é uma moeda girando: enquanto ninguém olha, ele é meio 0 e meio 1. A imagem ajuda no começo, mas ela erra no ponto mais importante — e o erro dela é fácil de mostrar num circuito.",
      },
      {
        kind: "metaphor",
        image:
          "Pense numa moeda girando no ar. Enquanto gira, não faz sentido perguntar se ela é cara ou coroa; só quando ela cai é que existe um resultado.",
        ilustracao: {
          src: "/images/metafora-moeda-girando.webp",
          alt: "Moeda violeta vista de lado girando acima de uma linha que representa uma mesa.",
        },
        breaks:
          "Mas uma moeda girando não se desgira. Se aleatoriedade fosse a resposta, aplicar duas vezes a mesma porta que 'embaralha' o qubit deveria deixá-lo ainda mais embaralhado. Rode o circuito ao lado: duas portas H seguidas devolvem o qubit a |0⟩ com 100% de certeza. Ou seja, H não sorteia nada — H gira, e girar duas vezes volta ao começo.",
        circuit: doisH,
        caption: "H aplicado duas vezes: o resultado é certeza, não sorteio",
      },
      {
        kind: "p",
        text:
          "Esse é o ponto que separa um qubit de um bit aleatório. A indecisão do qubit tem estrutura e é reversível. O acaso só aparece no instante da medição — e nem sempre aparece.",
      },
      {
        kind: "callout",
        variant: "ideia",
        title: "Ideia-chave",
        text:
          "Um circuito quântico não calcula uma resposta direto. Ele organiza pesos para que, na hora de medir, algumas respostas sejam muito mais prováveis que outras.",
      },
    ],
    quiz: [
      {
        id: "q1",
        prompt: "Qual é a diferença essencial entre um qubit e um bit que é sorteado ao acaso?",
        options: [
          {
            text: "A indecisão do qubit é reversível: dá para desfazê-la e recuperar a certeza inicial.",
            correct: true,
            explanation:
              "Exato. Duas portas H seguidas devolvem o qubit a |0⟩ com certeza — algo impossível para um sorteio de verdade.",
          },
          {
            text: "O qubit sorteia mais rápido que um bit clássico.",
            correct: false,
            explanation:
              "Velocidade não tem nada a ver. Um gerador de números aleatórios clássico pode ser rapidíssimo e ainda assim não é reversível.",
          },
          {
            text: "O qubit pode guardar valores entre 0 e 1, como 0,5.",
            correct: false,
            explanation:
              "A medição de um qubit sempre devolve 0 ou 1, nunca um valor intermediário. O que é contínuo são os pesos, não o resultado.",
          },
        ],
      },
      {
        id: "q2",
        prompt: "Se α = 0,6 e β = 0,8, qual a chance de medir 1?",
        options: [
          {
            text: "64%, porque a probabilidade é |β|² = 0,8².",
            correct: true,
            explanation: "Isso. A probabilidade é o quadrado da amplitude, e 0,8² = 0,64.",
          },
          {
            text: "80%, porque β = 0,8.",
            correct: false,
            explanation:
              "Essa é a confusão mais comum do assunto: β é a amplitude, não a probabilidade. Só depois de elevar ao quadrado se chega na chance.",
            equivoco: "amplitude-e-probabilidade",
          },
          {
            text: "50%, porque só existem dois resultados possíveis.",
            correct: false,
            explanation:
              "Dois resultados possíveis não significa dois resultados igualmente prováveis. Aqui os pesos são diferentes.",
          },
        ],
      },
      {
        id: "q3",
        prompt: "Por que α pode ser negativo?",
        options: [
          {
            text: "Porque o sinal permite que caminhos diferentes se cancelem na interferência.",
            correct: true,
            explanation:
              "Exato. Se só existissem probabilidades, nada poderia se subtrair — e é o cancelamento que dá poder aos algoritmos quânticos.",
          },
          {
            text: "Porque um qubit pode ter probabilidade negativa.",
            correct: false,
            explanation:
              "Probabilidade nunca é negativa. Quem pode ser negativo é a amplitude; o quadrado dela volta a ser positivo.",
            equivoco: "amplitude-e-probabilidade",
          },
          {
            text: "É apenas uma convenção de notação, sem efeito físico.",
            correct: false,
            explanation:
              "Tem efeito, e enorme: o sinal é justamente o que faz duas possibilidades se anularem.",
            equivoco: "fase-nao-tem-efeito",
          },
        ],
      },
    ],
  },

  {
    id: "iniciante/bits-e-qubits/experimento",
    trackId: "iniciante",
    moduleId: "bits-e-qubits",
    stage: "experimento",
    title: "Seu primeiro qubit",
    summary:
      "Cinco passos, cada um com um palpite antes de rodar. O último derruba a explicação mais comum sobre superposição.",
    minutes: 12,
    objectives: [
      "Prever o resultado de um circuito antes de executá-lo",
      "Distinguir o efeito de X do efeito de H",
      "Explicar por que H não é um sorteio",
    ],
    glossaryRefs: ["superposicao", "porta-quantica", "shots", "medicao"],
    blocks: [
      {
        kind: "p",
        text:
          "A partir daqui você não vai ler sobre um qubit: vai mexer em um. A regra é uma só — antes de cada execução você registra um palpite. Errar é parte do método, e é o que faz a explicação seguinte grudar.",
      },
    ],
    guided: {
      title: "Seu primeiro qubit",
      steps: [
        {
          id: "passo-1",
          instruction:
            "Este é um qubit em |0⟩, sem nenhuma porta aplicada. Antes de mexer em qualquer coisa: o que você espera ver ao medir mil vezes?",
          circuit: vazio,
          predict: {
            instrument: "choice",
            question: "Como deve ficar o histograma?",
            states: ["0", "1"],
            choices: [
              { id: "tudo-zero", label: "Sempre 0", distribution: { "0": 1, "1": 0 } },
              { id: "meio-meio", label: "Metade de cada", distribution: { "0": 0.5, "1": 0.5 } },
              { id: "tudo-um", label: "Sempre 1", distribution: { "0": 0, "1": 1 } },
            ],
          },
          reveal:
            "Sem portas, nada de quântico acontece: o qubit fica em |0⟩ e mil medições dão mil zeros. Essa é a linha de base — vale a pena ter visto, porque tudo daqui em diante é desvio a partir dela.",
        },
        {
          id: "passo-2",
          instruction:
            "Agora com uma porta X. Ela é o equivalente quântico do NOT clássico. Preveja antes de rodar.",
          circuit: comX,
          predict: {
            instrument: "choice",
            question: "O que a porta X faz com |0⟩?",
            states: ["0", "1"],
            choices: [
              { id: "tudo-um", label: "Sempre 1", distribution: { "0": 0, "1": 1 } },
              { id: "meio-meio", label: "Metade de cada", distribution: { "0": 0.5, "1": 0.5 } },
              { id: "tudo-zero", label: "Continua 0", distribution: { "0": 1, "1": 0 } },
            ],
          },
          reveal:
            "X inverte, e ponto: |0⟩ vira |1⟩ com 100% de certeza. Isto ainda é o mundo clássico — um NOT comum faria exatamente o mesmo. Nada aqui exige computação quântica.",
          branches: [
            {
              id: "duas-x",
              label: "E se eu puser dois X seguidos?",
              question: "Dois X em sequência. Antes de rodar: onde isso vai parar?",
              circuit: duasX,
              reveal:
                "Volta para |0⟩. Inverter duas vezes é não inverter — igualzinho ao mundo clássico. Guarde esta sensação: no passo 5 vamos fazer o mesmo com H, e o resultado vai ser bem menos óbvio.",
            },
          ],
        },
        {
          id: "passo-3",
          instruction:
            "Troque o X por um H, a porta Hadamard. É a primeira porta genuinamente quântica que você vai usar. Preveja.",
          circuit: comH,
          predict: {
            instrument: "slider",
            question: "Que porcentagem das medições vai dar 1?",
            states: ["0", "1"],
          },
          reveal:
            "Cinquenta por cento para cada lado. É aqui que quase todo mundo conclui: “então H transforma o qubit em uma moeda”. Segure essa conclusão por mais dois passos — ela vai cair.",
        },
        {
          id: "passo-4",
          instruction:
            "Mesmo circuito, mas repare nos números exatos. Rode de novo. E de novo. Preveja se os valores vão se repetir.",
          circuit: comH,
          predict: {
            instrument: "choice",
            question: "Executando de novo, as contagens vão dar exatamente igual?",
            states: ["0", "1"],
            choices: [
              { id: "variam", label: "Variam um pouco", distribution: { "0": 0.5, "1": 0.5 } },
              { id: "identicas", label: "Idênticas sempre", distribution: { "0": 0.5, "1": 0.5 } },
            ],
          },
          reveal:
            "Troque para a aba “shots” no painel e rode algumas vezes. Você vai ver 512, depois 497, depois 508 — nunca exatamente metade. A teoria diz 50%; a medição entrega uma amostra. Essa diferença entre o valor exato e o que sai do experimento é o que a palavra “shots” significa.",
        },
        {
          id: "passo-5",
          instruction:
            "Agora o passo que importa: DOIS H seguidos, um logo depois do outro. Pense com calma antes de apostar.",
          circuit: doisH,
          predict: {
            instrument: "choice",
            question: "Depois de dois H, como fica a distribuição?",
            states: ["0", "1"],
            choices: [
              { id: "meio-meio", label: "Continua 50/50", distribution: { "0": 0.5, "1": 0.5 }, equivoco: "h-e-sorteio" },
              { id: "tudo-zero", label: "Volta a ser sempre 0", distribution: { "0": 1, "1": 0 } },
              { id: "tudo-um", label: "Passa a ser sempre 1", distribution: { "0": 0, "1": 1 } },
            ],
          },
          reveal:
            "Cem por cento em |0⟩. Se H fosse mesmo um sorteio, embaralhar duas vezes deixaria tudo ainda mais embaralhado — duas moedas jogadas em sequência não devolvem cara garantida. Deu zero por cento de chance de sair 1. Logo H não é aleatoriedade: é uma rotação, e é reversível. O acaso que você viu no passo 3 não estava na porta, estava na medição.",
          branches: [
            {
              id: "h-depois-x",
              label: "E se for H e depois X?",
              question: "H seguido de X. Preveja o histograma.",
              circuit: hDepoisX,
              reveal:
                "Continua 50/50. X trocou os dois pesos de lugar, mas como eles eram iguais, o histograma não muda. Detalhe importante: o estado MUDOU, mesmo com o histograma idêntico. Olhe a aba Bloch — a seta está em outro lugar. Histograma igual não significa estado igual, e essa distinção vai ser central mais adiante.",
            },
          ],
        },
      ],
    },
    quiz: [
      {
        id: "q1",
        prompt: "Por que dois H seguidos devolvem o qubit a |0⟩?",
        options: [
          {
            text: "Porque H é uma rotação reversível, e girar duas vezes desfaz o giro.",
            correct: true,
            explanation:
              "Isso. H² = identidade. É a demonstração mais direta de que superposição não é sorteio.",
          },
          {
            text: "Porque dois sorteios seguidos tendem a se cancelar na média.",
            correct: false,
            explanation:
              "Sorteios não se cancelam: dois lançamentos de moeda continuam dando 50/50. O resultado aqui foi 100%, o que descarta a explicação por acaso.",
            equivoco: "h-e-sorteio",
          },
          {
            text: "Porque o simulador arredonda o resultado para o estado mais provável.",
            correct: false,
            explanation:
              "Não há arredondamento. A amplitude de |1⟩ é exatamente zero: os dois caminhos que levariam a 1 se cancelam.",
            equivoco: "histograma-e-exato",
          },
        ],
      },
      {
        id: "q2",
        prompt: "No passo 4, por que as contagens mudam a cada execução?",
        options: [
          {
            text: "Porque cada execução é uma amostra finita de uma distribuição.",
            correct: true,
            explanation:
              "Exato. Com 1024 shots você estima 50%, não o mede exatamente — como pesquisa eleitoral com amostra.",
          },
          {
            text: "Porque o estado do qubit muda entre uma execução e outra.",
            correct: false,
            explanation:
              "O circuito é o mesmo e prepara sempre o mesmo estado. O que varia é o sorteio da medição.",
          },
          {
            text: "Porque o simulador tem um erro de precisão.",
            correct: false,
            explanation:
              "A probabilidade teórica é exata. A variação vem da amostragem, e é justamente o que acontece em hardware real.",
            equivoco: "histograma-e-exato",
          },
        ],
      },
    ],
  },

  {
    id: "iniciante/bits-e-qubits/desafio",
    trackId: "iniciante",
    moduleId: "bits-e-qubits",
    stage: "desafio",
    title: "Construa a indecisão",
    summary: "Agora sem roteiro: escreva o circuito você mesmo e deixe o corretor conferir.",
    minutes: 10,
    objectives: ["Escrever um circuito em Qiskit do zero", "Distinguir na prática o papel de X e de H"],
    glossaryRefs: ["superposicao", "circuito-quantico"],
    blocks: [
      {
        kind: "p",
        text:
          "Você viu H funcionar dentro de um roteiro. Agora escreva o circuito por conta própria. O corretor confere o estado que você produziu, não as portas que usou — então existe mais de um caminho certo.",
      },
    ],
    exercise: {
      id: "primeira-superposicao",
      prompt:
        "Escreva um circuito de um qubit que tenha exatamente a mesma chance de medir 0 ou 1, usando no máximo duas portas.",
      qubits: 1,
      starterCode:
        "from qiskit import QuantumCircuit\n\nqc = QuantumCircuit(1)\n# seu código aqui\n",
      solutionCode: "from qiskit import QuantumCircuit\n\nqc = QuantumCircuit(1)\nqc.h(0)\n",
      hints: [
        "O qubit começa em |0⟩, com certeza absoluta. Você precisa de uma porta que reparta essa certeza.",
        "Não é X: X apenas troca a certeza de lado, continua sendo certeza.",
        "É a Hadamard: qc.h(0).",
      ],
      assertions: [
        { kind: "qubits", exactly: 1 },
        { kind: "probabilities", expected: { "0": 0.5, "1": 0.5 } },
        { kind: "gateCount", max: 2 },
      ],
    },
    quiz: [],
  },
];
