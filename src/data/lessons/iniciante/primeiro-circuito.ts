import type { Circuit } from "@/lib/quantum/types";
import type { Lesson } from "../types";

/**
 * Módulo 6, fecho da trilha iniciante. Os cinco anteriores construíram as
 * peças; aqui elas viram um algoritmo de verdade — o de Deutsch, que responde
 * em uma consulta o que a computação clássica só responde em duas.
 *
 * A demolição é a mais importante do curso inteiro: o algoritmo NÃO lê as duas
 * respostas. Ele troca conhecimento específico por conhecimento global, e o que
 * ele ganha em consultas, paga em informação descartada. Sem isso, a aula
 * reforçaria justamente o mito que os módulos anteriores desmontaram.
 *
 * Os quatro oráculos foram verificados contra o simulador antes desta aula ser
 * escrita.
 */

let sequence = 0;
const circuit = (qubits: number, gates: [string, number[], number[]?][]): Circuit => ({
  qubits,
  shots: 1024,
  operations: gates.map(([gate, targets, controls], index) => ({
    id: `a${(sequence += 1)}-${index}`,
    gate: gate as Circuit["operations"][number]["gate"],
    targets,
    ...(controls ? { controls } : {}),
    position: index,
  })),
});

/** Preparo comum: auxiliar em |1⟩ e Hadamard nos dois. */
const PREPARO: [string, number[], number[]?][] = [["X", [1]], ["H", [0]], ["H", [1]]];

const constanteZero = circuit(2, [...PREPARO, ["H", [0]]]);
const constanteUm = circuit(2, [...PREPARO, ["X", [1]], ["H", [0]]]);
const balanceadaIdentidade = circuit(2, [...PREPARO, ["CNOT", [1], [0]], ["H", [0]]]);
const balanceadaNegada = circuit(2, [...PREPARO, ["CNOT", [1], [0]], ["X", [1]], ["H", [0]]]);
const semInterferencia = circuit(2, [...PREPARO, ["CNOT", [1], [0]]]);

export const primeiroCircuito: Lesson[] = [
  {
    id: "iniciante/primeiro-circuito/teoria",
    trackId: "iniciante",
    moduleId: "primeiro-circuito",
    stage: "teoria",
    title: "Uma pergunta no lugar de duas",
    summary:
      "O primeiro algoritmo quântico da história responde em uma consulta o que exige duas classicamente. E ele consegue isso não por ler tudo de uma vez, mas por perguntar outra coisa.",
    minutes: 12,
    objectives: [
      "Reconhecer interferência como o mecanismo de um algoritmo quântico",
      "Explicar o algoritmo de Deutsch e o que ele descobre",
      "Identificar o que o algoritmo deixa de saber em troca da vantagem",
    ],
    glossaryRefs: ["interferencia", "circuito-quantico", "fase", "amplitude", "medicao"],
    blocks: [
      {
        kind: "p",
        text:
          "Você já tem todas as peças. Superposição prepara possibilidades, portas as movem, a fase decide como elas se combinam, e a medição faz uma pergunta. Falta ver as quatro trabalhando juntas com um objetivo.",
      },
      {
        kind: "h",
        text: "O problema",
      },
      {
        kind: "p",
        text:
          "Imagine uma função que recebe um bit e devolve um bit. Existem só quatro possíveis: duas que devolvem sempre o mesmo valor, chamadas constantes, e duas que devolvem valores diferentes para cada entrada, chamadas balanceadas.",
      },
      {
        kind: "list",
        items: [
          "Constantes: f(0)=0 e f(1)=0, ou então f(0)=1 e f(1)=1",
          "Balanceadas: f(0)=0 e f(1)=1, ou então f(0)=1 e f(1)=0",
        ],
      },
      {
        kind: "p",
        text:
          "A pergunta é: essa função é constante ou balanceada? Num computador clássico não há saída — é preciso consultar a função duas vezes, uma para cada entrada, e comparar. Uma consulta só nunca basta, porque saber f(0) não diz nada sobre f(1).",
      },
      {
        kind: "callout",
        variant: "ideia",
        title: "O que Deutsch percebeu",
        text:
          "A pergunta “constante ou balanceada?” é sobre f(0) e f(1) juntos, não sobre cada um. E um circuito quântico consegue montar uma consulta cuja resposta é justamente essa combinação — com uma única chamada da função.",
      },
      {
        kind: "h",
        text: "Como o circuito faz isso",
      },
      {
        kind: "p",
        text:
          "O truque usa exatamente o que você aprendeu sobre fase. O qubit auxiliar é preparado em |−⟩, o estado com sinal negativo do módulo 2. Quando a função é aplicada, ela não muda as probabilidades de nada: ela deposita um sinal na amplitude do qubit de consulta. Se f(0) e f(1) forem iguais, os dois caminhos recebem o mesmo sinal; se forem diferentes, recebem sinais opostos.",
      },
      {
        kind: "p",
        text:
          "A última Hadamard converte essa diferença de sinal em resultado de medição, exatamente como no módulo 2, quando |+⟩ e |−⟩ viraram |0⟩ e |1⟩. Medir 0 significa constante; medir 1 significa balanceada. Sem sorteio.",
      },
      {
        kind: "metaphor",
        image:
          "O computador quântico é rápido porque testa as duas entradas ao mesmo tempo e depois lê as duas respostas de uma vez. Onde o clássico faz duas consultas em série, o quântico faz as duas em paralelo.",
        breaks:
          "Se o circuito lesse as duas respostas, ao final você saberia f(0) e f(1) separadamente. Rode o circuito ao lado, que aplica a função balanceada f(x) = x: o resultado diz balanceada com certeza absoluta, e não diz nem qual é f(0) nem qual é f(1) — as duas balanceadas possíveis dão exatamente o mesmo histograma. O algoritmo não leu duas respostas: ele fez uma pergunta diferente, sobre a relação entre elas, e abriu mão de saber cada uma. A vantagem veio de trocar de pergunta, não de multiplicar leituras.",
        circuit: balanceadaIdentidade,
        caption: "Deutsch com f(x) = x: responde balanceada, mas não revela f(0) nem f(1)",
      },
      {
        kind: "callout",
        variant: "atencao",
        title: "É esse o padrão de todo algoritmo quântico",
        text:
          "Nenhum algoritmo quântico útil despeja todas as respostas. Todos eles preparam superposição, arranjam fases para que as respostas indesejadas se cancelem na interferência, e medem uma vez. O ganho está sempre em fazer a pergunta certa, não em ler mais.",
      },
    ],
    quiz: [
      {
        id: "q1",
        prompt: "O que o algoritmo de Deutsch descobre?",
        options: [
          {
            text: "Se f é constante ou balanceada — uma propriedade da relação entre f(0) e f(1).",
            correct: true,
            explanation:
              "Exato. E é justamente por ser uma propriedade conjunta que uma única consulta consegue revelá-la.",
          },
          {
            text: "Os valores de f(0) e f(1) ao mesmo tempo.",
            correct: false,
            explanation:
              "Não revela nenhum dos dois. As duas funções balanceadas produzem histogramas idênticos.",
            equivoco: "testa-tudo-ao-mesmo-tempo",
          },
          {
            text: "Qual das quatro funções possíveis está sendo usada.",
            correct: false,
            explanation:
              "Ele reduz de quatro para duas possibilidades, e não distingue dentro de cada grupo.",
          },
        ],
      },
      {
        id: "q2",
        prompt: "Qual é o papel do qubit auxiliar preparado em |−⟩?",
        options: [
          {
            text: "Fazer com que a função deposite um sinal na amplitude do qubit de consulta, em vez de mudar probabilidades.",
            correct: true,
            explanation:
              "Isso é o chamado phase kickback. O sinal fica no qubit de consulta, que é onde a Hadamard final vai poder lê-lo.",
          },
          {
            text: "Guardar o resultado da função para leitura posterior.",
            correct: false,
            explanation:
              "O auxiliar termina em |−⟩ como começou, e medi-lo não informa nada útil. Ele serve para converter o valor da função em fase.",
            equivoco: "testa-tudo-ao-mesmo-tempo",
          },
          {
            text: "Duplicar o qubit de consulta para permitir duas medições.",
            correct: false,
            explanation:
              "Copiar um estado quântico é impossível, e o circuito não tenta isso.",
            equivoco: "testa-tudo-ao-mesmo-tempo",
          },
        ],
      },
      {
        id: "q3",
        prompt: "Por que a última Hadamard é indispensável?",
        options: [
          {
            text: "Porque a diferença criada pela função está na fase, e só ela converte fase em probabilidade.",
            correct: true,
            explanation:
              "Certo, é o mesmo mecanismo do módulo 2. Sem ela, o histograma é idêntico nos quatro casos.",
          },
          {
            text: "Porque ela reduz o ruído da medição.",
            correct: false,
            explanation:
              "Não existe ruído aqui: o resultado é exato. O papel dela é revelar uma informação que estava invisível.",
            equivoco: "fase-nao-tem-efeito",
          },
        ],
      },
    ],
  },

  {
    id: "iniciante/primeiro-circuito/experimento",
    trackId: "iniciante",
    moduleId: "primeiro-circuito",
    stage: "experimento",
    title: "Uma consulta, uma resposta certa",
    summary:
      "Você vai rodar o algoritmo de Deutsch com os quatro oráculos possíveis e descobrir, no meio do caminho, o que ele deixa de saber.",
    minutes: 14,
    objectives: [
      "Executar o algoritmo com cada uma das quatro funções",
      "Verificar que a resposta é determinística",
      "Perceber que funções diferentes do mesmo tipo são indistinguíveis",
    ],
    glossaryRefs: ["interferencia", "circuito-quantico", "fase"],
    blocks: [
      {
        kind: "p",
        text:
          "Em todos os circuitos deste roteiro, o qubit q0 é o de consulta e o q1 é o auxiliar. No rótulo do histograma, q0 é o caractere da direita — é nele que está a resposta.",
      },
    ],
    guided: {
      title: "Uma consulta, uma resposta certa",
      steps: [
        {
          id: "constante-zero",
          instruction:
            "Primeiro a função mais simples: f(x) = 0, que não faz nada. O oráculo é um circuito vazio. Ela é constante, então q0 deveria medir 0. Preveja o histograma completo.",
          circuit: constanteZero,
          predict: {
            instrument: "choice",
            question: "Quais resultados aparecem?",
            states: ["00", "01", "10", "11"],
            choices: [
              {
                id: "q0-zero",
                label: "Só 00 e 10 (q0 sempre 0)",
                distribution: { "00": 0.5, "01": 0, "10": 0.5, "11": 0 },
              },
              {
                id: "q0-um",
                label: "Só 01 e 11 (q0 sempre 1)",
                distribution: { "00": 0, "01": 0.5, "10": 0, "11": 0.5 },
              },
              {
                id: "todos",
                label: "Os quatro iguais",
                distribution: { "00": 0.25, "01": 0.25, "10": 0.25, "11": 0.25 },
              },
            ],
          },
          reveal:
            "Só |00⟩ e |10⟩ — o caractere da direita, que é q0, é sempre 0. Constante, com certeza absoluta. O q1 continua aleatório, e isso é esperado: ele fez o trabalho de fase e não carrega resposta nenhuma.",
        },
        {
          id: "balanceada",
          instruction:
            "Agora a função balanceada f(x) = x, cujo oráculo é uma CNOT. Uma única consulta, igual à anterior. Preveja.",
          circuit: balanceadaIdentidade,
          predict: {
            instrument: "choice",
            question: "E agora?",
            states: ["00", "01", "10", "11"],
            choices: [
              {
                id: "q0-um",
                label: "Só 01 e 11 (q0 sempre 1)",
                distribution: { "00": 0, "01": 0.5, "10": 0, "11": 0.5 },
              },
              {
                id: "q0-zero",
                label: "Só 00 e 10 (q0 sempre 0)",
                distribution: { "00": 0.5, "01": 0, "10": 0.5, "11": 0 },
              },
              {
                id: "todos",
                label: "Os quatro iguais",
                distribution: { "00": 0.25, "01": 0.25, "10": 0.25, "11": 0.25 },
              },
            ],
          },
          reveal:
            "q0 agora é sempre 1. Balanceada, também com certeza absoluta, e também com uma única consulta. Repare que nenhuma execução foi repetida para “ter certeza”: a resposta é determinística, não estatística.",
        },
        {
          id: "outra-balanceada",
          instruction:
            "Agora a OUTRA função balanceada, f(x) = 1−x, que é a CNOT seguida de um X. É uma função diferente da anterior. Preveja o histograma.",
          circuit: balanceadaNegada,
          predict: {
            instrument: "choice",
            question: "Uma função diferente dá um histograma diferente?",
            states: ["00", "01", "10", "11"],
            choices: [
              {
                id: "igual",
                label: "Idêntico ao anterior",
                distribution: { "00": 0, "01": 0.5, "10": 0, "11": 0.5 },
              },
              {
                id: "q0-zero",
                label: "Agora q0 sempre 0",
                distribution: { "00": 0.5, "01": 0, "10": 0.5, "11": 0 }, equivoco: "testa-tudo-ao-mesmo-tempo",
              },
              {
                id: "todos",
                label: "Os quatro iguais",
                distribution: { "00": 0.25, "01": 0.25, "10": 0.25, "11": 0.25 },
              },
            ],
          },
          reveal:
            "Exatamente idêntico ao passo anterior. Duas funções diferentes, o mesmo resultado — e é aqui que o mito do paralelismo cai. Se o circuito tivesse lido f(0) e f(1), esses dois casos seriam distinguíveis, porque as funções são diferentes. Ele não leu: descobriu apenas que os dois valores discordam. Ganhou uma consulta e abriu mão de saber qual é qual.",
          branches: [
            {
              id: "outra-constante",
              label: "E a outra constante, f(x) = 1?",
              question:
                "A função que devolve sempre 1, cujo oráculo é um X no auxiliar. Preveja.",
              circuit: constanteUm,
              reveal:
                "Idêntico ao primeiro passo: q0 sempre 0. As duas constantes também são indistinguíveis entre si. O algoritmo separa os quatro casos em dois grupos de dois, e é exatamente essa a informação que ele entrega — nem mais, nem menos.",
            },
            {
              id: "sem-hadamard",
              label: "E se eu tirar a Hadamard final?",
              question:
                "O mesmo circuito da função balanceada, mas sem a última Hadamard. Preveja.",
              circuit: semInterferencia,
              reveal:
                "Os quatro resultados aparecem igualmente, e nenhuma informação sobrevive. A diferença que a função criou estava na fase, e fase não aparece no histograma — foi o módulo 2 inteiro. A Hadamard final é o que transforma interferência em resposta, e sem ela o algoritmo não existe.",
            },
          ],
        },
      ],
    },
    quiz: [
      {
        id: "q1",
        prompt: "As duas funções balanceadas deram histogramas idênticos. O que isso demonstra?",
        options: [
          {
            text: "Que o algoritmo descobre a relação entre f(0) e f(1), não os valores em si.",
            correct: true,
            explanation:
              "Exato. É a diferença entre ler duas respostas e fazer uma pergunta sobre as duas.",
          },
          {
            text: "Que o simulador não distingue as duas funções.",
            correct: false,
            explanation:
              "Os circuitos são diferentes e o simulador os executa diferentemente. O que coincide é só o resultado da medição em q0.",
            equivoco: "testa-tudo-ao-mesmo-tempo",
          },
        ],
      },
      {
        id: "q2",
        prompt: "Sem a Hadamard final, os quatro resultados apareceram igualmente. Por quê?",
        options: [
          {
            text: "Porque a informação estava na fase, e o histograma não enxerga fase.",
            correct: true,
            explanation:
              "Certo, e é a mesma lição do módulo 2: sem converter fase em amplitude, a diferença fica invisível.",
          },
          {
            text: "Porque sem a Hadamard o oráculo não é aplicado.",
            correct: false,
            explanation:
              "O oráculo é aplicado normalmente. O que falta é a porta que traz o efeito dele para a medição.",
            equivoco: "fase-nao-tem-efeito",
          },
        ],
      },
    ],
  },

  {
    id: "iniciante/primeiro-circuito/desafio",
    trackId: "iniciante",
    moduleId: "primeiro-circuito",
    stage: "desafio",
    title: "Monte o algoritmo inteiro",
    summary:
      "Escreva o circuito de Deutsch do zero, para a função f(x) = 1−x, e mostre que uma consulta basta.",
    minutes: 13,
    objectives: ["Montar preparo, oráculo e interferência num circuito completo"],
    glossaryRefs: ["circuito-quantico", "interferencia", "fase"],
    blocks: [
      {
        kind: "p",
        text:
          "Este é o fecho da trilha. Você vai escrever o algoritmo inteiro: preparar o auxiliar, criar superposição, aplicar o oráculo e provocar a interferência que revela a resposta.",
      },
      {
        kind: "code",
        language: "text",
        code: [
          "1. Coloque o auxiliar q1 em |1⟩",
          "2. Hadamard nos dois qubits",
          "3. Oráculo de f(x) = 1-x: uma CNOT de q0 para q1, seguida de X em q1",
          "4. Hadamard só no qubit de consulta q0",
        ].join("\n"),
        caption: "A receita. O resultado precisa dar q0 = 1, indicando balanceada.",
      },
    ],
    exercise: {
      id: "deutsch-completo",
      prompt:
        "Monte o algoritmo de Deutsch para f(x) = 1−x. O qubit de consulta q0 precisa medir 1 com certeza, indicando que a função é balanceada.",
      qubits: 2,
      starterCode:
        "from qiskit import QuantumCircuit\n\nqc = QuantumCircuit(2)\n# 1. auxiliar em |1>\n\n# 2. superposicao nos dois\n\n# 3. oraculo de f(x) = 1-x\n\n# 4. interferencia no qubit de consulta\n",
      solutionCode:
        "from qiskit import QuantumCircuit\n\nqc = QuantumCircuit(2)\nqc.x(1)\nqc.h(0)\nqc.h(1)\nqc.cx(0, 1)\nqc.x(1)\nqc.h(0)\n",
      hints: [
        "Siga a receita na ordem. O auxiliar precisa estar em |1⟩ ANTES da Hadamard, para virar |−⟩.",
        "O oráculo de f(x) = 1−x é a CNOT seguida de um X no auxiliar — a CNOT faz f(x) = x e o X inverte o resultado.",
        "A última Hadamard vai só em q0. Se você aplicar nos dois, perde a resposta.",
      ],
      assertions: [
        { kind: "qubits", exactly: 2 },
        // q0 = 1 com certeza; q1 fica aleatório, como esperado.
        { kind: "probabilities", expected: { "01": 0.5, "11": 0.5 } },
        { kind: "usesGates", required: ["H", "CNOT", "X"] },
        { kind: "gateCount", max: 8 },
      ],
    },
    quiz: [
      {
        id: "q1",
        prompt: "Se a última Hadamard fosse aplicada nos dois qubits em vez de só em q0, o que aconteceria?",
        options: [
          {
            text: "A resposta em q0 continuaria correta, mas o auxiliar deixaria de ser |−⟩ — o que não atrapalha, porque ele já cumpriu o papel dele.",
            correct: true,
            explanation:
              "Certo. O auxiliar entrega o kickback antes disso, e o que acontece com ele depois não altera a resposta em q0. Ainda assim, o circuito canônico não a aplica: seria trabalho sem função.",
          },
          {
            text: "O algoritmo pararia de funcionar por completo.",
            correct: false,
            explanation:
              "A informação já está em q0 nesse ponto. Uma porta a mais em q1 não a apaga.",
          },
        ],
      },
    ],
  },
];
