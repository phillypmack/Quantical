import type { AudioEpisode } from "./types";

/**
 * Episódios de "Quantical em Áudio".
 *
 * ARQUIVO GERADO — não edite à mão. A fonte é o roteiro em `audio/roteiros/`,
 * sintetizado pela Dubla (`python -m dubla narrar`) e importado por
 * `npm run audio:import`.
 *
 * Os mp3 ficam fora do build: `media/audio/` é enviado ao servidor por
 * `scripts/deploy-audio.sh` e servido em `/audio/`. Empacotá-los junto do
 * site somaria dezenas de MB a cada deploy sem necessidade.
 */
export const episodios: AudioEpisode[] = [
  {
    id: "iniciante/bits-e-qubits",
    trackId: "iniciante",
    moduleId: "bits-e-qubits",
    numero: 1,
    titulo: "Do bit ao qubit",
    resumo: "Entenda por que o estado de um qubit contém mais informação física do que um simples zero ou um.",
    src: "/audio/iniciante-bits-e-qubits.mp3",
    duracao: 467.46,
    turnos: [
      { at: 0, fim: 9.48, voz: "nina", texto: "Boas-vindas! Hoje a gente vai sair do bit clássico e chegar ao qubit. A pergunta central é: por que um qubit é muito mais do que um zero ou um?" },
      { at: 10.18, fim: 18.83, voz: "teo", texto: "Eu imagino que seja um bit menor e mais rápido. Continua sendo zero ou um, só que fabricado com alguma coisa quântica, certo?" },
      { at: 19.53, fim: 36.79, voz: "nina", texto: "Essa é uma ótima hipótese pra começar, mas ela não sobrevive aos experimentos. Primeiro, vamos separar o objeto físico da informação que ele representa. Um bit pode ser feito com tensão elétrica, magnetismo ou até uma chave mecânica." },
      { at: 37.49, fim: 45.94, voz: "teo", texto: "Então zero e um são só nomes pra dois estados físicos. Tipo tensão baixa e tensão alta num circuito." },
      { at: 46.64, fim: 60.05, voz: "nina", texto: "Exato. Num computador clássico, o estado de um bit, num dado instante, é zero ou um. Mesmo que a gente não saiba qual é, o bit ainda tem um desses dois valores bem definidos." },
      { at: 60.75, fim: 69.25, voz: "teo", texto: "Se eu esconder uma moeda dentro de uma caixa, ela já caiu em cara ou coroa. Minha ignorância não deixa a moeda num estado especial." },
      { at: 69.95, fim: 83.66, voz: "nina", texto: "Perfeito. Uma distribuição de cinquenta por cento para zero e cinquenta por cento para um pode representar apenas falta de informação. Talvez o bit já seja zero ou um, e a gente só não tenha olhado." },
      { at: 84.36, fim: 94.26, voz: "teo", texto: "Então um qubit deve ser isso: uma moeda escondida numa caixa microscópica. Quando a gente abre, descobre o valor que já estava lá." },
      { at: 94.96, fim: 111.82, voz: "nina", texto: "Parece óbvio, e é justamente aí que a intuição clássica prepara uma armadilha. Um qubit também pode estar no estado ket zero ou no estado ket um. Mas existem outros estados físicos que não equivalem a um valor clássico escondido." },
      { at: 112.52, fim: 122.03, voz: "teo", texto: "Você vai dizer que ele é zero e um ao mesmo tempo. Isso quer dizer que o computador quântico testa todas as respostas de uma vez?" },
      { at: 122.73, fim: 140.41, voz: "nina", texto: "Não. Essa frase mistura superposição com acesso simultâneo a respostas clássicas, e leva a previsões erradas. Um algoritmo quântico precisa controlar interferências para que uma medição final revele alguma informação útil." },
      { at: 141.11, fim: 151.24, voz: "teo", texto: "Mas o que é uma superposição, sem usar essa história de testar tudo? Se eu medir e só receber zero ou um, parece que não existe nada além disso." },
      { at: 151.94, fim: 168.7, voz: "nina", texto: "O estado do qubit descreve como ele pode responder a diferentes operações e medições. Em certos estados, uma medição que pergunta “zero ou um?” produz cada resultado com cinquenta por cento de chance. Só que essas chances não contam a história inteira." },
      { at: 169.4, fim: 176.34, voz: "teo", texto: "Pra mim, contam. Se dá metade zero e metade um, é igual a jogar uma moeda justa." },
      { at: 177.04, fim: 191.7, voz: "nina", texto: "Vamos testar essa ideia. A gente prepara vários qubits em ket zero e aplica uma porta chamada Hadamard em cada um. Se medir logo depois, metade dos resultados tende a ser zero e metade tende a ser um." },
      { at: 192.4, fim: 203.09, voz: "teo", texto: "Pronto, a porta Hadamard funciona como um embaralhador. Ela escolhe aleatoriamente zero ou um, e depois a medição só revela a escolha." },
      { at: 203.79, fim: 216.54, voz: "nina", texto: "Agora vem o experimento que quebra essa explicação. Em vez de medir depois da primeira Hadamard, a gente aplica uma segunda Hadamard igual à primeira. Só então faz a medição." },
      { at: 217.24, fim: 225.56, voz: "teo", texto: "Se a primeira embaralhou, a segunda deveria embaralhar de novo. Eu ainda esperaria metade zero e metade um." },
      { at: 226.26, fim: 241.75, voz: "nina", texto: "Mas o resultado é sempre zero, no caso ideal. Duas aplicações da mesma porta devolvem o qubit ao estado ket zero. A aleatoriedade que apareceria no meio não era uma escolha clássica já realizada e escondida." },
      { at: 242.45, fim: 251.24, voz: "teo", texto: "Espera. Depois de uma Hadamard, medir daria um resultado aleatório, mas não medir e aplicar outra Hadamard recupera o zero?" },
      { at: 251.94, fim: 264.25, voz: "nina", texto: "Isso mesmo. A primeira porta cria uma superposição coerente, e a segunda faz as partes desse estado interferirem. Para o resultado um, as contribuições se cancelam; para o zero, elas se reforçam." },
      { at: 264.95, fim: 272.72, voz: "teo", texto: "Então a medição atrapalha o truque. Se eu medir entre as duas portas, ainda termino sempre em zero?" },
      { at: 273.42, fim: 290.19, voz: "nina", texto: "Não. Se houver uma medição no meio, ela produz zero ou um e destrói a coerência relevante entre as partes da superposição. Depois da segunda Hadamard, a medição final volta a apresentar resultados aleatórios." },
      { at: 290.89, fim: 298.66, voz: "teo", texto: "Parece que o qubit percebe se eu estava olhando. Isso depende de uma pessoa consciente observando o aparelho?" },
      { at: 299.36, fim: 312.12, voz: "nina", texto: "Não depende de consciência. Medição é uma interação física que registra informação num aparelho ou no ambiente. Quando o caminho deixa uma marca acessível, a interferência pode desaparecer." },
      { at: 312.82, fim: 322.26, voz: "teo", texto: "Ainda quero chamar a superposição de cinquenta por cento zero e cinquenta por cento um. Por que esse jeito de falar é insuficiente?" },
      { at: 322.96, fim: 342.79, voz: "nina", texto: "Porque existem superposições diferentes que dão as mesmas probabilidades nessa medição. Uma delas pode ser chamada de estado mais, e outra de estado menos. As duas dão metade zero e metade um quando medidas diretamente." },
      { at: 343.49, fim: 353.31, voz: "teo", texto: "Se produzem exatamente os mesmos resultados, então são dois nomes pro mesmo estado. Não existe experimento capaz de separar um do outro." },
      { at: 354.01, fim: 374.09, voz: "nina", texto: "Existe, e ele usa novamente a porta Hadamard. Aplicada ao estado mais, ela leva a ket zero; aplicada ao estado menos, ela leva a ket um. A diferença invisível na primeira medição vira uma diferença totalmente visível depois da porta." },
      { at: 374.79, fim: 385.4, voz: "teo", texto: "Então as probabilidades de zero e um não definem sozinhas o estado. Falta alguma informação sobre como as partes da superposição se relacionam." },
      { at: 386.1, fim: 402.3, voz: "nina", texto: "Exatamente. Essa relação inclui algo chamado fase relativa, que controla a interferência. Por isso um qubit não é apenas uma moeda clássica com um valor desconhecido." },
      { at: 403, fim: 412.27, voz: "teo", texto: "Mas isso significa que um qubit guarda infinitos números e oferece memória infinita? Parece uma vantagem enorme sobre um bit." },
      { at: 412.97, fim: 432.44, voz: "nina", texto: "O estado pode variar continuamente, mas uma única medição não despeja uma quantidade infinita de informação clássica. Ela entrega um resultado compatível com a medição escolhida. Para aprender um estado desconhecido, a gente precisa preparar e medir muitas cópias de forma controlada." },
      { at: 433.14, fim: 442.98, voz: "teo", texto: "Então a vantagem não é abrir o qubit e ler todos os detalhes. Ela vem de manipular o estado antes da medição, usando interferência." },
      { at: 443.68, fim: 467.46, voz: "nina", texto: "Isso. Um bit clássico tem dois estados definidos, enquanto o estado de um qubit também pode ocupar superposições com diferentes pesos e fases. No próximo passo do site, a gente vai visualizar esses estados e entender como as portas quânticas mudam o qubit sem recorrer ao mito de testar todas as possibilidades ao mesmo tempo." },
    ],
  },
];
