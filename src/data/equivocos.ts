/**
 * Os equívocos que a plataforma sabe desmontar.
 *
 * Isto não é uma lista inventada: cada módulo escrito foi construído em torno
 * de UMA intuição específica que quebra, e o experimento que a derruba já
 * existe. O que falta aqui é só nomear cada uma e apontar onde ela cai — para
 * que, quando o aluno erra, o site consiga dizer o que ele provavelmente está
 * pensando, e não apenas que errou.
 *
 * O `nome` é escrito na primeira pessoa de propósito: o aluno precisa se
 * reconhecer na frase. "Probabilidade não determina o estado" é uma correção;
 * "acho que dois histogramas iguais significam o mesmo estado" é um espelho.
 */

export type Equivoco = {
  id: string;
  /** Como o aluno reconheceria o próprio pensamento. */
  nome: string;
  /** Por que parece certo, e onde falha. */
  explicacao: string;
  /** Conceitos que o equívoco atinge — ids do glossário. */
  conceitos: string[];
  /** O experimento que derruba. Já escrito, de propósito. */
  demolicao: { licaoId: string; passoId?: string };
};

export const equivocos: Equivoco[] = [
  {
    id: "h-e-sorteio",
    nome: "A porta Hadamard sorteia 0 ou 1",
    explicacao:
      "Ela dá metade e metade, então parece um cara ou coroa. Mas duas Hadamards seguidas devolvem o qubit a |0⟩ com certeza absoluta — e dois sorteios em sequência jamais dariam certeza. H é uma rotação reversível; o acaso só nasce na medição.",
    conceitos: ["superposicao", "porta-quantica", "medicao"],
    demolicao: { licaoId: "iniciante/bits-e-qubits/experimento", passoId: "passo-5" },
  },
  {
    id: "qubit-e-moeda-escondida",
    nome: "O qubit já tem um valor, só está escondido",
    explicacao:
      "É a explicação mais natural do mundo, e funciona para tudo que uma medição direta mostra. Ela morre quando a interferência entra: se o valor já estivesse decidido, não haveria dois caminhos para se cancelarem.",
    conceitos: ["qubit", "superposicao", "interferencia"],
    demolicao: { licaoId: "iniciante/bits-e-qubits/experimento", passoId: "passo-5" },
  },
  {
    id: "amplitude-e-probabilidade",
    nome: "Amplitude e probabilidade são a mesma coisa",
    explicacao:
      "São parecidas o bastante para confundir: a probabilidade é o quadrado da amplitude. Mas o quadrado apaga o sinal, e é exatamente o sinal que decide se dois caminhos vão se somar ou se cancelar na porta seguinte.",
    conceitos: ["amplitude", "probabilidade", "fase"],
    demolicao: { licaoId: "iniciante/superposicao/teoria" },
  },
  {
    id: "probabilidade-e-o-estado",
    nome: "Mesmo histograma significa mesmo estado",
    explicacao:
      "|+⟩ e |−⟩ dão exatamente cinquenta por cento cada um, e são estados diferentes. Uma única Hadamard os manda para lados opostos: um vira certeza no 0, o outro certeza no 1. O histograma responde a uma pergunta, não descreve o estado.",
    conceitos: ["probabilidade", "amplitude", "fase", "superposicao"],
    demolicao: { licaoId: "iniciante/superposicao/experimento", passoId: "menos-com-h" },
  },
  {
    id: "medir-e-ler",
    nome: "Medir é ler o valor que está guardado",
    explicacao:
      "Se fosse leitura, o mesmo estado daria sempre o mesmo grau de certeza. Mas |0⟩ é certeza na medição direta e sorteio depois de uma Hadamard — e |+⟩ faz o inverso. Medir é escolher uma pergunta, e a aleatoriedade mede o desencontro entre o estado e a pergunta.",
    conceitos: ["medicao", "colapso", "esfera-de-bloch"],
    demolicao: { licaoId: "iniciante/medicao/experimento", passoId: "zero-com-h" },
  },
  {
    id: "histograma-e-exato",
    nome: "O histograma mostra a probabilidade exata",
    explicacao:
      "A teoria diz cinquenta por cento; mil e vinte e quatro medições dão quatrocentos e noventa e sete. Cada execução é uma amostra, e mais repetições aproximam sem nunca alcançar — é o mesmo motivo pelo qual pesquisa eleitoral tem margem de erro.",
    conceitos: ["shots", "probabilidade", "medicao"],
    demolicao: { licaoId: "iniciante/medicao/experimento", passoId: "poucos-shots" },
  },
  {
    id: "medicao-precisa-de-observador",
    nome: "É a pessoa olhando que faz o qubit decidir",
    explicacao:
      "O qubit parece perceber quando alguém observa, e a conclusão de que a consciência participa é quase inevitável. Mas medir é uma interação física que registra informação num aparelho ou no ambiente: a interferência se perde mesmo que ninguém consulte o resultado, e mesmo que o registro seja apagado depois.",
    conceitos: ["medicao", "colapso", "coerencia"],
    demolicao: { licaoId: "iniciante/medicao/teoria" },
  },
  {
    id: "ordem-nao-importa",
    nome: "A ordem das portas não muda o resultado",
    explicacao:
      "Se portas fossem números sendo multiplicados, a ordem daria no mesmo. Mas são rotações, e rotações no espaço não comutam: gire um livro em torno de dois eixos em ordens diferentes e ele termina apontando para lugares diferentes. É por isso que a sequência é o algoritmo.",
    conceitos: ["porta-quantica", "unitaria", "circuito-quantico"],
    demolicao: { licaoId: "iniciante/portas/experimento", passoId: "ordem-b" },
  },
  {
    id: "moedas-correlacionadas",
    nome: "Emaranhamento é um par preparado igual desde o começo",
    explicacao:
      "Duas moedas seladas em envelopes também caem sempre iguais, e essa imagem explica tudo que uma medição direta mostra. Ela quebra quando você troca a pergunta nos dois lados: valores decididos de antemão perderiam a correlação, e o par de Bell mantém.",
    conceitos: ["emaranhamento", "estado-de-bell", "medicao"],
    demolicao: { licaoId: "iniciante/emaranhamento/experimento", passoId: "moedas" },
  },
  {
    id: "emaranhamento-transmite",
    nome: "Qubits emaranhados mandam informação instantaneamente",
    explicacao:
      "A correlação é perfeita, então parece haver comunicação. Mas você não escolhe qual resultado sai, e quem está do outro lado vê apenas ruído. A correlação só aparece quando os dois registros são comparados — e comparar exige comunicação comum.",
    conceitos: ["emaranhamento", "medicao"],
    demolicao: { licaoId: "iniciante/emaranhamento/teoria" },
  },
  {
    id: "qubit-emaranhado-tem-estado",
    nome: "Cada qubit emaranhado tem seu estado, só não sabemos qual",
    explicacao:
      "É mais forte que ignorância: não existe estado individual a descobrir. No par de Bell, o vetor de Bloch de cada qubit tem comprimento zero — a informação mora na relação entre os dois, não nas partes.",
    conceitos: ["emaranhamento", "esfera-de-bloch", "produto-tensorial"],
    demolicao: { licaoId: "iniciante/emaranhamento/experimento", passoId: "bell" },
  },
  {
    id: "testa-tudo-ao-mesmo-tempo",
    nome: "O computador quântico testa todas as respostas de uma vez",
    explicacao:
      "É a frase mais repetida sobre o assunto e ela é falsa. No algoritmo de Deutsch, as duas funções balanceadas produzem histogramas idênticos: se o circuito lesse as duas respostas, elas seriam distinguíveis. Ele descobre a relação entre f(0) e f(1), e abre mão de saber qual é qual.",
    conceitos: ["interferencia", "circuito-quantico", "medicao"],
    demolicao: { licaoId: "iniciante/primeiro-circuito/experimento", passoId: "outra-balanceada" },
  },
  {
    id: "fase-nao-tem-efeito",
    nome: "Mudar a fase não muda nada observável",
    explicacao:
      "Z aplicado a |0⟩ realmente não muda nada, e a conclusão parece segura. Mas H·Z·H leva |0⟩ direto a |1⟩ com certeza: a fase não aparece no histograma até uma porta convertê-la em amplitude.",
    conceitos: ["fase", "interferencia", "amplitude"],
    demolicao: { licaoId: "iniciante/superposicao/experimento", passoId: "menos-com-h" },
  },
];

export const equivocosPorId = new Map(equivocos.map((equivoco) => [equivoco.id, equivoco]));

export function getEquivoco(id: string) {
  return equivocosPorId.get(id);
}
