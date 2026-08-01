# Prompt para o ChatGPT terminar o audiolivro

Cole o bloco abaixo. Ele é autossuficiente: descreve o que existe, o que falta,
as armadilhas já pagas e o laço de verificação por transcrição reversa.

---

```
Você vai terminar de gerar um audiolivro em português e verificar cada trecho
transcrevendo o áudio de volta para texto. O trabalho está pela metade e o
ambiente já está montado — leia o estado antes de mexer em qualquer coisa.

## Onde está tudo

Ferramenta de TTS:   C:\Users\felip\Documents\Dubla
Site:                C:\Users\felip\Documents\Quantical
Python do projeto:   C:\Users\felip\Documents\Dubla\.venv\Scripts\python.exe

Dentro da Dubla:
  work/livro/roteiros/livro-ch01..24.json   24 roteiros prontos
  work/livro/audio/                          mp3 + transcrição por capítulo
  work/livro/cache/                          um .wav por fala, nome = SHA-256
  work/livro/sintese.log                     log da última execução
  dubla/fala.py                              dicionário de notação -> fala
  dubla/narrar.py                            síntese, cache e mixagem
  dubla/vozes.py                             Nina (narra) e Téo (notas)
  docs/ONDE-SINTETIZAR.md                    medições de CPU/GPU/NPU

## Estado atual

Capítulos 1 a 4 prontos. O 5 parou na fala 21 de 82. Faltam 20 capítulos,
cerca de 8,5 horas de áudio.

O cache é por fala, com chave no hash do texto convertido. Matar o processo e
rodar de novo continua de onde parou, sem ressintetizar nada. NÃO apague o
cache.

Comando que estava rodando:

  cd C:\Users\felip\Documents\Dubla
  $env:PYTHONIOENCODING="utf-8"
  .\.venv\Scripts\python.exe -m dubla narrar (Get-ChildItem work\livro\roteiros\livro-ch*.json).FullName `
    --out work\livro\audio --cache work\livro\cache --device xpu

## Sua tarefa

1. Implementar as pausas de narração (seção própria abaixo) e gerar UM
   capítulo com elas. Ouvir antes de seguir.
2. Retomar a síntese dos 20 capítulos restantes.
3. Depois de CADA capítulo, verificar todos os trechos dele por transcrição
   reversa (detalhado abaixo).
4. Ressintetizar os trechos reprovados e verificar de novo.
5. Ao final de cada capítulo aprovado, no diretório do site:
     node scripts/import-audiolivro.mjs
     npm run build
     bash scripts/deploy.sh
     cp <mp3 novos> media/audio/livro/
     bash scripts/deploy-audio.sh root@187.77.8.195 livro media/audio/livro

## O laço de verificação — leia inteiro antes de implementar

Um narrador sintético erra de maneiras que não aparecem no texto de entrada:
lê pontuação em voz alta, corta a frase no meio, repete um trecho em loop, ou
produz silêncio. O jeito de pegar isso sem ouvir dez horas é transcrever o
áudio gerado de volta e comparar com o que deveria ter sido dito.

Instale o transcritor (não está no ambiente):

  .\.venv\Scripts\python.exe -m pip install faster-whisper

Use o modelo `small` com `language="pt"`. Ele basta: o objetivo não é produzir
uma transcrição publicável, é detectar defeito. Modelos maiores custam tempo
sem melhorar a detecção.

### NÃO compare os textos por igualdade

Transcrição nunca reproduz a entrada literalmente. O Whisper normaliza
números, reescreve pontuação e ajusta maiúsculas. Comparação literal
reprovaria praticamente tudo e você concluiria, errado, que a síntese está
quebrada.

Compare procurando ASSINATURAS DE FALHA. São cinco:

**1. Pontuação verbalizada** — o defeito que motivou este trabalho.
O áudio diz "ponto, ponto, ponto" onde o texto tinha reticências.

A armadilha: "ponto" é palavra legítima em português ("ponto de partida",
"até certo ponto"). Procurar a palavra solta gera falso positivo em massa.
O discriminador é comparar com a origem:

    suspeita = palavra aparece na TRANSCRIÇÃO e não aparece no TEXTO FONTE

Palavras a vigiar: ponto, vírgula, aspas, parênteses, abre, fecha, barra,
hífen, travessão, til, asterisco, underline, sublinhado, interrogação,
exclamação, dois pontos, ponto e vírgula, reticências.

O sinal mais forte é a repetição: "ponto ponto ponto" ou "ponto, ponto,
ponto" seguidos. Trate como falha certa.

**2. Truncamento** — o XTTS corta em um limite interno e some com o resto.
Conte as palavras dos dois lados. Abaixo de 0,6 da contagem esperada,
reprove.

**3. Alucinação em loop** — o modelo repete um trecho. Detecte um n-grama de
3 a 5 palavras que apareça 3 ou mais vezes seguidas na transcrição e apenas
uma vez na fonte.

**4. Silêncio** — o .wav existe mas a transcrição vem vazia ou com uma ou
duas palavras. Quase sempre significa que o modelo engasgou.

**5. Divergência grosseira** — similaridade de tokens abaixo de 0,65. Pega
idioma trocado, fala embolada e ruído. Normalize antes de comparar: caixa
baixa, sem pontuação, e IGNORE os números — é neles que transcritor e
sintetizador mais divergem sem que haja defeito.

### A limitação honesta deste método

O Whisper foi treinado para produzir texto BEM PONTUADO. Existe uma chance
real de que, ouvindo "ponto ponto ponto", ele escreva "..." em vez das três
palavras — e o defeito passe despercebido justamente na verificação feita
para pegá-lo.

Por isso acrescente uma sexta checagem, que não depende do texto:

**6. Duração implausível** — compare a duração do .wav com o esperado a
13,8 caracteres por segundo (é a velocidade medida do modelo, usada em
`narrar.py:CARACTERES_POR_SEGUNDO`). Pontuação lida em voz alta ACRESCENTA
áudio que o texto não previa. Fora da faixa de 0,55x a 1,8x do esperado,
reprove e mande ouvir.

Reporte separadamente os trechos reprovados só pela duração: eles são os
candidatos a defeito que a transcrição não viu.

### Como reprovar e refazer

O cache é um .wav por fala, com o nome sendo o SHA-256 de voz + texto +
temperatura. Para refazer um trecho:

  1. apague o .wav correspondente em work/livro/cache/
  2. apague o .mp3 e o .json do capítulo em work/livro/audio/
  3. rode a síntese daquele capítulo de novo — só o trecho apagado é refeito

Se o mesmo trecho reprovar três vezes, PARE de tentar e reporte. Três falhas
seguidas quase nunca são azar do modelo: costuma ser buraco no dicionário de
`fala.py`, e a correção é lá, não na repetição.

### Onde rodar a verificação

Depois de cada capítulo, NUNCA em paralelo com a síntese. Isto foi medido
nesta máquina: rodar dois processos ao mesmo tempo faz cada um cair para um
terço da velocidade, e a soma fica pior que um só. A memória é unificada e os
dois disputam a mesma banda.

Transcrever 8,5 horas com o `small` leva cerca de 1 hora no total.

## Narração: fazer soar como livro lido, não como texto processado

Hoje a síntese usa duas pausas fixas — 0,35 s entre pedaços e 0,70 s entre
falas (`narrar.py`, constantes `PAUSA_ENTRE_PEDACOS` e `PAUSA_ENTRE_FALAS`).
Pausa constante não é ritmo: é metrônomo. Um narrador humano pausa ONDE O
TEXTO VIRA, e é isso que você vai implementar.

### Dois mecanismos, e eles não se confundem

**Dentro da frase, quem manda é a pontuação.** O XTTS constrói prosódia a
partir do texto que recebe: vírgula encurta, ponto fecha, interrogação sobe a
entonação. "Pausa dramática" no meio de uma frase se faz com vírgula ou ponto
no texto — nunca inserindo silêncio, que sairia como corte.

**Entre falas, quem manda é o silêncio.** É onde entram as pausas
estruturais. Acrescente um campo opcional `pausa` (em segundos) em cada fala
do roteiro e faça `narrar.py` respeitá-lo no lugar do valor fixo.

### A escala de pausas

| Fronteira | Segundos | Por quê |
|---|---|---|
| entre frases | — | deixe com o XTTS, via ponto final |
| entre parágrafos | 0,6 | respiro; o padrão atual já serve |
| antes de uma fala de personagem | 0,5 | o travessão pede um tempo |
| antes da última frase da página | 0,9 | é quase sempre onde o texto vira |
| entre a narrativa e a nota científica | 1,4 | a maior fronteira do livro |
| depois da nota, voltando à narrativa | 1,2 | fecha o parêntese |
| entre páginas (seções) | 1,6 | virada de página |
| depois do título do capítulo | 2,0 | deixa o título assentar |
| fim do capítulo | 2,5 | silêncio antes do próximo arquivo |

A mais importante é a de 1,4 s antes da nota científica. O livro promete "leia
como ficção, verifique como ciência", e a nota é a troca de registro. Ela já
muda de voz — Nina narra, Téo lê as notas —, e a pausa é o que dá ao ouvinte
tempo de perceber que saiu da história.

### O que um narrador faz e o gerador ainda não faz

**Diálogo.** O livro usa travessão à brasileira: `— Toda coisa quente conta
sua temperatura — disse ele.` Duas providências: pausa de 0,5 s antes da fala,
e garantir que o travessão não seja lido em voz alta (confira na transcrição
reversa — se aparecer "travessão" ou "hífen", corrija em `fala.py`).

Se quiser ir além, o XTTS tem 58 vozes e daria para dar uma terceira voz a
Tomás. Ganha-se muito em vida; perde-se em consistência, porque cada troca de
voz é uma nova inferência com timbre e ritmo próprios. Só faça se for ouvir
capítulo a capítulo — meio caminho aqui soa pior que narrador único.

**Perguntas.** Depois de uma frase terminada em "?", 0,8 s. A pergunta
retórica é o recurso mais usado neste livro e ela morre sem o silêncio depois.

**A nota científica é mais densa.** Se o backend expuser controle de
velocidade, leia-a 5% mais devagar. Se não expuser, não force com truque de
texto — atrapalha mais do que ajuda.

**Abertura e fecho.** O capítulo já abre anunciando número e título. Depois
dele, 2,0 s antes da primeira frase. No fim, 2,5 s de silêncio: quem ouve em
sequência precisa do respiro entre arquivos.

### O erro a evitar

Silêncio demais mata o audiolivro — soa como gravação defeituosa e o ouvinte
acha que travou. Se a soma das pausas passar de 8% da duração do capítulo,
você exagerou. Meça: some as pausas inseridas e divida pela duração final.

E gere UM capítulo com o novo ritmo, ouça, ajuste — só então rode os outros.
Ritmo é a única coisa deste trabalho que teste nenhum aprova por você.

## Fatos medidos — não redescubra

**Dispositivo.** Um trabalhador só, na GPU (`--device xpu`).

  | configuração          | vazão  |
  |-----------------------|--------|
  | CPU sozinha           | 1,00x  |
  | GPU sozinha           | 0,99x  |
  | GPU + CPU             | 0,58x  |
  | GPU + GPU             | 0,76x  |

  A CPU empata com a GPU porque o XTTS é autorregressivo e o gargalo é
  latência de memória, não cálculo. A NPU (Intel AI Boost) existe mas não é
  alcançável: PyTorch não tem backend para ela. Detalhes em
  docs/ONDE-SINTETIZAR.md.

**Não edite arquivos por heredoc do shell.** Nesta sessão isso corrompeu
`fala.py` duas vezes: `\b` virou backspace literal (0x08) e `\1` virou 0x01
dentro de expressões regulares, e o padrão parava de casar em silêncio. Edite
os arquivos diretamente.

**Console do Windows.** Sempre `PYTHONIOENCODING=utf-8`, ou qualquer print
com acento derruba o processo.

**Mexer em `fala.py` invalida cache.** Só das falas cujo texto convertido
mudar — o hash é do texto final. Mudanças pontuais custam pouco; medir antes
de refazer tudo.

**O dicionário JÁ resolve** (não refaça): notação quântica, prosa de física
(perfil "livro"), letras gregas incluindo ni/rô/eta, expoentes e subscritos,
reticências nos três sentidos, e séculos em numeral romano. São 36 testes em
`tests/test_fala.py`. Rode-os antes e depois de qualquer alteração:

  .\.venv\Scripts\python.exe -m pytest tests/test_fala.py -q

## Critério de aceitação

- Os 24 capítulos com .mp3 e .json em work/livro/audio.
- Todo trecho aprovado nas seis checagens, ou reportado com o motivo.
- `node scripts/import-audiolivro.mjs` sem erro no diretório do site.
- `npx vitest run src/data/content.test.ts` verde.
- Os 24 mp3 respondendo 200 em https://quantical.com.br/audio/livro/.

## Relatório final

Entregue uma tabela: capítulo, duração, trechos verificados, reprovados por
assinatura, e refeitos. Liste explicitamente os trechos que reprovaram só
pela duração — são os que a transcrição pode ter deixado passar, e alguém
precisa ouvir.
```

---

## Por que o prompt está desenhado assim

**A comparação literal não funciona.** Transcritor e sintetizador discordam em
número, pontuação e caixa mesmo quando o áudio está perfeito. Sem essa
ressalva, a primeira execução reprovaria tudo e o ChatGPT concluiria que a
síntese está quebrada.

**"ponto" é palavra do idioma.** Buscar a palavra solta acusaria "ponto de
partida" e "até certo ponto". O discriminador — aparecer na transcrição e não
na fonte — é o que separa o defeito da prosa.

**O método tem um ponto cego, e ele está declarado.** O Whisper tende a
escrever "..." em vez de transcrever "ponto ponto ponto" literalmente,
justamente porque foi treinado para pontuar bem. A checagem de duração é o que
cobre esse buraco, e o relatório separa esses casos para escuta humana.

**A verificação não roda junto com a síntese.** Não é preferência: nesta
máquina foi medido que dois processos derrubam a vazão de cada um para um
terço.

**O ritmo é a única parte que nenhum teste aprova.** Por isso o prompt manda
gerar um capítulo, ouvir e ajustar antes de rodar os outros dezenove — e dá um
teto objetivo (8% da duração em pausa) para o exagero ter onde bater.
