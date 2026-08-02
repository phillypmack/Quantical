# Shorts verticais — computação quântica

Roteiros prontos e o material para alimentar o NotebookLM.

> Não consigo operar o NotebookLM por você: ele exige sessão Google
> autenticada e eu não tenho navegador. O que está aqui é a parte que decide
> se o vídeo retém — o roteiro — mais as instruções para colar lá.

---

## A tese

Quase todo canal de quântica ensina o conceito certo. Isso não retém: o
espectador não sabe que não sabe, então não sente falta.

O que retém é **atacar uma crença que a pessoa já tem**. Ela reconhece a
frase, sente o incômodo, e precisa ver como termina.

Este projeto tem 13 dessas crenças catalogadas em `src/data/equivocos.ts`,
cada uma com o experimento que a derruba — e o experimento **roda no
navegador**. Isso significa que a prova aparece na tela em vez de ser uma
afirmação com música épica. É a diferença entre "confie em mim" e "olha".

---

## As regras que valem para todos

**Os 2 primeiros segundos.** Sem "fala galera", sem logo, sem "hoje eu vou
te explicar". O primeiro som é a crença errada dita com convicção — de
preferência do jeito que a pessoa diria.

**Texto na tela desde o frame 1.** A maioria assiste sem som. Se o gancho só
existe no áudio, ele não existe.

**Uma ideia por vídeo.** Duas ideias viram zero.

**A virada entre 40% e 60%.** Antes disso o espectador não investiu; depois,
já saiu.

**A prova tem que ser visível.** Nada de "cientistas provaram". Mostre o
circuito rodando, o histograma mudando, o número na tela.

**Termine com uma frase repetível.** O que faz compartilhar é a pessoa querer
falar aquilo para alguém.

**CTA discreto.** Um card no fim: `quantical.com.br · roda no navegador, de
graça`. Nunca peça like — pedir custa retenção e o algoritmo mede retenção.

---

## Os roteiros

Ordenados por tamanho da crença. Comece pelo 1: é o mito mais repetido do
assunto no mundo.

### 1 · "Computador quântico testa tudo ao mesmo tempo"

**Gancho (0–2s)** — texto grande, voz firme:
> "Computador quântico testa todas as respostas ao mesmo tempo."

**Virada (2–5s):**
> Essa frase está em quase todo vídeo sobre o assunto. E ela está errada.

**Prova (5–28s)** — tela do laboratório, circuito rodando:
> Sim, ele coloca todas as entradas em superposição. O problema é o que
> acontece depois.
>
> Quando você mede, sai **uma** resposta. Uma só. Todas as outras somem.
>
> Se fosse só isso, o computador quântico seria um sorteio caro.
>
> O que ele faz de verdade é diferente: monta o circuito para as respostas
> erradas se **cancelarem** antes da medição. Não é procurar mais rápido —
> é fazer o errado sumir.

**Fecho (28–35s):**
> Ele não te dá todas as respostas. Ele te dá **uma resposta sobre todas as
> entradas**. É por isso que é difícil programar: você precisa achar a
> pergunta certa.

**Legenda:** Quase todo vídeo sobre computação quântica repete essa frase. Ela
está errada — e o erro é a parte interessante.

---

### 2 · "Emaranhamento manda informação instantânea"

**Gancho (0–2s):**
> "Mexeu num qubit aqui, o outro muda na hora do outro lado da galáxia."

**Virada (2–6s):**
> Verdade. E mesmo assim é impossível mandar uma mensagem com isso.

**Prova (6–28s):**
> Você mede o seu e dá zero. Agora sabe que o do outro lado deu um.
>
> Só que você **não escolheu** que desse zero. Foi sorteio.
>
> E do lado de lá? Ele vê um resultado aleatório. Sempre. Não importa o que
> você faça.
>
> A correlação só aparece quando os dois **comparam** os resultados. E
> comparar exige um telefonema. Que viaja na velocidade da luz.

**Fecho (28–36s):**
> A informação está lá. Você só não tem como escolher qual. E sem escolha,
> não existe mensagem.

**Legenda:** É real, é instantâneo, e ainda assim não quebra a relatividade.
O motivo é mais elegante do que parece.

---

### 3 · "Superposição é a moeda girando no ar"

**Gancho (0–3s)** — moeda girando:
> "Enquanto gira, não é cara nem coroa. Isso é superposição."

**Virada (3–6s):**
> Essa imagem funciona por uns dez minutos. Depois ela quebra — e dá para
> ver na tela.

**Prova (6–26s)** — circuito H·H rodando:
> Uma porta Hadamard deixa o qubit meio a meio. Se fosse sorteio, aplicar
> **duas** deixaria ainda mais embaralhado.
>
> Roda: **cem por cento no zero.** Certeza absoluta.
>
> Dois sorteios seguidos nunca dão certeza. Nenhuma moeda se desgira.

**Fecho (26–34s):**
> Hadamard não sorteia. Ela **gira**. E girar duas vezes volta ao começo.
> O acaso não está no qubit — ele nasce na medição.

**Legenda:** A moeda girando é a metáfora mais usada para superposição. Este
circuito de duas portas mostra onde ela morre.

---

### 4 · "É a consciência que colapsa a função de onda"

**Gancho (0–3s):**
> "O universo só decide quando alguém observa."

**Virada (3–7s):**
> Essa frase vendeu muito livro de autoajuda. E ela confunde duas palavras.

**Prova (7–28s):**
> "Observar", em física, não é olhar. É **interagir**.
>
> Um detector interage. Uma parede interage. Um fóton que bate no elétron
> interage. Nenhum deles tem consciência.
>
> Se você deixar o experimento rodando num laboratório trancado, sem
> ninguém, e ler o resultado amanhã — o padrão já está lá.
>
> A interação aconteceu quando aconteceu. Não quando alguém olhou.

**Fecho (28–36s):**
> Medir não é ver. É tocar. E tocar muda a coisa tocada — o que é bem menos
> místico e bem mais interessante.

**Legenda:** A física nunca disse que a consciência cria a realidade. Ela disse
que medir é interagir. Alguém traduziu errado e virou indústria.

---

### 5 · "Mesmo gráfico, mesmo estado"

**Gancho (0–3s)** — dois histogramas idênticos lado a lado:
> "Esses dois qubits são idênticos. Cinquenta por cento cada."

**Virada (3–6s):**
> Mesmo gráfico. Estados diferentes. E dá para provar em uma porta.

**Prova (6–26s):**
> Este é o |+⟩. Este é o |−⟩. Medidos, dão o mesmo resultado — meio a meio,
> sempre.
>
> Agora aplico a mesma porta nos dois.
>
> Um vira **cem por cento zero**. O outro vira **cem por cento um**.
>
> Mesma porta. Mesmo gráfico antes. Resultados opostos.

**Fecho (26–34s):**
> A diferença era um **sinal de menos** que o gráfico não mostra. Probabilidade
> não é o estado — é só uma foto dele, de um ângulo.

**Legenda:** Dois estados com histogramas idênticos que se comportam de forma
oposta. O que os separa não aparece em gráfico nenhum.

---

### 6 · "A ordem das portas não importa"

**Gancho (0–3s):**
> "Girar um pouco para a direita e um pouco para cima. Tanto faz a ordem."

**Virada (3–6s):**
> No plano, tanto faz. No espaço, não. E o qubit vive no espaço.

**Prova (6–24s)** — esfera de Bloch, duas sequências:
> Roda X, depois roda Y. O qubit termina **aqui**.
>
> Agora inverte: Y primeiro, X depois. Termina **aqui**.
>
> Mesmas portas. Mesmos ângulos. Lugares diferentes.

**Fecho (24–32s):**
> Por isso um algoritmo quântico é uma **sequência**, não uma lista. Trocar
> dois passos de lugar não é reorganizar — é escrever outro programa.

**Legenda:** Teste você mesmo com um celular: gire 90° para frente e depois
90° para a direita. Agora inverta a ordem. A tela aponta para lados diferentes.

---

### 7 · "Emaranhamento é um par preparado igual"

**Gancho (0–3s)** — dois envelopes lacrados:
> "Duas moedas iguais em dois envelopes. Abriu um, sabe o outro. Isso é
> emaranhamento."

**Virada (3–7s):**
> É uma explicação boa. Ela sobrevive a **um** teste e morre no segundo.

**Prova (7–28s):**
> Com envelopes, o conteúdo já estava decidido na hora de fechar.
>
> Meça os dois qubits do mesmo jeito: o resultado é igual. Envelope explica.
>
> Agora meça em **outra direção**. Os envelopes previam bagunça. Os qubits
> continuam combinando.
>
> Nenhum par preparado de antemão consegue isso. Foi medido em laboratório,
> e rendeu um Nobel em 2022.

**Fecho (28–36s):**
> O resultado não estava escrito no envelope. Ele nasce na hora — e mesmo
> assim os dois concordam.

**Legenda:** A analogia dos envelopes é a melhor explicação errada que existe.
O teste que a derruba levou 50 anos para ser feito.

---

### 8 · "|0⟩ é matemática difícil"

**Gancho (0–2s)** — o símbolo sozinho, tela cheia:
> "Você trava quando vê isso?"

**Virada (2–5s):**
> Isso não é conta. É uma **caixa**. E leva quinze segundos.

**Prova (5–25s):**
> Lê-se "ket zero".
>
> A barra e o bico não fazem nada. São só uma caixa em volta do valor,
> avisando: **o que está aqui dentro é um estado quântico, não um número
> comum**.
>
> Sem ela, `0` seria ambíguo — o número zero ou o estado zero?
>
> É só isso. `|1⟩` é ket um. `|+⟩` é ket mais, o meio a meio.

**Fecho (25–32s):**
> Metade do medo de quântica é notação que ninguém te ensinou a **pronunciar**.
> Não é inteligência. É vocabulário.

**Legenda:** Ninguém consegue pensar sobre um símbolo que não sabe falar. Este
leva quinze segundos.

---

## Como usar no NotebookLM

**1. Suba as fontes.** O NotebookLM gera a partir do que você der. Suba:

- `docs/SHORTS.md` (este arquivo — é o roteiro)
- `src/data/equivocos.ts` (os 13 equívocos, com a explicação de cada um)
- As páginas do livro em https://quantical.com.br/livro (fonte por URL)
- https://quantical.com.br/notacao (para o vídeo 8)

**2. Peça o vídeo com esta instrução:**

```
Crie um vídeo vertical (9:16) de 35 segundos a partir do roteiro "[número e
título]" da fonte SHORTS.md.

Siga o roteiro LITERALMENTE, na ordem em que está escrito. Não acrescente
introdução, não se apresente, não resuma antes de começar. O primeiro segundo
já é a primeira fala do roteiro.

Português do Brasil, tom de conversa direta, sem entusiasmo forçado.

Texto grande na tela acompanhando a fala — a maioria assiste sem som.

Visual: ilustração editorial achatada, fundo bege claro, traço azul-marinho,
destaque violeta. Sem néon, sem partículas brilhantes, sem fundo espacial,
sem átomo com elétrons em órbita.

Termine com um card estático: "quantical.com.br"
```

**3. O que conferir antes de postar:** se a ferramenta inseriu uma introdução
("Hoje vamos falar sobre…"), corte os primeiros segundos. É o defeito mais
comum de vídeo gerado, e ele mata a retenção sozinho.

---

## Publicação

**Ordem sugerida:** 1, 2, 3, 4 primeiro — são as crenças mais difundidas.
Guarde o 8 (notação) para quando houver público: ele converte melhor do que
alcança.

**Um por dia**, no mesmo horário. Consistência importa mais que volume.

**Legendas:** use as que estão em cada roteiro. Elas são escritas para
provocar comentário — e comentário é o sinal mais forte que existe.

**Hashtags:** `#computacaoquantica #fisica #tecnologia #cienciabrasil
#programacao` — cinco bastam; mais que isso dilui.

**Responda os "mas na verdade…"** nos comentários. Este assunto atrai gente
que sabe, e responder bem transforma o comentário crítico em prova social.
Todo roteiro aqui é fisicamente correto — dá para defender cada frase.

**Reaproveite:** cada short vira post de carrossel, e o conjunto vira um vídeo
longo "os 8 erros que todo mundo comete sobre computação quântica".
