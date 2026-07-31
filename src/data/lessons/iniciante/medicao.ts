import type { Circuit } from "@/lib/quantum/types";
import type { Lesson } from "../types";

/**
 * Módulo 3. O currículo prometia "colapso, shots, histograma" desde o começo,
 * e até pouco tempo o simulador não conseguia demonstrar nada disso: a
 * amostragem tinha semente fixa e o seletor de shots não mudava um número
 * sequer. Com shots reais, a aula finalmente pode existir.
 *
 * O eixo é o que separa medir de ler: medir é escolher uma pergunta. O mesmo
 * estado responde com certeza a uma pergunta e com sorteio a outra.
 */

let sequence = 0;
const circuit = (
  qubits: number,
  gates: [string, number[], number[]?][],
  shots = 1024,
): Circuit => ({
  qubits,
  shots,
  operations: gates.map(([gate, targets, controls], index) => ({
    id: `m${(sequence += 1)}-${index}`,
    gate: gate as Circuit["operations"][number]["gate"],
    targets,
    ...(controls ? { controls } : {}),
    position: index,
  })),
});

const superposto = circuit(1, [["H", [0]]], 256);
const superpostoMuitosShots = circuit(1, [["H", [0]]], 4096);
const zeroPuro = circuit(1, []);
const zeroComH = circuit(1, [["H", [0]]]);
const maisComH = circuit(1, [["H", [0]], ["H", [0]]]);
const emY = circuit(1, [["H", [0]], ["S", [0]]]);

export const medicao: Lesson[] = [
  {
    id: "iniciante/medicao/teoria",
    trackId: "iniciante",
    moduleId: "medicao",
    stage: "teoria",
    title: "Medir é escolher uma pergunta",
    summary:
      "Um histograma não é a verdade sobre o estado: é o resultado de uma pergunta específica, estimado a partir de uma amostra finita. Trocar a pergunta troca a resposta.",
    minutes: 11,
    objectives: [
      "Distinguir a probabilidade teórica da frequência medida",
      "Explicar por que mais repetições aproximam sem nunca acertar em cheio",
      "Reconhecer que a medição é uma escolha de base, não uma leitura",
    ],
    glossaryRefs: ["medicao", "colapso", "shots", "probabilidade", "superposicao"],
    blocks: [
      {
        kind: "p",
        text:
          "Nos dois módulos anteriores você comparou histogramas o tempo todo. Agora vamos olhar para o próprio histograma com desconfiança, porque ele engana de duas maneiras diferentes.",
      },
      {
        kind: "h",
        text: "O primeiro engano: o histograma é uma amostra",
      },
      {
        kind: "p",
        text:
          "A teoria diz que um qubit em superposição equilibrada tem cinquenta por cento de chance de cada resultado. Mas você nunca mede uma probabilidade: você repete o circuito muitas vezes e conta. Mil e vinte e quatro repetições quase nunca dão quinhentos e doze de cada lado. Dão quatrocentos e noventa e sete, ou quinhentos e vinte e três.",
      },
      {
        kind: "callout",
        variant: "atencao",
        title: "É por isso que existe a palavra shots",
        text:
          "Cada repetição do circuito é um shot. Aumentar o número de shots aproxima a frequência medida da probabilidade teórica, mas nunca a alcança exatamente — é o mesmo motivo pelo qual uma pesquisa eleitoral tem margem de erro. Em hardware real isso não é um detalhe: é o custo de cada estimativa.",
      },
      {
        kind: "p",
        text:
          "No laboratório você pode alternar entre o valor teórico e a contagem medida. Vale a pena rodar duas vezes seguidas e reparar que os números mudam — o estado preparado é sempre o mesmo, o que varia é o sorteio da medição.",
      },
      {
        kind: "h",
        text: "O segundo engano: o histograma responde a uma pergunta só",
      },
      {
        kind: "p",
        text:
          "Medir não é abrir o qubit e ler o que tem lá dentro. Medir é fazer uma pergunta específica, e a pergunta padrão é sempre a mesma: “você está em |0⟩ ou em |1⟩?”. Um estado que não é nem um nem outro responde essa pergunta no sorteio.",
      },
      {
        kind: "metaphor",
        image:
          "Medir é ler o valor guardado. O qubit tem um estado, a medição revela esse estado, e pronto — como consultar uma variável.",
        breaks:
          "Se fosse leitura, o mesmo estado daria sempre o mesmo grau de certeza. Rode o circuito ao lado: ele prepara |+⟩ e aplica uma Hadamard antes de medir. O resultado é cem por cento em |0⟩, sem nenhum sorteio. Mas medir |+⟩ diretamente dá metade e metade. O estado é o mesmo nos dois casos; o que mudou foi a pergunta. A Hadamard antes da medição troca a pergunta de “|0⟩ ou |1⟩?” para “|+⟩ ou |−⟩?”, e para essa pergunta o |+⟩ tem resposta certa.",
        circuit: maisComH,
        caption: "|+⟩ medido na pergunta certa não tem aleatoriedade nenhuma",
      },
      {
        kind: "callout",
        variant: "ideia",
        title: "Ideia-chave",
        text:
          "A aleatoriedade não é uma propriedade do qubit. Ela aparece quando o estado não se alinha com a pergunta que você fez. Escolha a pergunta certa e a resposta vira certeza.",
      },
      {
        kind: "p",
        text:
          "E o colapso? Depois de medir, o qubit passa a estar no estado que a medição indicou — a superposição anterior não sobrevive. É por isso que medir no meio de um circuito destrói a interferência que viria depois: não sobra o que interferir.",
      },
    ],
    quiz: [
      {
        id: "q1",
        prompt: "Você roda o mesmo circuito duas vezes com 1024 shots e obtém contagens diferentes. O que isso indica?",
        options: [
          {
            text: "Nada de errado: cada execução é uma amostra finita da mesma distribuição.",
            correct: true,
            explanation:
              "Exato. A probabilidade teórica não mudou; o que mudou foi o sorteio. É o mesmo fenômeno da margem de erro numa pesquisa.",
          },
          {
            text: "Que o estado preparado mudou entre uma execução e outra.",
            correct: false,
            explanation:
              "O circuito é idêntico e prepara sempre o mesmo estado. A variação está na medição, não na preparação.",
            equivoco: "histograma-e-exato",
          },
          {
            text: "Que o simulador tem um erro de precisão.",
            correct: false,
            explanation:
              "A probabilidade calculada é exata. Se você olhar o valor teórico em vez da contagem, ele é o mesmo nas duas execuções.",
            equivoco: "histograma-e-exato",
          },
        ],
      },
      {
        id: "q2",
        prompt: "Por que medir |+⟩ depois de uma Hadamard dá certeza, e medir |+⟩ direto dá sorteio?",
        options: [
          {
            text: "Porque a Hadamard troca a pergunta que a medição faz, e |+⟩ tem resposta definida para a nova pergunta.",
            correct: true,
            explanation:
              "Isso. A aleatoriedade vem do desalinhamento entre estado e pergunta, não do estado em si.",
          },
          {
            text: "Porque a Hadamard estabiliza o qubit antes da medição.",
            correct: false,
            explanation:
              "Não existe estabilização: H é uma rotação reversível. Aplicá-la a |0⟩ produziria sorteio, não certeza.",
            equivoco: "medir-e-ler",
          },
          {
            text: "Porque circuitos mais longos são mais precisos.",
            correct: false,
            explanation:
              "Comprimento não tem relação com precisão aqui. Em hardware real, aliás, circuitos mais longos acumulam mais erro.",
          },
        ],
      },
      {
        id: "q3",
        prompt: "O que acontece com a interferência se você medir no meio do circuito?",
        options: [
          {
            text: "Ela se perde: depois da medição o estado é definido, e não há mais duas contribuições para se cancelarem.",
            correct: true,
            explanation:
              "Certo. Foi isso que você viu no módulo 1: medir entre as duas Hadamards faz o resultado final voltar a ser aleatório.",
          },
          {
            text: "Nada muda, desde que ninguém olhe o resultado da medição intermediária.",
            correct: false,
            explanation:
              "Não depende de alguém olhar. O que importa é que a informação ficou registrada fisicamente em algum lugar.",
            equivoco: "medicao-precisa-de-observador",
          },
        ],
      },
    ],
  },

  {
    id: "iniciante/medicao/experimento",
    trackId: "iniciante",
    moduleId: "medicao",
    stage: "experimento",
    title: "O histograma mente duas vezes",
    summary:
      "Primeiro você vai ver a contagem escapar do valor teórico. Depois vai ver o mesmo estado responder com certeza a uma pergunta e com sorteio a outra.",
    minutes: 13,
    objectives: [
      "Observar ruído amostral com números reais",
      "Comparar o valor teórico com a frequência medida",
      "Mudar a pergunta da medição e ver a certeza aparecer",
    ],
    glossaryRefs: ["shots", "medicao", "probabilidade", "colapso"],
    blocks: [
      {
        kind: "p",
        text:
          "Neste roteiro, use a aba “shots” no painel de resultado sempre que for comparar contagens. O valor teórico é exato e nunca muda; a contagem é o que um experimento de verdade te daria.",
      },
    ],
    guided: {
      title: "O histograma mente duas vezes",
      steps: [
        {
          id: "poucos-shots",
          instruction:
            "Um qubit em superposição, medido 256 vezes. A teoria diz metade de cada. Preveja quantos por cento vão sair como 1 nesta execução específica.",
          circuit: superposto,
          predict: {
            instrument: "slider",
            question: "Que porcentagem das 256 medições vai dar 1?",
            states: ["0", "1"],
          },
          reveal:
            "Perto de cinquenta por cento, mas quase certamente não exatamente. Troque para a aba “shots” e rode de novo algumas vezes: os números dançam. A probabilidade não mudou — mudou a amostra. Com 256 repetições, um desvio de três ou quatro pontos percentuais é completamente normal.",
          branches: [
            {
              id: "mais-shots",
              label: "E se eu usar 4096 shots?",
              question:
                "O mesmo circuito, agora com 4096 repetições. A contagem vai chegar mais perto de cinquenta por cento?",
              circuit: superpostoMuitosShots,
              reveal:
                "Mais perto, sim — e essa é a regra: quadruplicar as repetições reduz o desvio típico pela metade. Mas repare que ainda não é exato, e nunca vai ser. Toda estimativa experimental tem uma margem, e em hardware real cada shot custa tempo de máquina.",
            },
          ],
        },
        {
          id: "zero-direto",
          instruction:
            "Agora um qubit sem nenhuma porta, medido direto. Ele está em |0⟩. Preveja.",
          circuit: zeroPuro,
          predict: {
            instrument: "choice",
            question: "Como fica o histograma?",
            states: ["0", "1"],
            choices: [
              { id: "zero", label: "Sempre 0", distribution: { "0": 1, "1": 0 } },
              { id: "meio", label: "Metade de cada", distribution: { "0": 0.5, "1": 0.5 } },
            ],
          },
          reveal:
            "Cem por cento em |0⟩, sem nenhuma variação entre execuções. Repare: aqui não há ruído amostral nenhum. Quando o estado se alinha perfeitamente com a pergunta, a resposta é determinística e mil repetições dão mil resultados iguais.",
        },
        {
          id: "zero-com-h",
          instruction:
            "O MESMO estado |0⟩, mas agora aplicamos uma Hadamard antes de medir. Isso troca a pergunta de “|0⟩ ou |1⟩?” para “|+⟩ ou |−⟩?”. Preveja.",
          circuit: zeroComH,
          predict: {
            instrument: "choice",
            question: "E agora?",
            states: ["0", "1"],
            choices: [
              { id: "meio", label: "Metade de cada", distribution: { "0": 0.5, "1": 0.5 } },
              { id: "zero", label: "Continua sempre 0", distribution: { "0": 1, "1": 0 }, equivoco: "medir-e-ler" },
            ],
          },
          reveal:
            "Voltou o sorteio. O estado de partida era exatamente o mesmo do passo anterior — o que mudou foi a pergunta. |0⟩ não é nem |+⟩ nem |−⟩, então não tem resposta definida para essa pergunta e responde no cara ou coroa.",
        },
        {
          id: "mais-com-h",
          instruction:
            "Fecha o argumento: prepare |+⟩ com uma Hadamard e aplique OUTRA Hadamard antes de medir. Você está fazendo a pergunta “|+⟩ ou |−⟩?” a um estado que é |+⟩. Preveja.",
          circuit: maisComH,
          predict: {
            instrument: "choice",
            question: "Certeza ou sorteio?",
            states: ["0", "1"],
            choices: [
              { id: "zero", label: "Certeza total no 0", distribution: { "0": 1, "1": 0 } },
              { id: "meio", label: "Metade de cada", distribution: { "0": 0.5, "1": 0.5 } },
              { id: "um", label: "Certeza total no 1", distribution: { "0": 0, "1": 1 } },
            ],
          },
          reveal:
            "Certeza absoluta. Junte os quatro passos e o quadro fica completo: |0⟩ é certo na pergunta padrão e aleatório na outra; |+⟩ é aleatório na padrão e certo na outra. A aleatoriedade nunca foi propriedade do qubit — ela mede o desencontro entre o estado e a pergunta que você escolheu fazer.",
          branches: [
            {
              id: "eixo-y",
              label: "Existe estado aleatório nas DUAS perguntas?",
              question:
                "Este circuito prepara um estado no eixo y da esfera. Preveja o histograma — e depois imagine o que aconteceria se aplicássemos H antes de medir.",
              circuit: emY,
              reveal:
                "Metade e metade. E se você aplicasse uma Hadamard antes de medir, continuaria metade e metade — este estado é aleatório para as duas perguntas. Olhe a esfera de Bloch: a seta aponta para y, perpendicular tanto ao eixo z quanto ao eixo x. Existe uma terceira pergunta para a qual ele responderia com certeza, e é justamente a que aponta na direção dele.",
            },
          ],
        },
      ],
    },
    quiz: [
      {
        id: "q1",
        prompt: "Por que o passo com |0⟩ puro não teve variação nenhuma entre execuções?",
        options: [
          {
            text: "Porque a probabilidade era 100%, e amostrar algo certo não tem o que variar.",
            correct: true,
            explanation:
              "Exato. Ruído amostral só aparece quando existe mais de um resultado possível.",
          },
          {
            text: "Porque circuitos sem portas não são simulados de verdade.",
            correct: false,
            explanation:
              "São simulados normalmente. A diferença é que o estado se alinha com a pergunta, e aí não há sorteio.",
          },
        ],
      },
      {
        id: "q2",
        prompt: "Quadruplicar o número de shots faz o quê com a incerteza da estimativa?",
        options: [
          {
            text: "Reduz o desvio típico pela metade.",
            correct: true,
            explanation:
              "Certo: o erro cai com a raiz do número de repetições, então quatro vezes mais shots dá metade do desvio.",
          },
          {
            text: "Reduz a incerteza a zero.",
            correct: false,
            explanation:
              "Nunca chega a zero. Por isso toda medição experimental vem com margem de erro.",
            equivoco: "histograma-e-exato",
          },
          {
            text: "Não muda nada, porque a probabilidade é sempre a mesma.",
            correct: false,
            explanation:
              "A probabilidade teórica não muda mesmo — mas a qualidade da sua ESTIMATIVA dela melhora com mais amostras.",
            equivoco: "histograma-e-exato",
          },
        ],
      },
    ],
  },

  {
    id: "iniciante/medicao/desafio",
    trackId: "iniciante",
    moduleId: "medicao",
    stage: "desafio",
    title: "O estado que nenhuma das duas perguntas resolve",
    summary:
      "Prepare um qubit que sai no sorteio tanto na medição direta quanto depois de uma Hadamard.",
    minutes: 11,
    objectives: [
      "Preparar um estado fora dos eixos z e x",
      "Entender que existe uma pergunta para cada direção da esfera",
    ],
    glossaryRefs: ["medicao", "esfera-de-bloch", "superposicao"],
    blocks: [
      {
        kind: "p",
        text:
          "Você viu que |0⟩ é certo na pergunta padrão e |+⟩ é certo na pergunta girada. Agora prepare um estado que não tenha resposta definida para nenhuma das duas — metade e metade nas duas. Existe mais de uma solução.",
      },
    ],
    exercise: {
      id: "estado-em-y",
      prompt:
        "Prepare um estado de um qubit que dê 50% e 50% na medição direta E continue 50% e 50% se uma Hadamard for aplicada antes de medir.",
      qubits: 1,
      starterCode: "from qiskit import QuantumCircuit\n\nqc = QuantumCircuit(1)\n# seu código aqui\n",
      solutionCode: "from qiskit import QuantumCircuit\n\nqc = QuantumCircuit(1)\nqc.h(0)\nqc.s(0)\n",
      hints: [
        "Na esfera de Bloch, a medição direta lê o eixo z e a medição depois de H lê o eixo x. Você precisa de um estado que não tenha componente em nenhum dos dois.",
        "Sobra um terceiro eixo. Qual porta cria uma fase que tira o estado do plano formado por z e x?",
        "Comece com H para chegar ao equador e depois use S, que gira o estado ao longo dele.",
      ],
      assertions: [
        { kind: "qubits", exactly: 1 },
        { kind: "probabilities", expected: { "0": 0.5, "1": 0.5 } },
        // x = 0 e z = 0 com norma cheia obriga a seta a apontar em ±y, que é
        // exatamente "aleatório para as duas perguntas". Aceita |+i⟩ e |−i⟩.
        { kind: "bloch", qubit: 0, expected: { x: 0, z: 0 } },
        { kind: "gateCount", max: 4 },
      ],
    },
    quiz: [
      {
        id: "q1",
        prompt: "Existe alguma pergunta para a qual esse estado responde com certeza?",
        options: [
          {
            text: "Sim: a pergunta alinhada com o eixo y, que é a direção para onde ele aponta.",
            correct: true,
            explanation:
              "Exato. Para cada direção da esfera existe uma medição correspondente, e o estado é certo naquela que aponta na sua direção.",
          },
          {
            text: "Não: esse estado é aleatório para qualquer medição possível.",
            correct: false,
            explanation:
              "Nenhum estado puro de um qubit é aleatório para todas as medições. Sempre existe a base que o resolve — isso só aconteceria com um qubit emaranhado.",
          },
        ],
      },
    ],
  },
];
