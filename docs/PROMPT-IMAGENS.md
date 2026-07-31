# Prompts de imagem para o ChatGPT

Documento de trabalho: copie os blocos daqui e cole no ChatGPT, um por vez.
As imagens voltam para `public/images/` com os nomes exatos indicados.

> A versão anterior deste arquivo era escrita para o Gemini/Nano Banana. Está
> no histórico do git (`git show 56df417:docs/PROMPT-IMAGENS.md`) caso queira
> comparar. Quatro coisas mudaram de verdade, e estão explicadas no fim.

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

## O que a ilustração nunca deve conter

O site já desenha, nativamente e em SVG, tudo isto — em qualidade melhor,
interativo e com os dados reais da simulação:

- diagramas de circuito
- histogramas e barras de probabilidade
- esferas de Bloch, setas de estado, eixos x/y/z

Pedir isso ao gerador produziria uma cópia pior de algo que já existe, e que
ficaria ao lado do original na mesma página.

E **nenhum texto dentro da imagem**: o site escreve as próprias legendas.

---

## Bloco de estilo — cole em TODA mensagem, antes da cena

O ChatGPT não carrega estilo de uma imagem para a outra com confiabilidade.
Este bloco vai junto **todas as vezes**, sem encurtar.

```
Gere esta imagem seguindo a descrição literalmente, sem enfeitar, sem
acrescentar elementos que eu não pedi e sem reinterpretar o estilo.

Formato: paisagem (1536x1024).

ILUSTRAÇÃO EDITORIAL para o miolo de um livro científico bem editado, ou uma
página de revista impressa. Desenho vetorial achatado: contornos finos e
firmes, formas simples e geométricas, sombra chapada em bloco de cor sólida.
Textura leve de serigrafia, com granulação sutil de papel e pequenos
desencontros de registro entre as cores, como impressão artesanal.

Superfícies foscas, iluminação neutra e uniforme, fundo claro de papel.

Use exatamente estas cinco cores e nenhuma outra:
  fundo    #f5f4ef  bege quente de papel, cobrindo a imagem inteira
  traço    #101d3c  azul-marinho profundo
  destaque #5d42cc  violeta
  apoio    #087d9d  azul-petróleo
  alerta   #9f481f  laranja queimado

Composição calma e confiante: um único assunto central, muito espaço vazio,
respiro generoso nas bordas.

A imagem é inteiramente silenciosa: nenhuma letra, número, palavra, fórmula ou
rótulo em lugar nenhum.

Evite: circuitos eletrônicos, gráficos, esferas com eixos, átomos com órbitas,
néon, brilho, degradês luminosos, fundo escuro.
```

---

## As seis ilustrações

Uma por módulo. O texto entre aspas é a metáfora exata que a aula apresenta.

### 1. `metafora-moeda-girando.png` — Do bit ao qubit

> "Pense numa moeda girando no ar. Enquanto gira, não faz sentido perguntar se
> ela é cara ou coroa; só quando ela cai é que existe um resultado."

```
Cena: uma única moeda girando no ar, vista de lado, no ponto mais alto do giro.
Arcos finos ao redor sugerem a rotação. A moeda está inclinada de modo que sua
face não seja visível — quem olha deve sentir que existe uma face ali, apenas
escondida pela velocidade.

Abaixo, uma superfície de mesa insinuada por uma única linha horizontal.
Nenhuma pessoa, nenhuma mão.

Moeda em violeta, arcos de movimento em azul-petróleo, linha da mesa em
azul-marinho.
```

*Por que assim:* o aluno precisa sair achando que o valor já existe e só está
oculto. É esse engano que o experimento H·H derruba em seguida.

### 2. `metafora-meio-a-meio.png` — Superposição

> "Superposição é meio a meio. Um qubit em superposição é aquele que tem
> cinquenta por cento de chance de dar cada resultado."

```
Cena: duas jarras de vidro idênticas lado a lado, cada uma cheia exatamente até
a metade. Mesmo formato, mesmo nível, mesma cor — visualmente indistinguíveis.

Uma única diferença, discreta o bastante para só se notar de perto: a
superfície do líquido está inclinada para a esquerda numa jarra e para a
direita na outra.

Contorno das jarras em azul-marinho, líquido em violeta, a linha inclinada da
superfície em laranja queimado.
```

*Por que assim:* o módulo derruba a ideia de que dois estados com o mesmo
histograma são o mesmo estado. A imagem mostra dois recipientes que qualquer
medição diria serem iguais.

### 3. `metafora-envelope-lacrado.png` — Medição

> "Medir é ler o valor guardado. O qubit tem um estado, a medição revela esse
> estado, e pronto — como consultar uma variável."

```
Cena: um envelope de papel visto de cima, com o lacre já rompido e uma ficha
lisa saindo pela metade de dentro dele. A ficha é completamente em branco.

O clima é de recuperação tranquila: a informação estava guardada ali o tempo
todo e alguém apenas foi buscá-la. Sem tensão, sem drama, sem movimento.

Envelope em azul-petróleo, ficha em bege de papel com contorno azul-marinho,
lacre rompido em laranja queimado.
```

*Por que assim:* a aula mostra que medir não é ler — é interagir, e a
interação muda o que está lá. A ilustração vende a versão inocente.

### 4. `metafora-dois-botoes.png` — Portas quânticas

> "Aplicar portas é como somar operações numa calculadora: o que importa é o
> conjunto, não a ordem."

```
Cena: dois botões giratórios de painel, lado a lado, do tipo encontrado em
aparelho de som antigo. Cada botão tem um traço marcando sua posição. Duas mãos
reduzidas a contorno geométrico simples giram os dois ao mesmo tempo.

A composição deve sugerir simultaneidade: nada indica qual foi girado primeiro,
e nada sugere que isso faça diferença.

Botões em azul-marinho, traços de posição em laranja queimado, mãos em contorno
violeta.
```

*Por que assim:* o experimento mostra que trocar a ordem de duas rotações dá
estados diferentes. A imagem precisa fazer a ordem parecer irrelevante.

### 5. `metafora-envelopes-gemeos.png` — Emaranhamento

> "É como preparar duas moedas idênticas, selar cada uma num envelope e mandar
> para lados opostos do mundo. Quando alguém abre, as duas mostram a mesma face
> — porque já eram iguais desde o começo."

```
Cena: dois envelopes lacrados idênticos afastando-se um do outro na horizontal,
cada um rumo a uma borda da imagem, com um rastro tracejado marcando o caminho
já percorrido. Entre eles, muito espaço vazio no centro.

Dentro de cada envelope, bem discreto, o contorno de uma moeda idêntica à
outra, sugerindo que o conteúdo já estava decidido antes da partida.

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
Cena: uma pessoa reduzida a contorno geométrico simples, sentada, lendo dois
livros abertos ao mesmo tempo, um em cada mão, com o olhar dividido entre os
dois. A postura é confortável e natural, como se ler duas coisas de uma vez
fosse trivial.

Livros em violeta e azul-petróleo, figura em contorno azul-marinho.
```

*Por que assim:* o algoritmo de Deutsch responde uma pergunta sobre as duas
entradas com **uma** consulta — e não entrega as duas respostas. A imagem
vende a versão ingênua do paralelismo.

---

## Imagem de compartilhamento

O site declara `twitter:card = summary_large_image` e não tem imagem nenhuma:
**todo link compartilhado hoje sai em branco.**

### `og-quantical.png`

```
[bloco de estilo, mantendo o formato paisagem 1536x1024]

Cena: uma moeda em violeta girando no ar, deslocada para a DIREITA da
composição, com arcos finos de movimento em azul-petróleo. Todo o terço
esquerdo permanece completamente vazio, só o bege do papel.

Composição horizontal e ampla, com muito respiro.
```

O corte final para 1200×630 é mais achatado que o 3:2 que sai do ChatGPT, e
eu corto no meio na hora de integrar — por isso a instrução de manter o
assunto longe das bordas de cima e de baixo.

---

## Como rodar

Uma imagem por mensagem, sempre com o bloco de estilo junto.

1. Comece pela **moeda girando** e itere até o traço ficar bom.
2. Para as seguintes, na **mesma conversa**, cole o bloco de estilo + a cena
   nova e acrescente: *"No mesmo estilo, traço e paleta da imagem anterior."*
3. Se o estilo escorregar mesmo assim, comece conversa nova colando o bloco de
   estilo com a imagem aprovada anexada.
4. Para corrigir sem recomeçar: *"Mantenha exatamente esta imagem e mude só
   ___."*

## Ao entregar

- **PNG**, na resolução que sair.
- Nomes de arquivo **exatamente** como indicado.
- Em `public/images/`.

Quando estiverem lá, eu ligo cada uma ao card de metáfora da aula
correspondente (campo novo `ilustracao` no bloco `metaphor`), com `alt`
descritivo escrito por mim, `loading="lazy"` e conversão para WebP — e o teste
de conteúdo passa a exigir que todo arquivo referenciado exista, do mesmo jeito
que já exige para os episódios de áudio.

---

## O que mudou em relação à versão do Gemini

Não foi troca de nome. Quatro diferenças de comportamento entre os dois:

**1. Proporção.** O Gemini aceita 4:3 direto. O ChatGPT gera em três formatos
apenas — quadrado, retrato (1024×1536) e paisagem (1536×1024). Todos os
pedidos passaram para **paisagem 3:2**, que é o que ele realmente entrega. Uma
imagem pedida em 4:3 voltaria em outro formato sem aviso.

**2. Lista de proibições.** O Gemini lida bem com uma lista longa de "não
faça". Modelos da linha do ChatGPT tendem a **invocar o que a negativa
menciona** — pedir "sem esferas azuis brilhantes" aumenta a chance de vir uma.
Por isso o bloco agora descreve afirmativamente o que se quer ("superfícies
foscas, iluminação neutra, fundo claro de papel") e deixa só uma linha curta de
"evite" no fim.

**3. Reescrita do pedido.** O ChatGPT costuma reescrever e enfeitar o prompt
antes de gerar. O bloco começa mandando seguir a descrição literalmente e não
acrescentar elementos.

**4. Consistência entre as seis.** O Nano Banana mantém estilo anexando a
imagem aprovada. No ChatGPT isso é menos confiável, então o bloco de estilo
inteiro vai em **toda** mensagem, e o pedido de "mesmo estilo da anterior"
entra como reforço, não como mecanismo principal.
