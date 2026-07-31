import type { Circuit } from "@/lib/quantum/types";
import type { Lesson } from "../types";

/**
 * Módulo 4. Os três primeiros módulos usaram portas como caixas-pretas que
 * "fazem alguma coisa". Aqui elas ganham identidade geométrica: toda porta de
 * um qubit é uma rotação da esfera de Bloch.
 *
 * A demolição é a não comutatividade. RY seguido de RX e RX seguido de RY
 * produzem histogramas idênticos e estados diferentes — o que também reforça,
 * por outro caminho, a lição do módulo 2.
 */

const PI = Math.PI;

let sequence = 0;
const circuit = (
  qubits: number,
  gates: [string, number[], number[]?, number[]?][],
): Circuit => ({
  qubits,
  shots: 1024,
  operations: gates.map(([gate, targets, controls, params], index) => ({
    id: `p${(sequence += 1)}-${index}`,
    gate: gate as Circuit["operations"][number]["gate"],
    targets,
    ...(controls ? { controls } : {}),
    ...(params ? { params } : {}),
    position: index,
  })),
});

const ryMeio = circuit(1, [["RY", [0], undefined, [PI / 2]]]);
const rxMeio = circuit(1, [["RX", [0], undefined, [PI / 2]]]);
const rxDepoisRy = circuit(1, [
  ["RX", [0], undefined, [PI / 2]],
  ["RY", [0], undefined, [PI / 2]],
]);
const ryRxComH = circuit(1, [
  ["RY", [0], undefined, [PI / 2]],
  ["RX", [0], undefined, [PI / 2]],
  ["H", [0]],
]);
const rxRyComH = circuit(1, [
  ["RX", [0], undefined, [PI / 2]],
  ["RY", [0], undefined, [PI / 2]],
  ["H", [0]],
]);
const ryCompleto = circuit(1, [["RY", [0], undefined, [PI]]]);
const umQuarto = circuit(1, [["RY", [0], undefined, [PI / 3]]]);

export const portas: Lesson[] = [
  {
    id: "iniciante/portas/teoria",
    trackId: "iniciante",
    moduleId: "portas",
    stage: "teoria",
    title: "Toda porta é uma rotação",
    summary:
      "X, Z e H não são operações abstratas: são giros da esfera de Bloch. E porque são giros, a ordem em que você aplica muda o destino.",
    minutes: 11,
    objectives: [
      "Identificar cada porta com um eixo e um ângulo de rotação",
      "Usar rotações para alcançar qualquer ponto da esfera",
      "Explicar por que a ordem das portas altera o resultado",
    ],
    glossaryRefs: ["porta-quantica", "esfera-de-bloch", "unitaria", "superposicao"],
    blocks: [
      {
        kind: "p",
        text:
          "Até agora as portas foram caixas-pretas: H espalha, X inverte, Z troca um sinal. Existe uma imagem única que explica as três de uma vez, e ela também explica todas as portas de um qubit que você ainda vai encontrar.",
      },
      {
        kind: "callout",
        variant: "ideia",
        title: "Ideia-chave",
        text:
          "Toda porta de um qubit é uma rotação da esfera de Bloch. X gira meia volta em torno do eixo x. Z gira meia volta em torno do eixo z. H é uma meia volta em torno de um eixo inclinado, no meio do caminho entre x e z — e é por isso que ela troca esses dois eixos de lugar.",
      },
      {
        kind: "p",
        text:
          "Essa imagem explica de imediato coisas que antes pareciam coincidência. Duas aplicações de H devolvem o estado porque duas meias voltas em torno do mesmo eixo somam uma volta inteira. Z não faz nada em |0⟩ porque |0⟩ está exatamente sobre o eixo z, e girar em torno de um eixo não move quem está sobre ele.",
      },
      {
        kind: "h",
        text: "Rotações de qualquer ângulo",
      },
      {
        kind: "p",
        text:
          "X, Z e H são rotações de meia volta, com ângulo fixo. As portas RX, RY e RZ generalizam isso: você escolhe o ângulo. É com elas que se alcança qualquer ponto da esfera, não só os oito ou dez pontos notáveis.",
      },
      {
        kind: "formula",
        latex: "RY(θ)|0⟩ = cos(θ/2)|0⟩ + sen(θ/2)|1⟩",
        caption: "P(1) = sen²(θ/2) — o ângulo controla a probabilidade de forma contínua",
      },
      {
        kind: "p",
        text:
          "Repare no θ dividido por dois. Uma rotação de meia volta na esfera, θ = π, leva |0⟩ até |1⟩ — que na esfera são pontos opostos, separados por meia volta. A esfera de Bloch comprime ângulos de estado pela metade, e é por isso que uma volta completa de 2π não devolve exatamente o estado de partida, mas sim ele com o sinal trocado.",
      },
      {
        kind: "h",
        text: "A ordem importa",
      },
      {
        kind: "p",
        text:
          "Aqui está a consequência menos óbvia e mais importante de pensar em rotações. Se as portas fossem números sendo multiplicados, a ordem não faria diferença. Mas rotações no espaço não funcionam assim.",
      },
      {
        kind: "metaphor",
        image:
          "Aplicar portas é como somar operações numa calculadora: o que importa é o conjunto, não a ordem. Girar um pouco para um lado e um pouco para o outro dá no mesmo, independentemente de qual veio primeiro.",
        breaks:
          "Pegue um livro. Gire um quarto de volta em torno do eixo vertical e depois um quarto em torno do horizontal. Agora recomece e faça na ordem inversa. O livro termina apontando para lugares diferentes — rotações no espaço não comutam, e isso vale igualmente para as rotações da esfera de Bloch. O circuito ao lado faz RY e depois RX, com uma Hadamard no fim para tornar a diferença visível na medição. Compare com a ordem trocada no experimento: um dá certeza absoluta, o outro dá cara ou coroa.",
        circuit: ryRxComH,
        caption: "RY, depois RX, depois H: certeza total — trocar os dois primeiros destrói isso",
      },
      {
        kind: "callout",
        variant: "atencao",
        title: "Por que isso é o que torna a computação quântica difícil",
        text:
          "Se as portas comutassem, a ordem de um circuito não importaria e projetar algoritmos seria escolher um conjunto de operações. Como não comutam, a sequência é o algoritmo. Escrever um circuito quântico é coreografar rotações.",
      },
    ],
    quiz: [
      {
        id: "q1",
        prompt: "Por que a porta Z não altera um qubit em |0⟩?",
        options: [
          {
            text: "Porque Z gira em torno do eixo z, e |0⟩ está exatamente sobre esse eixo.",
            correct: true,
            explanation:
              "Exato. Girar em torno de um eixo não move quem está sobre ele — é o mesmo motivo pelo qual o eixo de um pião fica parado.",
          },
          {
            text: "Porque Z só funciona em qubits que já passaram por uma Hadamard.",
            correct: false,
            explanation:
              "Z age sempre. O que acontece é que o efeito é invisível quando o estado está sobre o eixo de rotação, e |0⟩ está.",
          },
          {
            text: "Porque Z é a porta identidade com outro nome.",
            correct: false,
            explanation:
              "Não é: aplicada a |+⟩, Z produz |−⟩, que é um estado bem diferente.",
            equivoco: "fase-nao-tem-efeito",
          },
        ],
      },
      {
        id: "q2",
        prompt: "Que ângulo θ em RY(θ) leva |0⟩ até |1⟩ com certeza?",
        options: [
          {
            text: "θ = π, porque P(1) = sen²(θ/2) e sen²(π/2) = 1.",
            correct: true,
            explanation:
              "Certo. E repare que meia volta na esfera basta, porque |0⟩ e |1⟩ são polos opostos.",
          },
          {
            text: "θ = 2π, porque é preciso dar a volta completa.",
            correct: false,
            explanation:
              "Com 2π o estado volta ao ponto de partida na esfera — sen²(π) = 0, ou seja, de volta a |0⟩.",
          },
          {
            text: "θ = π/2, porque é o meio do caminho.",
            correct: false,
            explanation:
              "π/2 dá sen²(π/4) = 0,5, que é a superposição equilibrada — meio do caminho mesmo, mas não o destino.",
          },
        ],
      },
      {
        id: "q3",
        prompt: "O que significa dizer que as portas não comutam?",
        options: [
          {
            text: "Que aplicar A depois de B geralmente produz um estado diferente de aplicar B depois de A.",
            correct: true,
            explanation:
              "Isso. É a mesma coisa que acontece ao girar um objeto em torno de dois eixos diferentes.",
          },
          {
            text: "Que algumas portas não podem ser usadas no mesmo circuito.",
            correct: false,
            explanation:
              "Todas podem ser combinadas. O que muda é que a ordem faz parte do resultado.",
            equivoco: "ordem-nao-importa",
          },
          {
            text: "Que a ordem só importa quando há mais de um qubit.",
            correct: false,
            explanation:
              "Este módulo inteiro trata de um único qubit, e a ordem já importa.",
            equivoco: "ordem-nao-importa",
          },
        ],
      },
    ],
  },

  {
    id: "iniciante/portas/experimento",
    trackId: "iniciante",
    moduleId: "portas",
    stage: "experimento",
    title: "Girar não é somar",
    summary:
      "Você vai levar o qubit a pontos específicos da esfera com rotações, e depois descobrir que trocar a ordem de duas delas leva a lugares diferentes.",
    minutes: 13,
    objectives: [
      "Prever onde uma rotação leva o estado",
      "Ver duas ordens produzirem o mesmo histograma e estados diferentes",
      "Usar o ângulo para controlar a probabilidade continuamente",
    ],
    glossaryRefs: ["porta-quantica", "esfera-de-bloch", "probabilidade"],
    blocks: [
      {
        kind: "p",
        text:
          "Use a aba Bloch neste roteiro mais do que o histograma. É lá que a geometria das portas fica visível — e há um passo em que o histograma esconde tudo que importa.",
      },
    ],
    guided: {
      title: "Girar não é somar",
      steps: [
        {
          id: "ry",
          instruction:
            "RY de um quarto de volta, ou seja, θ = π/2, aplicado a |0⟩. Preveja a probabilidade de medir 1.",
          circuit: ryMeio,
          predict: {
            instrument: "slider",
            question: "Que porcentagem vai dar 1?",
            states: ["0", "1"],
          },
          reveal:
            "Cinquenta por cento: RY(π/2) leva |0⟩ até o equador. Olhe a aba Bloch — a seta aponta para +x, exatamente onde |+⟩ mora. Ou seja, RY(π/2) faz o mesmo que a Hadamard neste caso, mas por um caminho geométrico diferente.",
        },
        {
          id: "rx",
          instruction:
            "Agora RX com o mesmo ângulo π/2, também sobre |0⟩. Preveja o histograma — e, antes de rodar, arrisque onde a seta vai parar na esfera.",
          circuit: rxMeio,
          predict: {
            instrument: "choice",
            question: "Como fica o histograma?",
            states: ["0", "1"],
            choices: [
              { id: "meio", label: "Metade de cada", distribution: { "0": 0.5, "1": 0.5 } },
              { id: "zero", label: "Sempre 0", distribution: { "0": 1, "1": 0 } },
              { id: "um", label: "Sempre 1", distribution: { "0": 0, "1": 1 } },
            ],
          },
          reveal:
            "Mesmo histograma do passo anterior: metade e metade. Mas abra a aba Bloch e compare. Antes a seta apontava para +x; agora aponta para −y. Dois estados diferentes, o mesmo histograma — exatamente o que o módulo 2 mostrou, agora com rotações no lugar de H e Z.",
        },
        {
          id: "ordem-a",
          instruction:
            "Agora combine as duas: primeiro RY(π/2), depois RX(π/2). Adicionei uma Hadamard no fim para tornar a diferença visível na medição. Preveja.",
          circuit: ryRxComH,
          predict: {
            instrument: "choice",
            question: "Certeza ou sorteio?",
            states: ["0", "1"],
            choices: [
              { id: "zero", label: "Certeza no 0", distribution: { "0": 1, "1": 0 } },
              { id: "meio", label: "Metade de cada", distribution: { "0": 0.5, "1": 0.5 } },
              { id: "um", label: "Certeza no 1", distribution: { "0": 0, "1": 1 } },
            ],
          },
          reveal:
            "Certeza absoluta no 0. Faz sentido: RY(π/2) leva a seta para +x, e girar em torno do eixo x não move quem está sobre esse eixo — então o RX seguinte não faz nada. Sobra |+⟩, e a Hadamard final o leva a |0⟩.",
        },
        {
          id: "ordem-b",
          instruction:
            "Exatamente as mesmas três portas, só que RX vem antes de RY. Nada foi acrescentado nem removido. Preveja.",
          circuit: rxRyComH,
          predict: {
            instrument: "choice",
            question: "E com a ordem trocada?",
            states: ["0", "1"],
            choices: [
              { id: "zero", label: "Igual ao anterior: certeza no 0", distribution: { "0": 1, "1": 0 }, equivoco: "ordem-nao-importa" },
              { id: "meio", label: "Metade de cada", distribution: { "0": 0.5, "1": 0.5 } },
              { id: "um", label: "Certeza no 1", distribution: { "0": 0, "1": 1 } },
            ],
          },
          reveal:
            "Metade e metade — a certeza desapareceu. As mesmas portas, o mesmo qubit, e um resultado completamente diferente só porque a ordem mudou. Agora RX(π/2) leva a seta para −y, e girar em torno de y não move quem está sobre y: sobra |−i⟩, que a Hadamard não resolve. Rotações não comutam, e essa é a razão de a sequência ser o algoritmo.",
          branches: [
            {
              id: "sem-h",
              label: "E sem a Hadamard final?",
              question:
                "As mesmas duas rotações, RX depois RY, mas sem a Hadamard. Preveja o histograma.",
              circuit: rxDepoisRy,
              reveal:
                "Metade e metade — e o outro caminho, RY depois RX, também dá metade e metade. Sem a Hadamard final, o histograma esconde por completo a diferença entre os dois circuitos. Ela só existe na esfera: +x contra −y. Foi por isso que acrescentei a porta: para trazer à medição uma diferença que já estava lá.",
            },
            {
              id: "volta-inteira",
              label: "E se RY der meia volta inteira?",
              question: "RY com θ = π sobre |0⟩. Preveja.",
              circuit: ryCompleto,
              reveal:
                "Cem por cento em |1⟩. Meia volta na esfera vai de um polo ao outro, e P(1) = sen²(π/2) = 1. Repare que é o mesmo efeito da porta X — RY(π) e X levam |0⟩ ao mesmo lugar, por eixos diferentes.",
            },
          ],
        },
        {
          id: "angulo-livre",
          instruction:
            "Último passo, e o mais útil na prática: um ângulo que não é notável. Este circuito usa RY(π/3). Preveja a probabilidade de medir 1 — a fórmula é sen² de θ/2.",
          circuit: umQuarto,
          predict: {
            instrument: "slider",
            question: "Que porcentagem vai dar 1?",
            states: ["0", "1"],
          },
          reveal:
            "Vinte e cinco por cento. sen²(π/6) = 0,25. É isso que as rotações dão de novo em relação a X, Z e H: controle contínuo. Com o ângulo certo você marca qualquer probabilidade, e não apenas 0%, 50% ou 100%. Experimente arrastar o controle de ângulo no laboratório e ver a barra do histograma varrer todos os valores.",
        },
      ],
    },
    quiz: [
      {
        id: "q1",
        prompt: "Por que o RX não fez efeito no passo em que veio depois do RY?",
        options: [
          {
            text: "Porque o RY já tinha levado a seta para o eixo x, e girar em torno de x não move quem está sobre x.",
            correct: true,
            explanation:
              "Exato. É a mesma razão pela qual Z não altera |0⟩ — o estado estava sobre o eixo de rotação.",
          },
          {
            text: "Porque RX e RY se cancelam quando têm o mesmo ângulo.",
            correct: false,
            explanation:
              "Não se cancelam: na ordem inversa as duas juntas produziram um estado bem diferente.",
            equivoco: "ordem-nao-importa",
          },
        ],
      },
      {
        id: "q2",
        prompt: "Sem a Hadamard final, os dois circuitos davam o mesmo histograma. O que isso ilustra?",
        options: [
          {
            text: "Que o histograma não identifica o estado — a diferença estava na esfera o tempo todo.",
            correct: true,
            explanation:
              "Certo, e é a mesma lição do módulo 2, chegando por outro caminho. A Hadamard final só trouxe para a medição uma diferença que já existia.",
          },
          {
            text: "Que os dois circuitos são de fato equivalentes.",
            correct: false,
            explanation:
              "Não são: com a Hadamard no fim, um dá certeza e o outro dá sorteio.",
            equivoco: "probabilidade-e-o-estado",
          },
        ],
      },
    ],
  },

  {
    id: "iniciante/portas/desafio",
    trackId: "iniciante",
    moduleId: "portas",
    stage: "desafio",
    title: "Marque a probabilidade exata",
    summary:
      "Nada de 0%, 50% ou 100%. Use uma rotação para acertar 25% em cheio.",
    minutes: 10,
    objectives: ["Converter uma probabilidade desejada em ângulo de rotação"],
    glossaryRefs: ["porta-quantica", "probabilidade", "amplitude"],
    blocks: [
      {
        kind: "p",
        text:
          "X, Z e H só alcançam alguns pontos notáveis. Este desafio pede um ponto que nenhuma delas atinge — e é exatamente para isso que as rotações existem.",
      },
    ],
    exercise: {
      id: "probabilidade-25",
      prompt:
        "Prepare um qubit com exatamente 25% de chance de medir 1 e 75% de medir 0, usando uma única rotação.",
      qubits: 1,
      starterCode:
        "from qiskit import QuantumCircuit\nfrom math import pi\n\nqc = QuantumCircuit(1)\n# seu código aqui\n",
      solutionCode:
        "from qiskit import QuantumCircuit\nfrom math import pi\n\nqc = QuantumCircuit(1)\nqc.ry(pi / 3, 0)\n",
      hints: [
        "A relação é P(1) = sen²(θ/2). Comece descobrindo qual seno elevado ao quadrado dá 0,25.",
        "sen(θ/2) precisa valer 0,5. Qual é o ângulo cujo seno vale meio?",
        "θ/2 = π/6, então θ = π/3. No código: qc.ry(pi / 3, 0).",
      ],
      assertions: [
        { kind: "qubits", exactly: 1 },
        { kind: "probabilities", expected: { "0": 0.75, "1": 0.25 }, tol: 1e-3 },
        { kind: "gateCount", max: 2 },
      ],
    },
    quiz: [
      {
        id: "q1",
        prompt: "Para chegar a 75% de chance de medir 1, qual ângulo você usaria?",
        options: [
          {
            text: "2π/3, porque sen²(π/3) = 0,75.",
            correct: true,
            explanation:
              "Certo. É o complemento do ângulo do desafio, e leva a seta para o outro lado do equador.",
          },
          {
            text: "O mesmo π/3, só trocando RY por RX.",
            correct: false,
            explanation:
              "RX(π/3) também dá 25%: os dois giram o mesmo ângulo, só que em torno de eixos diferentes. O que muda a probabilidade é o ângulo, não o eixo.",
          },
          {
            text: "3π/4, porque três quartos de π correspondem a 75%.",
            correct: false,
            explanation:
              "A relação não é proporcional: passa por sen². sen²(3π/8) dá cerca de 0,85, não 0,75.",
          },
        ],
      },
    ],
  },
];
