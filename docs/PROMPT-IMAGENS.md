# Prompts de imagem para o Gemini (Nano Banana)

Documento de trabalho: copie os blocos daqui e cole no Gemini. As imagens
voltam para `public/images/` com os nomes exatos indicados em cada prompt.

---

## A decisão que governa tudo

**A ilustração não explica o conceito certo. Ela desenha a intuição errada.**

Cada módulo do Quantical é construído em torno de uma imagem mental que
seduz e depois quebra. O card de metáfora já tem dois lados: *"a imagem que
costumam usar"* e *"onde ela quebra"* — e o lado da quebra traz um circuito
que o aluno roda e vê falhar.

A ilustração entra **só do lado da metáfora**. Ela precisa deixar a intuição
errada bonita, convincente, quase óbvia — porque o trabalho dela é fazer o
aluno se reconhecer ali. Quem demole é o simulador, logo abaixo. Ilustrar a
demolição enfraqueceria as duas coisas: a metáfora ficaria menos tentadora e
a quebra viraria alegação em vez de prova.

Isso muda o que se pede ao modelo, e é a instrução mais importante de todas.

## O que a ilustração NUNCA deve conter

O site já desenha, nativamente e em SVG, tudo isto — em qualidade melhor,
interativo e com os dados reais da simulação:

- diagramas de circuito
- histogramas e barras de probabilidade
- esferas de Bloch, setas de estado, eixos x/y/z

Pedir isso ao gerador produziria uma cópia pior de algo que já existe, e que
ficaria ao lado do original na mesma página. **Nada de circuitos, gráficos ou
esferas.**

E **nenhum texto, letra, número, fórmula ou rótulo dentro da imagem.**
Geradores erram texto, erram mais ainda em português, e o site já escreve as
legendas por conta própria.

---

## Bloco de estilo — cole SEMPRE, antes de cada prompt

```
Ilustração editorial para uma plataforma brasileira de ensino de computação
quântica. Estilo de ilustração de miolo de livro científico bem editado ou
página de revista impressa — não infográfico, não render 3D, não arte digital
de ficção científica.

Traço: desenho vetorial achatado, contornos finos e firmes, formas simples e
geométricas. Textura sutil de serigrafia ou risografia, com leve granulação de
papel e pequenos desencontros de registro entre as cores. Sombra chapada, sem
degradê realista.

Paleta ESTRITA, apenas estas cores:
  fundo   #f5f4ef  (bege quente de papel)
  traço   #101d3c  (azul-marinho profundo, quase preto)
  destaque #5d42cc (violeta)
  apoio   #087d9d  (azul-petróleo)
  alerta  #9f481f  (laranja queimado)
Nenhuma outra cor. Sem branco puro, sem preto puro.

Composição: muito espaço vazio, um único assunto central, respiro generoso nas
bordas. Calmo e confiante, nunca poluído.

PROIBIDO: qualquer texto, letra, número ou fórmula. Circuitos, gráficos de
barras, esferas de Bloch, eixos, setas de coordenadas. Clichês de "quântico":
esferas azuis brilhantes, néon, brilho de lente, placas de circuito impresso,
átomos com elétrons em órbita, globos de arame, chuva de dígitos binários,
partículas cintilantes, fundo escuro espacial.

Formato: 4:3, na maior resolução disponível. Fundo sólido #f5f4ef ocupando
toda a imagem, sem transparência.
```

---

## As seis ilustrações

Uma por módulo. O texto entre aspas é a metáfora exata que a aula apresenta —
está no arquivo da aula, e a ilustração precisa casar com ela.

### 1. `metafora-moeda-girando.png` — Do bit ao qubit

> "Pense numa moeda girando no ar. Enquanto gira, não faz sentido perguntar se
> ela é cara ou coroa; só quando ela cai é que existe um resultado."

```
Uma única moeda girando no ar, vista de lado, no ponto mais alto do giro.
Rastros de movimento em arco sugerem a rotação. A face da moeda está inclinada
o bastante para não se ver o que há nela — a imagem precisa fazer o observador
sentir que existe uma face ali, só escondida pela velocidade.

Abaixo, uma superfície de mesa apenas insinuada por uma linha. Nenhuma mão,
nenhuma pessoa. A moeda em violeta, os rastros em azul-petróleo, a linha da
mesa em azul-marinho.
```

*Por que assim:* o aluno precisa sair achando que o valor já existe e só está
oculto. É esse engano que o experimento H·H derruba em seguida.

### 2. `metafora-meio-a-meio.png` — Superposição

> "Superposição é meio a meio. Um qubit em superposição é aquele que tem
> cinquenta por cento de chance de dar cada resultado."

```
Duas jarras de vidro idênticas, lado a lado, cada uma cheia exatamente até a
metade com um líquido. As duas são visualmente indistinguíveis: mesmo formato,
mesmo nível, mesma cor.

Entre elas, uma pequena diferença que só se nota ao olhar de perto — a
inclinação da superfície do líquido é oposta em cada jarra, uma pendendo para
a esquerda e a outra para a direita. Nada mais as separa.

Jarras em contorno azul-marinho, líquido em violeta, a superfície inclinada
marcada em laranja queimado.
```

*Por que assim:* o módulo derruba exatamente a ideia de que dois estados com o
mesmo histograma são o mesmo estado. A imagem precisa mostrar dois recipientes
que qualquer medição diria serem iguais.

### 3. `metafora-envelope-lacrado.png` — Medição

> "Medir é ler o valor guardado. O qubit tem um estado, a medição revela esse
> estado, e pronto — como consultar uma variável."

```
Um envelope de papel sendo aberto, visto de cima, com o lacre já rompido e uma
ficha saindo de dentro pela metade. A ficha é lisa, sem nada escrito.

A cena precisa transmitir recuperação tranquila: a informação estava guardada
ali dentro o tempo todo e alguém apenas foi buscá-la. Sem tensão, sem drama.

Envelope em azul-petróleo, ficha em bege claro com contorno azul-marinho, o
lacre rompido em laranja queimado.
```

*Por que assim:* a aula mostra que medir não é ler — é interagir, e a
interação muda o que está lá. A ilustração vende a versão inocente.

### 4. `metafora-dois-botoes.png` — Portas quânticas

> "Aplicar portas é como somar operações numa calculadora: o que importa é o
> conjunto, não a ordem."

```
Dois botões giratórios de painel, lado a lado, do tipo de aparelho de som
antigo. Cada um tem uma marca indicando a posição atual. Duas mãos estilizadas,
reduzidas a contornos simples, giram os dois botões ao mesmo tempo.

A composição precisa sugerir simultaneidade e indiferença à ordem: nada indica
qual veio primeiro, e nada sugere que isso importe.

Botões em azul-marinho com marcas em laranja queimado, mãos em contorno
violeta.
```

*Por que assim:* o experimento mostra que trocar a ordem de duas rotações dá
estados diferentes. A imagem precisa fazer a ordem parecer irrelevante.

### 5. `metafora-envelopes-gemeos.png` — Emaranhamento

> "É como preparar duas moedas idênticas, selar cada uma num envelope e mandar
> para lados opostos do mundo. Quando alguém abre, as duas mostram a mesma face
> — porque já eram iguais desde o começo."

```
Dois envelopes lacrados idênticos afastando-se um do outro na horizontal, cada
um para uma borda da imagem, com um rastro tracejado marcando o caminho
percorrido. Entre eles, muito espaço vazio.

Ao fundo, bem discreto, o contorno de duas moedas idênticas dentro dos
envelopes, sugerindo que o conteúdo já estava decidido antes da partida.

Envelopes em azul-petróleo, rastros tracejados em violeta, moedas insinuadas em
laranja queimado bem claro.
```

*Por que assim:* esta é a intuição errada mais teimosa do curso — a de que o
resultado já estava combinado. A aula prova que uma correlação clássica não
explica o que os qubits fazem em outra base.

### 6. `metafora-duas-leituras.png` — Primeiro circuito completo

> "O computador quântico é rápido porque testa as duas entradas ao mesmo tempo
> e depois lê as duas respostas de uma vez."

```
Uma pessoa reduzida a contorno geométrico simples, sentada, lendo dois livros
abertos ao mesmo tempo, um em cada mão, com os olhos voltados para os dois.
A postura é confortável e natural, como se ler duas coisas de uma vez fosse
trivial.

Livros em violeta e azul-petróleo, figura em contorno azul-marinho.
```

*Por que assim:* o algoritmo de Deutsch responde uma pergunta sobre as duas
entradas com **uma** consulta — e não entrega as duas respostas. A imagem
precisa vender a versão ingênua do paralelismo.

---

## Imagem de compartilhamento

O site declara `twitter:card = summary_large_image` e não tem imagem nenhuma:
**todo link compartilhado hoje sai em branco.**

### `og-quantical.png` — 1200×630 (proporção 16:9)

```
[cole o bloco de estilo acima, trocando o formato para 1200x630]

Uma moeda em violeta girando no ar, deslocada para a direita da composição,
com rastros de movimento em arco. Todo o lado esquerdo permanece vazio, em
bege de papel, reservado para texto que será sobreposto depois.

Nada de texto na imagem. Composição horizontal, ampla, com muito respiro.
```

---

## Como manter as seis parecidas entre si

Nano Banana mantém estilo por conversa, não por acaso:

1. Gere a **moeda girando** primeiro e itere até gostar do traço.
2. Nas seguintes, **anexe a imagem aprovada** e peça:
   *"Mesma técnica, mesma paleta, mesmo peso de traço e mesma granulação desta
   imagem. Novo assunto: [prompt seguinte]."*
3. Se o estilo escorregar, volte a colar o bloco de estilo inteiro.
4. Para ajustar sem recomeçar: *"Mantenha tudo, mude só ___."*

## Ao entregar

- Formato **PNG**, maior resolução que sair (eu converto para WebP no build).
- Nomes de arquivo **exatamente** como indicado acima.
- Coloque em `public/images/`.

Quando estiverem lá, eu ligo cada uma ao card de metáfora da aula
correspondente (campo novo `ilustracao` no bloco `metaphor`), com `alt`
descritivo escrito por mim, `loading="lazy"` e a conversão para WebP — e o
teste de conteúdo passa a exigir que todo arquivo referenciado exista, do
mesmo jeito que já exige para os episódios de áudio.
