import type { Circuit } from "@/lib/quantum/types";
import type { Lesson } from "../types";

/**
 * Módulo 2. O módulo 1 mostrou que H é rotação reversível, não sorteio.
 * Aqui o alvo é a distinção seguinte, e mais difícil: probabilidade não
 * determina o estado. |+⟩ e |−⟩ produzem histogramas idênticos e são estados
 * diferentes — o que só aparece quando você aplica outra porta.
 */

let sequence = 0;
const circuit = (qubits: number, gates: [string, number[], number[]?][]): Circuit => ({
  qubits,
  shots: 1024,
  operations: gates.map(([gate, targets, controls], index) => ({
    id: `s${(sequence += 1)}-${index}`,
    gate: gate as Circuit["operations"][number]["gate"],
    targets,
    ...(controls ? { controls } : {}),
    position: index,
  })),
});

const mais = circuit(1, [["H", [0]]]);
const menos = circuit(1, [["X", [0]], ["H", [0]]]);
const maisDepoisH = circuit(1, [["H", [0]], ["H", [0]]]);
const menosComH = circuit(1, [["X", [0]], ["H", [0]], ["H", [0]]]);
const comZ = circuit(1, [["H", [0]], ["Z", [0]]]);
const zSozinho = circuit(1, [["Z", [0]]]);

export const superposicao: Lesson[] = [
  {
    id: "iniciante/superposicao/teoria",
    trackId: "iniciante",
    moduleId: "superposicao",
    stage: "teoria",
    title: "Probabilidade não é o estado",
    summary:
      "Dois qubits podem dar exatamente o mesmo histograma e ainda assim serem estados diferentes. O que os separa é o sinal — e o sinal só aparece quando você faz a pergunta certa.",
    minutes: 10,
    objectives: [
      "Distinguir amplitude de probabilidade",
      "Explicar por que uma amplitude pode ser negativa",
      "Reconhecer que o histograma não identifica o estado",
    ],
    glossaryRefs: ["amplitude", "probabilidade", "superposicao", "fase", "interferencia"],
    blocks: [
      {
        kind: "p",
        text:
          "No módulo anterior você viu que a porta Hadamard não sorteia nada: aplicada duas vezes, ela devolve o qubit exatamente para onde ele estava. Agora a pergunta muda. Se o histograma diz cinquenta por cento para cada lado, isso descreve o qubit por inteiro?",
      },
      {
        kind: "p",
        text:
          "A resposta é não, e essa é provavelmente a ideia mais importante de toda a computação quântica. O que um circuito manipula não são probabilidades: são amplitudes. A probabilidade é o que sobra depois, quando você eleva a amplitude ao quadrado.",
      },
      {
        kind: "formula",
        latex: "|ψ⟩ = α|0⟩ + β|1⟩",
        caption: "P(0) = |α|² e P(1) = |β|² — o quadrado apaga o sinal",
      },
      {
        kind: "callout",
        variant: "atencao",
        title: "Onde a informação se perde",
        text:
          "Elevar ao quadrado descarta o sinal: (+0,707)² e (−0,707)² dão o mesmo 0,5. Ou seja, o histograma joga fora exatamente a informação que distingue um estado do outro. E essa informação não é decorativa — ela decide o que acontece na próxima porta.",
      },
      {
        kind: "h",
        text: "Dois estados, um histograma",
      },
      {
        kind: "p",
        text:
          "Existem dois estados com nomes próprios que ilustram isso melhor que qualquer explicação. O primeiro se escreve |+⟩ e tem as duas amplitudes positivas. O segundo se escreve |−⟩ e tem a segunda amplitude negativa.",
      },
      {
        kind: "figure",
        view: "bloch",
        circuit: mais,
        caption:
          "O estado |+⟩ aponta para +x na esfera de Bloch. O |−⟩ aponta exatamente para o lado oposto — e nenhum dos dois tem componente em z, que é o eixo que a medição enxerga.",
      },
      {
        kind: "metaphor",
        image:
          "Superposição é meio a meio. Um qubit em superposição é aquele que tem cinquenta por cento de chance de dar cada resultado — é isso que a palavra quer dizer.",
        ilustracao: {
          src: "/images/metafora-meio-a-meio.png",
          webp: "/images/metafora-meio-a-meio.webp",
          alt: "Duas jarras idênticas, cheias até a metade, têm a superfície do líquido inclinada em sentidos opostos.",
        },
        breaks:
          "Mas |+⟩ e |−⟩ são os dois meio a meio, e não são o mesmo estado. Rode o circuito ao lado: ele prepara |−⟩ e depois aplica outra Hadamard. Se |−⟩ fosse simplesmente 'meio a meio', o resultado teria que ser o mesmo que sai de |+⟩ com a mesma porta — que é cem por cento no zero. Dá cem por cento no um. Portanto 'meio a meio' não é uma descrição do estado: é só uma descrição de uma medição específica dele.",
        circuit: menosComH,
        caption: "|−⟩ seguido de H termina em |1⟩, enquanto |+⟩ seguido de H termina em |0⟩",
      },
      {
        kind: "p",
        text:
          "Repare no que aconteceu. Antes da última porta, os dois estados eram indistinguíveis para a medição. Depois dela, os dois se tornaram certezas opostas. A diferença estava lá o tempo todo, guardada no sinal, invisível para aquele tipo de pergunta.",
      },
      {
        kind: "callout",
        variant: "ideia",
        title: "Ideia-chave",
        text:
          "Medir é fazer uma pergunta específica, não abrir o estado e ler o que tem dentro. Duas coisas diferentes podem dar a mesma resposta para uma pergunta e respostas opostas para outra.",
      },
      {
        kind: "p",
        text:
          "É por isso que um algoritmo quântico não se resume a preparar uma superposição. Preparar é fácil: uma Hadamard resolve. O trabalho todo está em arranjar os sinais para que, na hora de medir, as amplitudes das respostas erradas se cancelem e as da resposta certa se somem.",
      },
    ],
    quiz: [
      {
        id: "q1",
        prompt: "Qual é a diferença entre amplitude e probabilidade?",
        options: [
          {
            text: "A amplitude pode ser negativa; a probabilidade é o quadrado dela e nunca é.",
            correct: true,
            explanation:
              "Isso. E como o quadrado apaga o sinal, a probabilidade guarda menos informação que a amplitude.",
          },
          {
            text: "São dois nomes para a mesma coisa, um usado por físicos e outro por engenheiros.",
            correct: false,
            explanation:
              "Se fossem a mesma coisa, |+⟩ e |−⟩ seriam o mesmo estado — e uma Hadamard os leva a resultados opostos.",
            equivoco: "amplitude-e-probabilidade",
          },
          {
            text: "A amplitude vale de 0 a 100 e a probabilidade vale de 0 a 1.",
            correct: false,
            explanation:
              "Não é questão de escala. A diferença é que a amplitude carrega sinal e a probabilidade não.",
            equivoco: "amplitude-e-probabilidade",
          },
        ],
      },
      {
        id: "q2",
        prompt: "Dois qubits produzem exatamente o mesmo histograma. O que se pode concluir?",
        options: [
          {
            text: "Nada além disso: eles podem estar em estados diferentes que só se separam com outra porta.",
            correct: true,
            explanation:
              "Exato. |+⟩ e |−⟩ são o exemplo clássico: mesmo histograma, e uma Hadamard os manda para lados opostos.",
          },
          {
            text: "Que estão no mesmo estado, já que produzem os mesmos resultados.",
            correct: false,
            explanation:
              "Essa é a conclusão que a aula desmonta. O histograma é o resultado de UMA pergunta, não a identidade do estado.",
            equivoco: "probabilidade-e-o-estado",
          },
          {
            text: "Que ambos estão emaranhados.",
            correct: false,
            explanation:
              "Emaranhamento envolve pelo menos dois qubits e é outro assunto. Um único qubit pode estar em |+⟩ ou |−⟩ sem nenhum emaranhamento.",
          },
        ],
      },
      {
        id: "q3",
        prompt: "Por que a porta Z não muda nada no histograma de um qubit em |0⟩?",
        options: [
          {
            text: "Porque Z só inverte o sinal da amplitude de |1⟩, que em |0⟩ é zero.",
            correct: true,
            explanation:
              "Certo. Trocar o sinal de zero não muda nada. Z só faz diferença quando existe amplitude nos dois lados.",
          },
          {
            text: "Porque Z não faz nada em nenhuma situação.",
            correct: false,
            explanation:
              "Faz muita diferença sobre |+⟩: Z leva |+⟩ para |−⟩, e aí a Hadamard seguinte dá o resultado oposto.",
            equivoco: "fase-nao-tem-efeito",
          },
          {
            text: "Porque Z age só sobre qubits emaranhados.",
            correct: false,
            explanation:
              "Z é uma porta de um qubit e não tem nada a ver com emaranhamento.",
          },
        ],
      },
    ],
  },

  {
    id: "iniciante/superposicao/experimento",
    trackId: "iniciante",
    moduleId: "superposicao",
    stage: "experimento",
    title: "Dois estados que a medição confunde",
    summary:
      "Você vai preparar dois estados diferentes, ver os dois darem o mesmo histograma, e depois vê-los se separarem completamente com uma única porta.",
    minutes: 12,
    objectives: [
      "Preparar |+⟩ e |−⟩ e comparar os histogramas",
      "Prever o efeito de uma Hadamard sobre cada um",
      "Ler a esfera de Bloch para ver a diferença que a medição esconde",
    ],
    glossaryRefs: ["superposicao", "esfera-de-bloch", "fase", "porta-quantica"],
    blocks: [
      {
        kind: "p",
        text:
          "A regra continua a mesma: antes de cada execução você aposta. Neste roteiro há um passo em que quase todo mundo erra — e é o passo que faz a aula valer.",
      },
    ],
    guided: {
      title: "Dois estados que a medição confunde",
      steps: [
        {
          id: "mais",
          instruction:
            "Uma Hadamard sobre |0⟩ prepara o estado |+⟩. Você já viu isso no módulo anterior. Preveja o histograma.",
          circuit: mais,
          predict: {
            instrument: "choice",
            question: "Como fica a distribuição?",
            states: ["0", "1"],
            choices: [
              { id: "meio", label: "Metade de cada", distribution: { "0": 0.5, "1": 0.5 } },
              { id: "zero", label: "Sempre 0", distribution: { "0": 1, "1": 0 } },
              { id: "um", label: "Sempre 1", distribution: { "0": 0, "1": 1 } },
            ],
          },
          reveal:
            "Cinquenta por cento para cada lado, como esperado. Guarde este histograma na memória: o próximo passo vai produzir um idêntico a partir de um estado diferente. Antes de seguir, dê uma olhada na aba Bloch — a seta aponta para +x.",
        },
        {
          id: "menos",
          instruction:
            "Agora um circuito diferente: primeiro X, depois H. Isso prepara o estado |−⟩. Preveja o histograma dele.",
          circuit: menos,
          predict: {
            instrument: "choice",
            question: "E agora, como fica?",
            states: ["0", "1"],
            choices: [
              { id: "meio", label: "Metade de cada", distribution: { "0": 0.5, "1": 0.5 } },
              { id: "um", label: "Sempre 1", distribution: { "0": 0, "1": 1 } },
              { id: "zero", label: "Sempre 0", distribution: { "0": 1, "1": 0 } },
            ],
          },
          reveal:
            "Idêntico ao anterior: metade e metade. Dois circuitos diferentes, o mesmo histograma. Mas abra a aba Bloch e compare com o passo anterior: a seta agora aponta para −x, exatamente o lado oposto. A diferença existe, a medição é que não a enxerga.",
        },
        {
          id: "mais-com-h",
          instruction:
            "Voltemos ao |+⟩ e apliquemos outra Hadamard. Você já viu este resultado no módulo 1, então deve acertar.",
          circuit: maisDepoisH,
          predict: {
            instrument: "choice",
            question: "Duas Hadamards sobre |0⟩:",
            states: ["0", "1"],
            choices: [
              { id: "zero", label: "Sempre 0", distribution: { "0": 1, "1": 0 } },
              { id: "meio", label: "Metade de cada", distribution: { "0": 0.5, "1": 0.5 } },
              { id: "um", label: "Sempre 1", distribution: { "0": 0, "1": 1 } },
            ],
          },
          reveal:
            "Cem por cento em |0⟩. A Hadamard desfez a si mesma, como no módulo anterior. Até aqui, nenhuma surpresa.",
        },
        {
          id: "menos-com-h",
          instruction:
            "Agora o passo decisivo. Prepare |−⟩ de novo — X seguido de H — e aplique mais uma Hadamard. Lembre que |−⟩ tinha o mesmo histograma de |+⟩. Preveja com calma.",
          circuit: menosComH,
          predict: {
            instrument: "choice",
            question: "Onde isso vai parar?",
            states: ["0", "1"],
            choices: [
              { id: "meio", label: "Metade de cada", distribution: { "0": 0.5, "1": 0.5 } },
              { id: "zero", label: "Sempre 0, igual ao passo anterior", distribution: { "0": 1, "1": 0 }, equivoco: "probabilidade-e-o-estado" },
              { id: "um", label: "Sempre 1", distribution: { "0": 0, "1": 1 } },
            ],
          },
          reveal:
            "Cem por cento em |1⟩ — o oposto exato do passo anterior. Dois estados que a medição não conseguia distinguir viraram certezas contrárias, e bastou uma porta para revelar. A informação que os separava nunca esteve no histograma: estava no sinal da amplitude, que o quadrado apaga. É isso que significa dizer que a probabilidade não determina o estado.",
          branches: [
            {
              id: "z-sozinho",
              label: "E se eu aplicar só Z em |0⟩?",
              question: "Só uma porta Z sobre |0⟩, mais nada. Preveja o histograma.",
              circuit: zSozinho,
              reveal:
                "Cem por cento em |0⟩: nada mudou. Z inverte o sinal da amplitude de |1⟩, e em |0⟩ essa amplitude é zero. Inverter o sinal do nada não faz nada. Z só tem efeito quando já existe amplitude dos dois lados.",
            },
            {
              id: "h-depois-z",
              label: "E se eu fizer H e depois Z?",
              question: "H seguido de Z. Preveja o histograma — e depois olhe a esfera de Bloch.",
              circuit: comZ,
              reveal:
                "O histograma continua metade e metade, mas na esfera de Bloch a seta virou para −x: você acabou de preparar |−⟩ por outro caminho. Compare com o passo 2, que usou X e depois H — circuitos diferentes, mesmo estado final. É a prova de que existe mais de um caminho para o mesmo lugar.",
            },
          ],
        },
      ],
    },
    quiz: [
      {
        id: "q1",
        prompt: "No passo final, por que o resultado foi o oposto do passo anterior?",
        options: [
          {
            text: "Porque |−⟩ tem a amplitude de |1⟩ negativa, e a Hadamard faz os sinais se cancelarem do outro lado.",
            correct: true,
            explanation:
              "Exato. É o mesmo mecanismo de interferência, mas com os sinais trocados, então o cancelamento acontece em |0⟩ em vez de |1⟩.",
          },
          {
            text: "Porque a porta X no começo do circuito aleatorizou o resultado.",
            correct: false,
            explanation:
              "X não aleatoriza nada: leva |0⟩ a |1⟩ com certeza absoluta. E o resultado final também foi uma certeza, não um sorteio.",
          },
          {
            text: "Porque circuitos mais longos acumulam erro do simulador.",
            correct: false,
            explanation:
              "Não há erro nenhum aqui: o resultado é exatamente 100%, e é o que a matemática prevê.",
            equivoco: "histograma-e-exato",
          },
        ],
      },
      {
        id: "q2",
        prompt: "O que a esfera de Bloch mostrou que o histograma escondia?",
        options: [
          {
            text: "Que |+⟩ e |−⟩ apontam para lados opostos, embora ambos fiquem no equador.",
            correct: true,
            explanation:
              "Certo. A medição em |0⟩/|1⟩ lê o eixo z, e os dois estados têm z igual a zero — por isso ela não os separa.",
          },
          {
            text: "Que um dos estados estava emaranhado.",
            correct: false,
            explanation:
              "Com um único qubit não existe emaranhamento. Os dois vetores tinham comprimento 1, que é a marca de estado puro e separável.",
          },
          {
            text: "Que o segundo estado tinha menos energia.",
            correct: false,
            explanation:
              "A esfera de Bloch não representa energia, e sim a direção do estado. Os dois têm o mesmo comprimento.",
          },
        ],
      },
    ],
  },

  {
    id: "iniciante/superposicao/desafio",
    trackId: "iniciante",
    moduleId: "superposicao",
    stage: "desafio",
    title: "Prepare o estado que a medição não vê",
    summary:
      "Construa |−⟩ por conta própria. O corretor confere o histograma e também a direção na esfera — porque só o histograma não bastaria.",
    minutes: 10,
    objectives: ["Preparar |−⟩ sem roteiro", "Entender por que a verificação precisa olhar além do histograma"],
    glossaryRefs: ["superposicao", "esfera-de-bloch"],
    blocks: [
      {
        kind: "p",
        text:
          "Prepare o estado |−⟩ num qubit. Repare no enunciado da correção: exigir apenas metade e metade seria insuficiente, porque |+⟩ também passaria. Por isso o corretor também confere para que lado a seta aponta.",
      },
    ],
    exercise: {
      id: "estado-menos",
      prompt:
        "Prepare o estado |−⟩ = (|0⟩ − |1⟩)/√2 em um qubit. Metade e metade não basta: a seta precisa apontar para −x.",
      qubits: 1,
      starterCode: "from qiskit import QuantumCircuit\n\nqc = QuantumCircuit(1)\n# seu código aqui\n",
      solutionCode: "from qiskit import QuantumCircuit\n\nqc = QuantumCircuit(1)\nqc.x(0)\nqc.h(0)\n",
      hints: [
        "H sobre |0⟩ dá |+⟩, que aponta para +x. Você precisa do lado oposto.",
        "Duas rotas levam lá: mudar o ponto de partida antes da Hadamard, ou inverter o sinal depois dela.",
        "X e depois H. Ou então H e depois Z — as duas funcionam.",
      ],
      assertions: [
        { kind: "qubits", exactly: 1 },
        { kind: "probabilities", expected: { "0": 0.5, "1": 0.5 } },
        { kind: "bloch", qubit: 0, expected: { x: -1, z: 0 } },
        { kind: "gateCount", max: 3 },
      ],
    },
    quiz: [
      {
        id: "q1",
        prompt: "Por que o corretor não podia se contentar com o histograma?",
        options: [
          {
            text: "Porque |+⟩ produz o mesmo histograma e não é o estado pedido.",
            correct: true,
            explanation:
              "Exato. Verificar só a probabilidade aprovaria uma solução errada — que é justamente o assunto do módulo.",
          },
          {
            text: "Porque o histograma varia entre execuções e não é confiável.",
            correct: false,
            explanation:
              "A variação amostral existe, mas o corretor usa as probabilidades exatas. O problema aqui é outro: o histograma não distingue os dois estados nem em teoria.",
          },
        ],
      },
    ],
  },
];
