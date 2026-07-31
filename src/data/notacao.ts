/**
 * Como se lê a notação.
 *
 * Este arquivo existe por causa de um defeito real e embaraçoso: a aula
 * "O que um qubit tem que um bit não tem" declarava como objetivo
 * "Ler a notação |0⟩, |1⟩ e α|0⟩ + β|1⟩", usava a notação no terceiro
 * parágrafo — e não ensinava a ler em lugar nenhum. `|0⟩` aparece em 17 das
 * 18 aulas da trilha e nunca era pronunciado uma única vez.
 *
 * O aluno precisou sair da plataforma e perguntar para outra ferramenta o que
 * significava aquilo. Isso é a falha mais grave que uma ferramenta de ensino
 * pode ter: usar um símbolo como se ele fosse óbvio.
 *
 * Três regras governam o que está escrito aqui:
 *
 * 1. **`leitura` é como se FALA.** Ninguém consegue pensar sobre um símbolo
 *    que não sabe pronunciar. É a primeira coisa que falta e a primeira que
 *    aparece na tela.
 * 2. **`oQueE` não pode usar o próprio símbolo nem jargão não apresentado.**
 *    O glossário definia ket como "vetor de estado representado por |ψ⟩ na
 *    notação de Dirac" — circular e apoiado em dois termos que o aluno também
 *    não conhece. Definição assim não ensina nada.
 * 3. **`porQue` desarma a arbitrariedade.** Notação sem motivo parece
 *    capricho, e capricho o aluno decora em vez de entender.
 */

export type Notacao = {
  /** O símbolo como ele aparece no texto. */
  simbolo: string;
  /** Como se fala em voz alta, em português. */
  leitura: string;
  /** O que é, sem usar o próprio símbolo e sem jargão. */
  oQueE: string;
  /** Por que essa notação existe — o que ela resolve. */
  porQue: string;
  /**
   * A aula em que o símbolo é apresentado.
   *
   * Ausente = ainda não aparece em aula nenhuma; está aqui como referência,
   * para quando o aluno encontrar o símbolo fora da plataforma. A trava de
   * conteúdo confere os dois lados: o símbolo não pode aparecer ANTES desta
   * aula, e tem de aparecer NELA — senão a declaração envelheceu calada.
   */
  estreia?: string;
  /**
   * Padrão para marcar o símbolo no texto das aulas.
   *
   * O marcador do glossário usa `\b`, que é fronteira de PALAVRA e nunca casa
   * com `|0⟩` ou `α`. Por isso símbolos precisam do próprio padrão.
   */
  padrao: RegExp;
  /** Outros símbolos que ajudam a entender este. */
  vejaTambem?: string[];
  id: string;
};

export const notacoes: Notacao[] = [
  {
    id: "ket",
    simbolo: "|0⟩",
    leitura: "ket zero",
    oQueE:
      "O jeito de escrever “o qubit está no valor 0”. A barra da esquerda e o bico da direita não são conta nem operação: são só uma caixa em volta do valor, avisando que o que está lá dentro é um estado quântico e não um número comum.",
    porQue:
      "Num circuito você mistura números de verdade (pesos, ângulos, probabilidades) com estados. Sem a caixa, `0` sozinho seria ambíguo: o número zero ou o estado zero? A caixa acaba com a dúvida — e por isso ela aparece em quase toda linha de todo material de computação quântica.",
    estreia: "iniciante/bits-e-qubits/teoria",
    padrao: /\|0⟩/gu,
    vejaTambem: ["ket-um", "ket-psi"],
  },
  {
    id: "ket-um",
    simbolo: "|1⟩",
    leitura: "ket um",
    oQueE:
      "A mesma caixa, agora em volta do 1: “o qubit está no valor 1”. É o equivalente quântico do bit que vale 1.",
    porQue:
      "|0⟩ e |1⟩ são os dois resultados que uma medição pode devolver. Todo o resto da notação é feito de combinações desses dois.",
    estreia: "iniciante/bits-e-qubits/teoria",
    padrao: /\|1⟩/gu,
    vejaTambem: ["ket"],
  },
  {
    id: "ket-psi",
    simbolo: "|ψ⟩",
    leitura: "ket psi",
    oQueE:
      "A mesma caixa, mas com um nome genérico dentro. ψ é uma letra grega usada como “um estado qualquer”, do mesmo jeito que x é “um número qualquer” na álgebra do colégio.",
    porQue:
      "Permite falar do estado sem dizer qual é. Quando você lê |ψ⟩ = α|0⟩ + β|1⟩, está lendo “o estado, seja ele qual for, é feito de tanto de zero e tanto de um”.",
    estreia: "iniciante/bits-e-qubits/teoria",
    padrao: /\|ψ⟩/gu,
    vejaTambem: ["ket", "alfa"],
  },
  {
    id: "psi",
    simbolo: "ψ",
    leitura: "psi",
    oQueE:
      "Letra grega usada como nome do estado, do mesmo jeito que x é o nome do número desconhecido na álgebra. Sozinha ela não quer dizer nada de especial: é só o apelido do estado de que se está falando.",
    porQue:
      "Vem da função de onda da física quântica, batizada de psi por Schrödinger nos anos 1920. Ficou como o nome padrão de “o estado”, e é por isso que aparece dentro da caixa em |ψ⟩.",
    estreia: "iniciante/bits-e-qubits/teoria",
    padrao: /ψ/gu,
    vejaTambem: ["ket-psi"],
  },
  {
    id: "alfa",
    simbolo: "α",
    leitura: "alfa",
    oQueE:
      "A primeira letra do alfabeto grego, usada aqui como o peso do |0⟩ — o quanto o qubit pende para o zero. É um número, e pode ser negativo.",
    porQue:
      "Física e matemática reservam as letras gregas para grandezas, deixando as latinas para contagens e índices. Não há mistério: α é só um nome de número, como o `a` de uma equação.",
    estreia: "iniciante/bits-e-qubits/teoria",
    padrao: /α/gu,
    vejaTambem: ["beta", "modulo-quadrado"],
  },
  {
    id: "beta",
    simbolo: "β",
    leitura: "beta",
    oQueE:
      "A segunda letra grega, usada como o peso do |1⟩ — o quanto o qubit pende para o um. Também é um número que pode ser negativo.",
    porQue:
      "α e β vêm em par pela mesma razão que x e y vêm em par: são a primeira e a segunda coisa do mesmo tipo. Aqui, os dois pesos que descrevem o qubit inteiro.",
    estreia: "iniciante/bits-e-qubits/teoria",
    padrao: /β/gu,
    vejaTambem: ["alfa"],
  },
  {
    id: "modulo-quadrado",
    simbolo: "|α|²",
    leitura: "módulo de alfa, ao quadrado",
    oQueE:
      "O peso elevado ao quadrado, que é o que vira probabilidade de verdade. As barras significam “ignore o sinal”; o dois em cima é a potência. Se α = −0,6, então |α|² = 0,36 — ou seja, 36% de chance.",
    porQue:
      "É o que transforma um peso, que pode ser negativo, numa chance, que nunca pode. E é exatamente aqui que mora a diferença entre amplitude e probabilidade: o quadrado apaga o sinal, e é o sinal que faz dois caminhos se cancelarem.",
    estreia: "iniciante/bits-e-qubits/teoria",
    padrao: /\|[αβ]\|²/gu,
    vejaTambem: ["alfa", "beta"],
  },
  {
    id: "ket-mais",
    simbolo: "|+⟩",
    leitura: "ket mais",
    oQueE:
      "O estado que está exatamente meio a meio: metade de chance de sair 0 e metade de sair 1. O sinal de mais lembra que as duas partes entram somando — é o que uma porta Hadamard produz a partir do zero.",
    porQue:
      "Escrever esse estado por extenso toda vez daria uma linha inteira. Como ele aparece o tempo todo, ganhou nome curto. É apelido, não conceito novo.",
    estreia: "iniciante/superposicao/teoria",
    padrao: /\|\+⟩/gu,
    vejaTambem: ["ket-menos", "ket"],
  },
  {
    id: "ket-menos",
    simbolo: "|−⟩",
    leitura: "ket menos",
    oQueE:
      "Também meio a meio nas chances, mas com o peso do 1 negativo. Medindo, é indistinguível do ket mais: os dois dão 50% e 50%. A diferença só aparece quando outra porta age em cima.",
    porQue:
      "É o exemplo mais limpo de que o histograma não é o estado. Dois estados com resultados idênticos que se comportam de forma diferente — e o sinal é a única coisa que os separa.",
    estreia: "iniciante/superposicao/teoria",
    padrao: /\|−⟩/gu,
    vejaTambem: ["ket-mais", "modulo-quadrado"],
  },
  {
    id: "ket-dois-qubits",
    simbolo: "|01⟩",
    leitura: "ket zero um",
    oQueE:
      "Dois qubits na mesma caixa: o primeiro vale 0 e o segundo vale 1. Lê-se dígito por dígito, nunca como o número onze. |00⟩ é “ket zero zero”.",
    porQue:
      "Com dois qubits há quatro combinações, e escrever cada uma como um par separado ficaria longo. Empilhar os dígitos dentro da mesma caixa é o atalho — e é por isso que a lista de estados dobra a cada qubit novo.",
    estreia: "iniciante/emaranhamento/teoria",
    padrao: /\|[01]{2,}⟩/gu,
    vejaTambem: ["ket", "tensor"],
  },
  {
    id: "ket-i",
    simbolo: "|+i⟩",
    leitura: "ket mais i",
    oQueE:
      "Outro estado meio a meio, agora com o peso do 1 multiplicado por i, o número imaginário. Nas chances é igual ao ket mais e ao ket menos: 50% e 50%. O que muda é para onde ele aponta na esfera de Bloch.",
    porQue:
      "Mostra que existem infinitos estados com o mesmo histograma. Se probabilidade fosse o estado, esses três seriam o mesmo — e não são.",
    estreia: "iniciante/portas/experimento",
    padrao: /\|[+−]i⟩/gu,
    vejaTambem: ["ket-mais", "ket-menos"],
  },
  {
    id: "bell",
    simbolo: "|Φ⁺⟩",
    leitura: "ket fi mais",
    oQueE:
      "Nome de um estado específico de dois qubits: aquele em que os dois saem sempre iguais, mas nenhum dos dois tem valor decidido antes da medição. Φ é a letra grega fi.",
    porQue:
      "É um dos quatro estados de Bell, os mais emaranhados que dois qubits podem ter. Ganharam nome próprio porque aparecem em quase todo protocolo quântico.",
    estreia: "iniciante/emaranhamento/teoria",
    padrao: /\|Φ[⁺⁻]⟩/gu,
    vejaTambem: ["ket-dois-qubits"],
  },
  {
    id: "bra",
    simbolo: "⟨ψ|",
    leitura: "bra psi",
    oQueE:
      "A mesma caixa virada ao contrário. Se |ψ⟩ é o estado, ⟨ψ| é a pergunta “o quanto isto se parece com ψ?”. Os dois juntos, ⟨ψ|φ⟩, medem semelhança entre dois estados.",
    porQue:
      "O nome vem de uma piada em inglês: bracket, colchete, partido ao meio em bra e ket. Por isso o conjunto se chama notação bra-ket.",
    padrao: /⟨[^⟨|\s]{1,4}\|/gu,
    vejaTambem: ["ket"],
  },
  {
    id: "raiz",
    simbolo: "√",
    leitura: "raiz quadrada de",
    oQueE:
      "O mesmo símbolo da escola. Aparece muito em computação quântica porque os pesos precisam ter quadrados que somam 1, e a divisão em partes iguais leva a 1/√2 — aproximadamente 0,707.",
    porQue:
      "Meio a meio nas probabilidades não significa peso 0,5 em cada lado: significa peso 1/√2, porque é o quadrado que vira probabilidade. 0,707² = 0,5. Esse número reaparece o tempo todo.",
    estreia: "iniciante/superposicao/desafio",
    padrao: /√/gu,
    vejaTambem: ["modulo-quadrado"],
  },
  {
    id: "theta",
    simbolo: "θ",
    leitura: "teta",
    oQueE:
      "Letra grega usada, aqui como em toda a matemática, para ângulo. Nas portas de rotação, é o quanto se gira o qubit.",
    porQue:
      "Portas quânticas são rotações. Como todo giro precisa de um ângulo, θ é o parâmetro que você passa para RX, RY e RZ.",
    estreia: "iniciante/portas/teoria",
    padrao: /θ/gu,
    vejaTambem: ["pi"],
  },
  {
    id: "pi",
    simbolo: "π",
    leitura: "pi",
    oQueE:
      "O 3,14159… da circunferência. Em ângulos, π equivale a meia volta (180°) e π/2 a um quarto de volta (90°).",
    porQue:
      "Os ângulos aqui são medidos em radianos, não em graus, e nessa unidade meia volta é exatamente π. Por isso as rotações mais comuns aparecem como π, π/2 e π/4 em vez de 180°, 90° e 45°.",
    estreia: "iniciante/portas/teoria",
    padrao: /π/gu,
    vejaTambem: ["theta"],
  },
  {
    id: "adaga",
    simbolo: "†",
    leitura: "adaga",
    oQueE:
      "Uma cruz pequena depois do nome de uma porta, como em S†. Significa “a porta que desfaz esta”. S† desfaz o que S fez.",
    porQue:
      "Toda porta quântica é reversível, então toda porta tem uma que a desfaz. Em vez de inventar um nome novo para cada uma, marca-se a original com a adaga.",
    padrao: /†/gu,
  },
  {
    id: "tensor",
    simbolo: "⊗",
    leitura: "produto tensorial",
    oQueE:
      "O jeito de escrever “estes dois qubits, lado a lado”. |0⟩ ⊗ |1⟩ é o par em que o primeiro vale 0 e o segundo vale 1 — normalmente abreviado como |01⟩.",
    porQue:
      "Dois qubits não têm dois estados: têm quatro combinações possíveis. O símbolo lembra que juntar qubits multiplica as possibilidades em vez de somá-las — e é daí que vem o crescimento exponencial.",
    padrao: /⊗/gu,
    vejaTambem: ["ket"],
  },
];

export const notacaoPorId = new Map(notacoes.map((item) => [item.id, item]));

export function getNotacao(id: string) {
  return notacaoPorId.get(id);
}

/**
 * Símbolos apresentados até uma aula, inclusive.
 *
 * `ordemDasAulas` vem de fora para este módulo não depender do currículo — o
 * que manteria um ciclo de importação entre dados de conteúdo.
 */
export function notacoesApresentadasAte(
  licaoId: string,
  ordemDasAulas: readonly string[],
): Notacao[] {
  const limite = ordemDasAulas.indexOf(licaoId);
  if (limite < 0) return [];
  return notacoes.filter((item) => {
    if (!item.estreia) return false;
    const quando = ordemDasAulas.indexOf(item.estreia);
    return quando >= 0 && quando <= limite;
  });
}
