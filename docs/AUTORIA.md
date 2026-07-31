# Como escrever um módulo

Este documento existe para que escrever um módulo seja uma **unidade fechada**:
tudo que se precisa saber está aqui, no padrão-ouro e na linha do currículo.
Não é preciso ler os módulos já escritos.

Comece sempre por:

```bash
npm run content:status     # mostra o que está pronto e qual é o próximo
```

## O que ler (só isto)

1. Este arquivo.
2. `src/data/lessons/iniciante/bits-e-qubits.ts` — o padrão-ouro.
3. A linha do módulo em `src/data/curriculum.ts` (título, descrição, conceitos).
4. O arquivo que você vai escrever.

O estado do trabalho vive no repositório, não na memória de quem escreve:
`authoredModules` em `src/data/lessons/index.ts` calcula o que já existe.

## O que um módulo entrega

Três aulas em `src/data/lessons/<trilha>/<modulo>.ts`, exportando um
`Lesson[]`, mais o registro em `src/data/lessons/index.ts`.

### `teoria` — 8-12 min

Blocos de prosa, uma **metáfora com a demolição dela**, e um quiz de 3 a 5
perguntas.

A metáfora é o coração da aula. Toda imagem usada para explicar física quântica
é uma mentira útil, e o erro pedagógico comum é entregar a imagem e parar. A
compreensão nasce na quebra — por isso o bloco `metaphor` carrega um `circuit`
que o aluno **roda e vê falhar**. Não é uma afirmação sobre a metáfora falhar:
é o experimento que a derruba.

```ts
{ kind: "metaphor", image: "…", breaks: "…", circuit: doisH, caption: "…" }
```

### `experimento` — 10-14 min

Um `guided` com 4 a 6 passos. Cada passo tem instrução, circuito, revelação, e
quase sempre um **portão de previsão**.

O passo mais importante do roteiro é aquele em que o aluno **erra**. Escreva a
sequência para que a intuição clássica funcione nos primeiros passos (o aluno
acerta e ganha confiança) e quebre num passo específico e memorável. No módulo 1
esse passo é H·H devolvendo 100% em |0⟩: se H fosse sorteio, dois sorteios não
dariam certeza.

Instrumentos de previsão, por ordem de atrito:

- `choice` — escolher entre histogramas desenhados. Use nas primeiras aulas.
- `slider` — "quantos % em |1⟩?". Use quando o aluno já lê histograma.
- `bars` — arrastar as barras. Use só nas trilhas avançadas.

Pelo menos uma ramificação `branches` ("E se…?") por módulo.

### `desafio` — 8-12 min

Um `exercise` com asserções, `starterCode`, `solutionCode` e **três dicas em
escada**: as duas primeiras não podem entregar a resposta.

Prefira sempre corrigir por **estado** (`probabilities`, `amplitudes`) e não por
quais portas foram usadas. `usesGates` só como restrição pedagógica explícita
("resolva usando apenas H e Z"), nunca como verificação principal — existe mais
de um caminho certo, e reprovar quem achou outro é o jeito mais rápido de perder
o aluno.

Em `amplitudes`, deixe `upToGlobalPhase: true` salvo quando a fase global for
justamente o assunto: |ψ⟩ e e^{iθ}|ψ⟩ são o mesmo estado físico.

## Registro em português

- "porta", não "gate"; "emaranhamento", não "entrelaçamento"; "medição", não
  "medida"; "amplitude", não "amplitude de probabilidade" (é mais longo e não
  ajuda).
- Segunda pessoa direta: "você vai ver", não "o aluno verá".
- Frases curtas. Este assunto já é difícil sem sintaxe difícil.
- Nada de "simplesmente", "basta", "é fácil ver que". Se fosse fácil, não
  precisaria da aula.

## O que o motor suporta hoje

Portas: I, H, X, Y, Z, S, S†, T, T†, √X, √X†, P, U, RX, RY, RZ, CNOT, CY, CZ,
CH, CP, CRX, CRY, CRZ, CCX, CCZ, MCX, MCZ, SWAP, iSWAP, CSWAP, barreira,
medição. Até 16 qubits.

**Ainda não existe**: medição no meio do circuito, colapso, registradores
clássicos, portas condicionais, modelos de ruído, valores esperados. Os módulos
`teleportacao`, `correcao-erros`, `ruido` e `variacionais` dependem disso e só
podem ser escritos depois da Fase 2 do plano.

## Episódio de áudio

Um por módulo, em `audio/roteiros/<trilha>-<modulo>.json`. Formato de diálogo:
**Nina explica, Téo duvida**. Téo verbaliza o engano que o ouvinte cometeria —
é o mesmo laço de prever, errar e revisar do experimento guiado.

```bash
# 1. gerar o roteiro (revise a física antes de sintetizar)
node scripts/gerar-roteiro.mjs <trilha>/<modulo>

# 2. sintetizar
cd ../Dubla && .venv-tts/Scripts/python.exe -m dubla narrar \
  ../Quantical/audio/roteiros/<trilha>-<modulo>.json \
  --out ../Quantical/media/audio

# 3. importar para a camada de conteúdo
cd ../Quantical && npm run audio:import
```

Escreva o roteiro **para o ouvido**. Notação escrita passa por um dicionário de
fala (`dubla/fala.py`), mas ele é rede de segurança, não substituto: prefira
"ket zero" a "|0⟩" quando a frase for falada.

**A física de todo episódio é revisada à mão, sem exceção.** Erro em áudio é
pior que áudio nenhum — ninguém confere de ouvido, e quem escuta não tem como
perceber.

## Definição de pronto

```bash
npm test           # inclui a trava de conteúdo
npm run typecheck
npm run lint
npm run build
npm run test:e2e
./scripts/deploy.sh root@187.77.8.195
./scripts/deploy-audio.sh              # só o que mudou
```

A trava de conteúdo (`src/data/content.test.ts`) verifica cada módulo
isoladamente: a solução de referência precisa passar nas próprias asserções, o
código inicial precisa **falhar**, todo circuito precisa simular, toda
alternativa de quiz precisa de explicação, todo `glossaryRefs` precisa resolver.
Um módulo quebrado não passa no CI e não sobe.

Um commit por módulo, um deploy por módulo. Falha isolada, reversível.
