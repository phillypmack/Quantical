// GERADO por scripts/import-audiolivro.mjs — não edite à mão.
//
// A fonte é a saída da Dubla em work/livro/audio (mp3 + tempos por fala) e os
// roteiros em work/livro/roteiros (mapa de página -> fala). Para atualizar:
//   node scripts/import-audiolivro.mjs
import type { AudiolivroCapitulo } from "./audiolivro-types";

export const audiolivroCapitulos: AudiolivroCapitulo[] = [
  {
    numero: 1,
    titulo: "A cidade que brilhava errado",
    resumo: "Corpos negros, calor e a primeira fenda na física clássica",
    src: "/audio/livro/livro-ch01.mp3?v=ed303a2a1781",
    duracao: 1587.12,
    turnos: [
      {
        at: 0,
        fim: 9.43,
        voz: "nina",
        texto: "Capítulo 1. A cidade que brilhava errado. Corpos negros, calor e a primeira fenda na física clássica"
      },
      {
        at: 11.43,
        fim: 17.25,
        voz: "nina",
        texto: "A oficina do Sol. Capítulo 1. A cidade que brilhava errado"
      },
      {
        at: 17.85,
        fim: 35.14,
        voz: "nina",
        texto: "Quando Lia encontrou a porta, o Observatório já estava fechado havia cento e três anos. A placa de bronze dizia ARQUIVO DA LUZ, embora atrás dela não houvesse janela alguma. Havia apenas uma fechadura morna e, no bolso de Lia, uma chave que ela jurava nunca ter visto."
      },
      {
        at: 35.74,
        fim: 67.11,
        voz: "nina",
        texto: "A chave girou. Do outro lado não estava um arquivo, mas uma cidade noturna. As pedras da rua devolviam o calor do dia, as chaminés respiravam vermelho e, no alto, o céu parecia ter sido pintado com carvão. Um homem de casaco claro aguardava junto a uma fornalha. Chamava-se Tomás e dizia ser o cartógrafo daquele lugar. Não cartografava ruas: cartografava perguntas que tinham mudado o mundo."
      },
      {
        at: 67.61,
        fim: 78.4,
        voz: "nina",
        texto: "— Toda coisa quente conta sua temperatura por meio da luz — disse ele. — Algumas falam no visível. Outras sussurram em infravermelho, que seus olhos não escutam."
      },
      {
        at: 79,
        fim: 107.13,
        voz: "nina",
        texto: "Tomás abriu a portinhola da fornalha. Primeiro veio um rubor escuro. Ao aumentar a temperatura, o interior passou por vermelho, laranja e amarelo quase branco. Não era tinta escondida no metal. Corpos com temperatura acima do zero absoluto trocam radiação eletromagnética com o ambiente; a distribuição dessa radiação depende da temperatura e das propriedades da superfície."
      },
      {
        at: 107.73,
        fim: 127.7,
        voz: "nina",
        texto: "A cidade fora construída para uma pergunta: se toda matéria é diferente, existe alguma luz térmica que não dependa do material? No fim do século XIX, a resposta parecia morar dentro de uma cavidade aquecida. E essa resposta brilhava de um modo que a física conhecida não conseguia explicar por inteiro."
      },
      {
        at: 128.6,
        fim: 146.93,
        voz: "nina",
        texto: "Lia se aproximou. A fornalha não rugia como fogo. Emitia um acorde contínuo, grave nas paredes frias e cada vez mais agudo no centro. Tomás entregou-lhe um caderno vazio. Na capa havia uma única instrução: não confunda o que você vê com tudo o que existe."
      },
      {
        at: 148.33,
        fim: 174.61,
        voz: "teo",
        texto: "Nota científica. O que é radiação térmica? É radiação eletromagnética emitida por matéria em razão de sua temperatura. O espectro inclui frequências que o olho humano não percebe. Um corpo negro é o modelo ideal que absorve toda radiação incidente e, em equilíbrio térmico, emite um espectro determinado apenas por sua temperatura."
      },
      {
        at: 176.21,
        fim: 181.56,
        voz: "nina",
        texto: "A caixa sem cor. O objeto mais escuro era também o emissor mais honesto"
      },
      {
        at: 182.16,
        fim: 203.17,
        voz: "nina",
        texto: "A fornalha levou Lia a uma sala onde centenas de caixas negras ocupavam as estantes. Cada caixa tinha um pequeno furo. Nenhuma possuía lâmpada, vidro colorido ou mostrador. Ainda assim, de cada abertura saía uma luz diferente: vinho, cobre, ouro, branco."
      },
      {
        at: 203.67,
        fim: 208.28,
        voz: "nina",
        texto: "— Não olhe para a parede da caixa — pediu Tomás. — Olhe para o buraco."
      },
      {
        at: 208.88,
        fim: 237.44,
        voz: "nina",
        texto: "Um raio que entra por uma abertura pequena encontra poucas chances de escapar. Ele reflete muitas vezes nas paredes internas e acaba quase todo absorvido. Por isso uma cavidade com um orifício estreito aproxima um absorvedor ideal. Se as paredes são mantidas a uma temperatura fixa, a radiação lá dentro chega ao equilíbrio: emissão e absorção continuam acontecendo, mas as propriedades médias permanecem estáveis."
      },
      {
        at: 238.04,
        fim: 266.31,
        voz: "nina",
        texto: "O detalhe decisivo era a universalidade. Trocar cobre por porcelana mudava o tempo necessário para atingir o equilíbrio e alterava imperfeições da superfície, mas a forma ideal do espectro que escapava do pequeno furo dependia da temperatura. Era como se materiais diferentes, depois de tempo suficiente, esquecessem seus nomes e falassem a mesma língua térmica."
      },
      {
        at: 266.91,
        fim: 293.3,
        voz: "nina",
        texto: "Lia encostou um sensor na primeira caixa. Tomás ajustou todas à mesma temperatura. Os espectros se sobrepuseram no visor. A caixa não era negra porque emitia pouca luz. Era chamada corpo negro porque, no modelo ideal, não refletia nada do que recebia. Justamente por ser o absorvedor mais eficiente possível, também é o emissor térmico de referência em equilíbrio."
      },
      {
        at: 293.8,
        fim: 298.36,
        voz: "nina",
        texto: "— Então a cor não pertence à caixa? — perguntou Lia."
      },
      {
        at: 299.26,
        fim: 314.12,
        voz: "nina",
        texto: "— A forma do espectro pertence à temperatura — respondeu Tomás. — E isso transforma uma coleção de objetos num problema universal. Quando a natureza elimina os detalhes, normalmente está nos oferecendo uma lei."
      },
      {
        at: 315.52,
        fim: 342.87,
        voz: "teo",
        texto: "Nota científica. Absorver bem implica emitir bem. Em equilíbrio térmico, a emissividade e a absortividade se relacionam. A cavidade ideal permite estudar uma distribuição universal sem precisar modelar cada material. O pequeno orifício é uma aproximação experimental de corpo negro, não um objeto místico que seja literalmente preto em qualquer temperatura."
      },
      {
        at: 344.47,
        fim: 350.72,
        voz: "nina",
        texto: "O mapa do calor. Cada temperatura desenhava uma montanha diferente"
      },
      {
        at: 351.32,
        fim: 374.31,
        voz: "nina",
        texto: "No centro da sala havia um prisma. A luz da cavidade entrava por uma fenda e se abria numa faixa de cores sobre a mesa. Um detector percorria a faixa e registrava quanta energia chegava em cada comprimento de onda. O resultado não era uma cor única, mas uma curva: pouca energia num extremo, uma subida até o pico e uma descida no outro."
      },
      {
        at: 374.91,
        fim: 404.4,
        voz: "nina",
        texto: "Tomás aqueceu a cavidade. A montanha no papel ficou mais alta e seu cume caminhou para comprimentos de onda menores. Um objeto morno emite principalmente no infravermelho. Mais quente, pode começar a brilhar em vermelho. Mais quente ainda, acrescenta outras regiões visíveis; não abandona simplesmente o vermelho, mas aumenta a emissão em uma faixa ampla enquanto o pico se desloca."
      },
      {
        at: 405,
        fim: 443.58,
        voz: "nina",
        texto: "Em 1896, Wilhelm Wien publicou uma lei de distribuição que capturava muito bem o lado de alta frequência do espectro. Também estava ligada ao deslocamento do pico com a temperatura: multiplicar a temperatura absoluta pelo comprimento de onda do máximo produz uma constante. É por isso que a cor aparente de metais aquecidos e estrelas fornece pistas sobre temperatura — desde que se trate com cuidado absorção, atmosfera e o fato de objetos reais não serem corpos negros perfeitos."
      },
      {
        at: 444.18,
        fim: 462.75,
        voz: "nina",
        texto: "Lia desenhou três curvas no caderno. Nenhuma terminava numa parede. A radiação visível era apenas um corredor estreito dentro de um edifício muito maior. À esquerda e à direita havia energia que seus olhos não detectavam, embora instrumentos pudessem medi-la."
      },
      {
        at: 463.25,
        fim: 467.49,
        voz: "nina",
        texto: "— A teoria precisa explicar a curva inteira? — perguntou."
      },
      {
        at: 467.99,
        fim: 477.8,
        voz: "nina",
        texto: "— Inteira — respondeu Tomás. — Ajustar só o trecho que vemos seria como afirmar que conhece uma cidade porque reconhece sua praça."
      },
      {
        at: 478.7,
        fim: 499.65,
        voz: "nina",
        texto: "A dificuldade escondia-se nos extremos. A lei de Wien falhava nas frequências baixas medidas com crescente precisão. A física clássica oferecia outra expressão que funcionava justamente ali. Cada teoria conhecia metade da cidade. Nenhuma possuía o mapa completo."
      },
      {
        at: 501.05,
        fim: 528.4,
        voz: "teo",
        texto: "Nota científica. A lei de deslocamento de Wien. Para um corpo negro, o comprimento de onda no qual a emissão por unidade de comprimento de onda é máxima satisfaz λmáxT = b. O pico depende da forma de representar o espectro: por comprimento de onda e por frequência, os máximos não são convertidos um no outro por uma simples troca de variável."
      },
      {
        at: 530,
        fim: 536.98,
        voz: "nina",
        texto: "O infinito dentro da fornalha. Uma previsão matematicamente obediente e fisicamente impossível"
      },
      {
        at: 537.58,
        fim: 559.89,
        voz: "nina",
        texto: "Tomás conduziu Lia até um auditório vazio. No quadro, alguém havia desenhado uma cavidade como uma caixa de música. Ondas eletromagnéticas só poderiam formar certos padrões estacionários entre as paredes, como uma corda presa nas duas extremidades. Em frequências maiores cabiam mais padrões possíveis."
      },
      {
        at: 560.49,
        fim: 589.65,
        voz: "nina",
        texto: "A física estatística clássica aplicava a cada modo independente uma energia média proporcional à temperatura. Parecia razoável: em equilíbrio, os graus de liberdade deveriam compartilhar a energia. Mas o número de modos disponíveis crescia com o quadrado da frequência. Somar a contribuição de todos eles fazia a energia prevista aumentar sem limite no ultravioleta."
      },
      {
        at: 590.25,
        fim: 619.22,
        voz: "nina",
        texto: "Lia refez a soma. Não encontrou erro algébrico. O infinito aparecia porque as regras usadas diziam exatamente aquilo. Uma cavidade aquecida deveria despejar energia ilimitada nas frequências mais altas. Se a previsão fosse literal, uma fornalha comum seria uma catástrofe. O mundo real, claro, não fazia isso: a curva medida subia, atingia um máximo e caía rapidamente."
      },
      {
        at: 619.82,
        fim: 649.67,
        voz: "nina",
        texto: "A expressão associada a Rayleigh e Jeans descreve corretamente o regime de baixa frequência, onde hν é muito menor que kT. O problema surge quando se exige que essa aproximação clássica governe também as frequências altas. O nome ‘catástrofe ultravioleta’ seria popularizado depois; o fracasso não significava que toda a física clássica era inútil, apenas que seu domínio de validade tinha uma fronteira."
      },
      {
        at: 650.17,
        fim: 658.84,
        voz: "nina",
        texto: "— Uma teoria pode ser correta e ainda assim não ser universal — disse Tomás. — O erro começa quando esquecemos a condição sob a qual ela funciona."
      },
      {
        at: 659.74,
        fim: 679.28,
        voz: "nina",
        texto: "Lia encarou o infinito no quadro. Pela primeira vez, entendeu que uma crise científica nem sempre nasce de ignorância. Às vezes nasce de duas ideias excelentes, cada uma testada em seu território, que juntas conduzem a uma resposta que a natureza se recusa a dar."
      },
      {
        at: 680.68,
        fim: 705.15,
        voz: "teo",
        texto: "Nota científica. A lei clássica de Rayleigh–Jeans. A densidade espectral clássica cresce como ν²T. Ela é recuperada como limite de baixa frequência da lei de Planck, mas diverge quando ν tende ao infinito. O fracasso está na hipótese clássica de equipartição aplicada sem limite a todos os modos do campo."
      },
      {
        at: 706.75,
        fim: 712.34,
        voz: "nina",
        texto: "A curva que faltava. Dados novos obrigam uma velha convicção a negociar"
      },
      {
        at: 712.94,
        fim: 735.77,
        voz: "nina",
        texto: "O Arquivo mudou de estação. A cidade tornou-se Berlim, na virada para o século XX, mas ninguém nas ruas podia ver Lia ou Tomás. As cenas históricas do Arquivo eram reconstruções documentais: permitiam observar instrumentos e resultados, não inventar pensamentos privados para pessoas reais."
      },
      {
        at: 736.37,
        fim: 764.2,
        voz: "nina",
        texto: "Medições mais precisas no infravermelho distante mostravam que a distribuição de Wien se afastava dos dados em baixas frequências. Heinrich Rubens esteve entre os experimentalistas cujos resultados chegaram a Max Planck. Planck vinha trabalhando havia anos na termodinâmica da radiação e procurava uma relação entre energia, frequência e entropia que reproduzisse todo o espectro."
      },
      {
        at: 764.8,
        fim: 786.06,
        voz: "nina",
        texto: "No caderno de Lia, as duas margens do problema ficaram claras. A fórmula clássica sabia como a curva se comportava quando a frequência era baixa. A expressão de Wien conhecia o decaimento em alta frequência. Planck encontrou uma forma que fazia as duas emergirem como limites de uma mesma lei."
      },
      {
        at: 786.66,
        fim: 807.83,
        voz: "nina",
        texto: "Isso não foi apenas desenhar uma curva entre pontos. Uma interpolação pode ajustar dados sem revelar mecanismo algum. Planck queria derivar a distribuição a partir da termodinâmica e de uma contagem estatística. Para conseguir, precisou aceitar uma operação que contrariava sua preferência por processos contínuos."
      },
      {
        at: 808.43,
        fim: 828.39,
        voz: "nina",
        texto: "Tomás colocou duas tigelas sobre a mesa. Numa delas, areia podia ser distribuída grão por grão. Na outra, água parecia divisível sem fim. A pergunta de Planck, em linguagem moderna, era qual tipo de contagem tornaria possíveis os estados microscópicos da radiação em equilíbrio."
      },
      {
        at: 828.89,
        fim: 832.85,
        voz: "nina",
        texto: "— Ele sabia que estava fundando a mecânica quântica? — Lia perguntou."
      },
      {
        at: 833.75,
        fim: 845.29,
        voz: "nina",
        texto: "— Não. Descobertas não chegam com o nome do século seguinte. Ele estava tentando fazer a termodinâmica e os dados concordarem. O abalo veio do preço matemático dessa concordância."
      },
      {
        at: 846.69,
        fim: 868.74,
        voz: "teo",
        texto: "Nota científica. Interpolar não bastava. Planck apresentou primeiro uma forma espectral que concordava com os dados e depois buscou uma derivação. Seu programa ligava a energia média de osciladores materiais à entropia e à probabilidade estatística. A hipótese discreta entrou nessa segunda etapa."
      },
      {
        at: 870.34,
        fim: 877.67,
        voz: "nina",
        texto: "Uma lei com duas memórias. A nova fórmula não destruiu as antigas; explicou onde cada uma vivia"
      },
      {
        at: 878.27,
        fim: 893.98,
        voz: "nina",
        texto: "A equação apareceu sobre a cidade como uma ponte. De um lado, o território de Rayleigh e Jeans. Do outro, o território de Wien. No centro, uma constante pequena, h, controlava a passagem entre os dois."
      },
      {
        at: 894.58,
        fim: 931.14,
        voz: "nina",
        texto: "A lei de Planck para a densidade de energia por intervalo de frequência contém um numerador proporcional a hν³ e um denominador exponencial, exp(hν/kT)−1. Em baixa frequência, hν/kT é pequeno; expandir a exponencial recupera a expressão clássica. Em alta frequência, o denominador cresce rapidamente e suprime a energia, produzindo o comportamento de Wien. O infinito desaparece sem ser apagado à mão."
      },
      {
        at: 931.74,
        fim: 955.39,
        voz: "nina",
        texto: "Lia percorreu a ponte. Percebeu que uma teoria mais ampla costuma guardar as anteriores como aproximações. A mecânica clássica não se tornou falsa quando a relatividade e a física quântica nasceram. Continuou extraordinariamente precisa em regimes nos quais as novas constantes e escalas permitem simplificações."
      },
      {
        at: 955.99,
        fim: 978.08,
        voz: "nina",
        texto: "A lei também explicava por que aquecer um corpo aumenta muito a potência total emitida e desloca o espectro. Integrar a distribuição sobre todas as frequências recupera a lei de Stefan–Boltzmann, segundo a qual a potência por unidade de área de um corpo negro cresce como a quarta potência da temperatura absoluta."
      },
      {
        at: 978.58,
        fim: 982.11,
        voz: "nina",
        texto: "— Então h é um remendo? — perguntou Lia."
      },
      {
        at: 982.71,
        fim: 1000.67,
        voz: "nina",
        texto: "Tomás balançou a cabeça. — Um remendo desaparece quando encontramos tecido melhor. h continuou aparecendo: em átomos, elétrons, fótons, relógios e circuitos. Quando a mesma cicatriz atravessa toda a física, ela deixa de ser remendo. Torna-se costura."
      },
      {
        at: 1001.57,
        fim: 1016.42,
        voz: "nina",
        texto: "No caderno, Lia anotou a lição metodológica: uma boa lei nova não precisa humilhar as antigas. Precisa dizer por que elas funcionaram, onde falham e qual estrutura mais profunda contém ambas."
      },
      {
        at: 1017.82,
        fim: 1041.86,
        voz: "teo",
        texto: "Nota científica. A distribuição de Planck. A exponencial impede que os modos de frequência muito alta recebam a energia clássica kT. Para hν ≪ kT surge Rayleigh–Jeans; para hν ≫ kT surge a forma de Wien. A lei concorda com o espectro térmico em todo o domínio."
      },
      {
        at: 1043.46,
        fim: 1049.49,
        voz: "nina",
        texto: "Degraus que ninguém via. A energia entra na contagem em porções proporcionais à frequência"
      },
      {
        at: 1050.09,
        fim: 1067.07,
        voz: "nina",
        texto: "No último andar do Arquivo, a ponte virou escada. Os degraus próximos eram baixos; adiante, tornavam-se cada vez mais altos. Em cada um estava gravada uma frequência. Lia tentou parar entre dois degraus e o chão recusou seu pé."
      },
      {
        at: 1067.67,
        fim: 1093.05,
        voz: "nina",
        texto: "Na derivação de Planck, a energia total de osciladores de frequência ν foi dividida em elementos de tamanho ε=hν. Para contar quantas distribuições microscópicas correspondiam à mesma energia macroscópica, esses elementos eram tratados como unidades discretas. Quanto maior a frequência, maior o pacote elementar usado na contagem."
      },
      {
        at: 1093.65,
        fim: 1117.8,
        voz: "nina",
        texto: "Essa ideia resolve a catástrofe porque modos de frequência muito alta exigem um quantum grande comparado à energia térmica disponível. Eles não são preenchidos com a facilidade contínua pressuposta pela equipartição clássica. Não existe energia ilimitada escondida no ultravioleta; os degraus ali são caros demais para a temperatura da cavidade."
      },
      {
        at: 1118.4,
        fim: 1141.68,
        voz: "nina",
        texto: "Mas era cedo para imaginar pequenos projéteis luminosos atravessando o vazio. Planck aplicou a discretização aos osciladores materiais e às trocas de energia em seu modelo. Ele resistiu por anos à conclusão mais radical de que a própria luz livre se comportaria como unidades localizadas. Essa extensão seria a aposta de Einstein em 1905."
      },
      {
        at: 1142.28,
        fim: 1150.13,
        voz: "nina",
        texto: "Lia apagou do caderno o desenho que começara: bolinhas saindo da fornalha. Substituiu-o por uma escada junto à matéria."
      },
      {
        at: 1150.63,
        fim: 1160.81,
        voz: "nina",
        texto: "— Toda imagem cobra juros — disse Tomás. — Se você desenha cedo demais, passa o resto do caminho defendendo detalhes que a equação nunca prometeu."
      },
      {
        at: 1161.71,
        fim: 1183.66,
        voz: "nina",
        texto: "O quantum nasceu, portanto, com uma precisão e uma ambiguidade. A precisão era ε=hν. A ambiguidade era o que, exatamente, estava sendo quantizado na natureza. Resolver essa pergunta exigiria mais de duas décadas e criaria outras que ainda hoje alimentam a física."
      },
      {
        at: 1185.06,
        fim: 1218.88,
        voz: "teo",
        texto: "Nota científica. O primeiro quantum. Planck introduziu elementos de energia ε=hν na contagem estatística dos osciladores. É historicamente impreciso atribuir a ele, já em 1900–1901, a imagem moderna de fótons viajando como partículas livres. Essa hipótese localizada foi defendida por Einstein em 1905."
      },
      {
        at: 1220.48,
        fim: 1227.78,
        voz: "nina",
        texto: "Contar o invisível. Entropia transforma possibilidades microscópicas em uma lei macroscópica"
      },
      {
        at: 1228.38,
        fim: 1252.01,
        voz: "nina",
        texto: "A escada terminou numa biblioteca sem livros. Em seu lugar havia urnas, fichas e tabuleiros. Tomás colocou três fichas idênticas diante de quatro caixas e perguntou de quantas maneiras seria possível distribuí-las. Lia começou a enumerar possibilidades."
      },
      {
        at: 1252.61,
        fim: 1285.68,
        voz: "nina",
        texto: "A termodinâmica descreve grandezas como temperatura, energia e entropia sem acompanhar cada constituinte microscópico. A mecânica estatística constrói uma ponte: um mesmo estado macroscópico pode corresponder a muitas configurações microscópicas. A entropia cresce com o logaritmo do número de configurações compatíveis, expresso pela relação S=k ln W em sua forma consagrada por Planck a partir das ideias de Boltzmann."
      },
      {
        at: 1286.28,
        fim: 1309.94,
        voz: "nina",
        texto: "Para os osciladores da cavidade, Planck contou maneiras de distribuir P elementos de energia entre N osciladores. A hipótese de elementos discretos tornava a contagem definida. A partir dela, relacionou entropia e energia e obteve a energia média que leva à distribuição correta da radiação."
      },
      {
        at: 1310.54,
        fim: 1336.32,
        voz: "nina",
        texto: "Lia percebeu o movimento intelectual escondido na conta. O espectro visto pelo detector era uma curva suave. Por trás dele, a derivação usava números inteiros de elementos e uma contagem de possibilidades. O discreto não aparecia como serrilhas no gráfico; aparecia como a estrutura microscópica que produzia uma média contínua quando muitos eventos eram reunidos."
      },
      {
        at: 1336.82,
        fim: 1340.53,
        voz: "nina",
        texto: "— Se o gráfico é liso, os degraus ainda são reais? — ela perguntou."
      },
      {
        at: 1341.03,
        fim: 1357.23,
        voz: "nina",
        texto: "— Uma praia parece lisa de longe — respondeu Tomás. — Isso não transforma areia em água. Mas lembre-se: uma analogia não é evidência. A evidência está na lei quantitativa, na repetição experimental e nas novas previsões que sobrevivem."
      },
      {
        at: 1358.13,
        fim: 1372.86,
        voz: "nina",
        texto: "Lia registrou três níveis de linguagem: o que o instrumento mede, o modelo matemático que organiza os dados e a imagem mental usada para lembrar. Misturá-los era a maneira mais rápida de transformar física em lenda."
      },
      {
        at: 1374.26,
        fim: 1398.74,
        voz: "teo",
        texto: "Nota científica. Entropia e multiplicidade. W conta microestados compatíveis com um macroestado. O logaritmo torna aditivas as entropias de sistemas independentes. Na derivação de Planck, a discretização permite contar distribuições de energia e obter a energia média de cada frequência."
      },
      {
        at: 1400.34,
        fim: 1405.28,
        voz: "nina",
        texto: "A menor assinatura. Uma constante minúscula muda o tamanho do mundo"
      },
      {
        at: 1405.88,
        fim: 1419.15,
        voz: "nina",
        texto: "Ao amanhecer, a cidade do Arquivo apagou suas fornalhas. Restou no céu um símbolo: h. Lia esperava que Tomás anunciasse o menor pedaço de energia do universo, mas ele não fez isso."
      },
      {
        at: 1419.75,
        fim: 1451.87,
        voz: "nina",
        texto: "A constante de Planck não define um quantum universal de energia. O elemento hν depende da frequência. h tem unidade de ação — joule-segundo — e liga escalas de energia a escalas de frequência. Na formulação moderna, sua versão reduzida, ħ=h/2π, aparece em comutadores, momento angular, equações de evolução e limites de incerteza."
      },
      {
        at: 1452.47,
        fim: 1482.16,
        voz: "nina",
        texto: "Desde a redefinição do Sistema Internacional que entrou em vigor em 2019, h possui valor exato: 6,62607015×10⁻³⁴ J·s. O quilograma passou a ser definido de modo compatível com esse valor fixado. Uma constante nascida para explicar o brilho de uma cavidade tornou-se parte da infraestrutura metrológica do mundo."
      },
      {
        at: 1482.76,
        fim: 1509.54,
        voz: "nina",
        texto: "Seu valor é pequeno quando expresso em unidades humanas. Por isso os degraus quânticos de objetos cotidianos ficam esmagadoramente próximos e efeitos de fase se perdem depressa no contato com o ambiente. Pequeno, porém, não significa opcional. Em átomos e partículas, as combinações com h ou ħ estabelecem as escalas naturais do problema."
      },
      {
        at: 1510.14,
        fim: 1530.87,
        voz: "nina",
        texto: "Lia fechou o primeiro caderno. Agora sabia o que a crise da fornalha realmente ensinara. Não que ‘tudo é feito de pacotes’ de maneira vaga, mas que a distribuição térmica exigia uma estrutura discreta na troca e na contagem de energia, proporcional à frequência e governada por uma constante universal."
      },
      {
        at: 1531.47,
        fim: 1552.16,
        voz: "nina",
        texto: "A porta seguinte se abriu antes que Tomás tocasse nela. Do outro lado havia uma placa de metal recém-polida, duas lâmpadas e um amperímetro. Uma luz vermelha intensa atingia a placa sem arrancar elétron algum. Uma luz violeta quase fraca fez o ponteiro saltar."
      },
      {
        at: 1553.06,
        fim: 1560.23,
        voz: "nina",
        texto: "— A fornalha mostrou onde o contínuo falhava — disse Tomás. — Agora a luz vai ter de explicar como entrega energia."
      },
      {
        at: 1561.63,
        fim: 1584.62,
        voz: "teo",
        texto: "Nota científica. h não é um quantum fixo de energia. h é uma constante de proporcionalidade com dimensão de ação. A energia associada a uma frequência é hν; portanto, frequências diferentes correspondem a quanta de energia diferentes. O valor de h é exato no SI moderno."
      }
    ],
    paginas: {
      "1": 11.43,
      "2": 176.21,
      "3": 344.47,
      "4": 530,
      "5": 706.75,
      "6": 870.34,
      "7": 1043.46,
      "8": 1220.48,
      "9": 1400.34
    }
  }
];
