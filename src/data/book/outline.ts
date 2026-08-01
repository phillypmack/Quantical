import type { BookChapterPlan, BookPart } from "./types";

export const BOOK_TITLE = "O Arquivo da Luz";
export const BOOK_SUBTITLE = "Uma viagem real pelos territórios da física quântica";
export const BOOK_TOTAL_PAGES = 216;
export const PAGES_PER_CHAPTER = 9;

export const bookParts: BookPart[] = [
  {
    number: 1,
    title: "A rachadura na luz",
    premise: "O mundo clássico funciona bem demais — até uma fornalha começar a brilhar da maneira errada.",
  },
  {
    number: 2,
    title: "A matéria aprende a ondular",
    premise: "Elétrons deixam de caber na imagem de pequenas esferas e passam a produzir franjas, nós e interferência.",
  },
  {
    number: 3,
    title: "Perguntas mudam o mundo",
    premise: "Medir não é espiar uma resposta pronta: é escolher qual pergunta física poderá ter resposta.",
  },
  {
    number: 4,
    title: "A arquitetura da matéria",
    premise: "Átomos, moléculas, metais e estrelas passam a ser consequências de uma mesma gramática microscópica.",
  },
  {
    number: 5,
    title: "Distâncias impossíveis",
    premise: "Duas partículas desafiam qualquer história em que propriedades locais já estivessem decididas de antemão.",
  },
  {
    number: 6,
    title: "Máquinas feitas de possibilidade",
    premise: "A teoria deixa o quadro-negro e se torna sensor, relógio, comunicação e computador — com limites reais.",
  },
];

const chapters: Omit<BookChapterPlan, "number" | "pageStart" | "pageEnd">[] = [
  { part: 1, title: "A cidade que brilhava errado", subtitle: "Corpos negros, calor e a primeira fenda na física clássica", concepts: ["radiação térmica", "corpo negro", "lei de Planck"] },
  { part: 1, title: "A luz que arrancava elétrons", subtitle: "O efeito fotoelétrico e o quantum que viaja inteiro", concepts: ["fóton", "função trabalho", "frequência de corte"] },
  { part: 1, title: "O choque do invisível", subtitle: "Compton e o momento carregado pela luz", concepts: ["momento do fóton", "espalhamento", "conservação"] },
  { part: 1, title: "O átomo proibido", subtitle: "Do núcleo de Rutherford aos saltos de Bohr", concepts: ["núcleo", "espectros", "níveis de energia"] },
  { part: 2, title: "O príncipe sem caminho", subtitle: "De Broglie propõe ondas para toda matéria", concepts: ["comprimento de onda", "momento", "dualidade"] },
  { part: 2, title: "Marcas no níquel", subtitle: "Davisson e Germer veem elétrons difratarem", concepts: ["difração", "cristal", "onda de matéria"] },
  { part: 2, title: "O relógio de Schrödinger", subtitle: "Uma equação para a evolução dos estados", concepts: ["função de onda", "Hamiltoniano", "evolução unitária"] },
  { part: 2, title: "A regra das amplitudes", subtitle: "Born transforma ondas em probabilidades observáveis", concepts: ["amplitude", "regra de Born", "interferência"] },
  { part: 3, title: "A sala das duas fendas", subtitle: "O experimento que recusa uma única história clássica", concepts: ["dupla fenda", "interferência", "informação de caminho"] },
  { part: 3, title: "O mapa e o limite", subtitle: "Incerteza não é defeito do instrumento", concepts: ["incerteza", "comutador", "complementaridade"] },
  { part: 3, title: "A bússola partida", subtitle: "Spin e o feixe que escolheu apenas duas direções", concepts: ["spin", "Stern–Gerlach", "base de medição"] },
  { part: 3, title: "O instante da medida", subtitle: "Colapso, ambiente e decoerência", concepts: ["medição", "decoerência", "sistema aberto"] },
  { part: 4, title: "O endereço do elétron", subtitle: "O átomo de hidrogênio e seus orbitais", concepts: ["hidrogênio", "orbitais", "números quânticos"] },
  { part: 4, title: "A multidão que não se repete", subtitle: "Pauli, férmions e a tabela periódica", concepts: ["exclusão de Pauli", "férmions", "estrutura eletrônica"] },
  { part: 4, title: "A cola invisível", subtitle: "Como estados compartilhados formam moléculas", concepts: ["ligação química", "orbitais moleculares", "hibridização"] },
  { part: 4, title: "O mar dentro do metal", subtitle: "Bandas, semicondutores e supercondutividade", concepts: ["bandas", "semicondutor", "pares de Cooper"] },
  { part: 5, title: "A carta de EPR", subtitle: "Realidade, completude e uma provocação de 1935", concepts: ["EPR", "realismo local", "elementos de realidade"] },
  { part: 5, title: "O sino de Bell", subtitle: "Uma desigualdade separa filosofias de experimentos", concepts: ["Bell", "variáveis ocultas locais", "correlações"] },
  { part: 5, title: "A noite dos detectores", subtitle: "Aspect e os testes sem brechas decisivas", concepts: ["fótons emaranhados", "violação de Bell", "loopholes"] },
  { part: 5, title: "Muitas histórias, uma matemática", subtitle: "Interpretações e o que os dados não decidem", concepts: ["Copenhague", "muitos mundos", "Bohm"] },
  { part: 6, title: "O bit que não era binário", subtitle: "Qubits, bases e a esfera de Bloch", concepts: ["qubit", "fase", "portas quânticas"] },
  { part: 6, title: "O recado que não viajou", subtitle: "Emaranhamento e teleportação quântica", concepts: ["teleportação", "Bell", "comunicação clássica"] },
  { part: 6, title: "Atalhos sem onisciência", subtitle: "Deutsch, Grover e Shor sem mitologia", concepts: ["interferência", "complexidade", "algoritmos"] },
  { part: 6, title: "A máquina que aprende a sobreviver", subtitle: "Erros, correção e o horizonte da tecnologia quântica", concepts: ["decoerência", "correção de erros", "tolerância a falhas"] },
];

export const bookChapters: BookChapterPlan[] = chapters.map((chapter, index) => ({
  ...chapter,
  number: index + 1,
  pageStart: index * PAGES_PER_CHAPTER + 1,
  pageEnd: (index + 1) * PAGES_PER_CHAPTER,
}));
