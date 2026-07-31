# Quantical

Plataforma brasileira de ensino de computação quântica. Exportação estática
(Next.js 16) com simulador statevector rodando inteiramente no navegador, sem
nenhum código de servidor.

Produção: **https://quantical.com.br**

## O que a plataforma faz

**Aprendizado guiado.** A aula não pede que o aluno "imagine o resultado" e o
deixa sozinho: ela tranca a execução até ele registrar um palpite. O
instrumento de previsão é a própria interface de resultado, e depois de rodar a
realidade aparece sobreposta ao palpite. O custo de autoria disso é zero — a
verdade é o simulador.

**Cursor de passos.** Um controle de tempo sobre as portas do circuito. A
esfera de Bloch gira, as amplitudes mudam e o histograma se deforma em
sincronia enquanto se arrasta. É o que torna visível a transformação, que é
onde o conceito mora.

**Correção automática.** Os desafios e o estágio final de cada módulo rodam o
circuito do aluno e conferem o **estado produzido**, não as portas usadas —
inclusive aceitando soluções que diferem apenas por fase global, que são
fisicamente idênticas. A esfera de Bloch desenha o estado alvo como seta
tracejada e mostra a distância encolher: "chegue aqui" em vez de
aprovado/reprovado. O alvo sai da própria solução de referência, que o CI já
confere.

**Revisão espaçada, por conceito.** Errar uma pergunta sobre fase não devolve
a aula inteira para a fila: devolve o conceito, que pode voltar por qualquer
item que o exercite. A sessão em `/revisar` remonta a coisa exata em que o
aluno tropeçou — a pergunta com as alternativas reembaralhadas, o passo do
experimento para reapostar no mesmo circuito, o exercício cuja asserção
falhou. Nenhum material novo precisou ser escrito: é o material da aula.

**Perfil de equívocos.** Cada módulo foi construído em torno de uma intuição
específica que quebra, e o experimento que a derruba já existe. Nomeando essas
intuições em [`src/data/equivocos.ts`](src/data/equivocos.ts) e marcando as
alternativas erradas que as revelam, o painel passa a dizer *"você tende a
tratar o histograma como se fosse o estado; apareceu 3 vezes"* — e a oferecer
o experimento que derruba. Uma trava em `content.test.ts` garante que todo
equívoco citado existe, que toda demolição aponta para uma aula e um passo
reais, e que nenhum equívoco está marcado numa alternativa **certa**.

## Desenvolvimento

```bash
npm install
npm run dev
```

Validação completa (a mesma sequência do CI):

```bash
npm run build      # antes do typecheck: next-env.d.ts depende de .next/types
npm run typecheck
npm run lint
npm test
npm run test:e2e
```

Para rodar a suíte end-to-end contra o site publicado:

```bash
PLAYWRIGHT_BASE_URL=https://quantical.com.br npx playwright test
```

## Conteúdo

`src/data/curriculum.ts` é o índice **estrutural** (trilhas → módulos).
`src/data/lessons/` é a camada de **conteúdo**: aulas tipadas com blocos,
metáforas com a demolição executável delas, roteiro guiado e exercício
corrigido. Módulos ainda não escritos caem num estado explícito de "em
produção" em vez de renderizar texto genérico.

`npm test` inclui a trava de conteúdo: **toda solução de referência é
verificada contra as próprias asserções do exercício**, todo circuito embutido
precisa simular sem erro e toda alternativa de quiz precisa de explicação. É o
que torna seguro gerar os módulos restantes com apoio de IA.

## Deploy

```bash
./scripts/deploy.sh root@187.77.8.195
```

O script faz build, empacota, valida a configuração do nginx **antes** de
trocar qualquer coisa, troca o conteúdo de forma atômica, recarrega o nginx e
então confere que todas as rotas exportadas respondem 200. A versão anterior
fica em `/var/www/quantical.old-<timestamp>` (os três últimos são mantidos).

Banco e API (opcionais para o site funcionar, ver
[`docs/OPERACAO.md`](docs/OPERACAO.md)):

```bash
./scripts/deploy-api.sh root@187.77.8.195
```

Postgres e uma API em Node puro, em Docker, presos a `127.0.0.1` e servidos
por `proxy_pass` em `/api/`. Mesma origem de propósito: sem CORS e sem origem
nova a autorizar no CSP. **O site continua `output: "export"`** — a API é
durabilidade e agregação, nunca caminho crítico, e há um teste e2e que aborta
toda chamada a `/api/**` e percorre o site inteiro para provar isso.

Infraestrutura em [`deploy/`](deploy/):

- `api/` — compose, Dockerfile, esquema e servidor da API
- `nginx.quantical.conf` — referência da configuração de produção
- `quantical-headers.conf` — cabeçalhos de segurança, com CSP **sem
  `unsafe-eval`** (possível porque o avaliador de ângulos do parser é próprio,
  não usa o construtor `Function`)

### Duas armadilhas do export estático

A exportação grava cada rota como `<rota>.html` **e também** cria um diretório
`<rota>/` contendo apenas payloads RSC. As duas já quebraram produção:

1. `try_files $uri $uri/ $uri.html` faz o nginx parar no diretório vazio e
   devolver 403. O `.html` precisa ser testado **antes** de qualquer sonda de
   diretório.
2. O cliente pede os payloads de segmento com pontos
   (`__next.aprender.__PAGE__.txt`) enquanto o build os grava com barras.
   `scripts/flatten-rsc.mjs` gera as cópias achatadas, deixando o artefato
   autossuficiente em qualquer host estático.

`scripts/check-routes.mjs` verifica isso contra um servidor real e roda no CI.

## Supabase (opcional)

Sem variáveis de ambiente a Quantical funciona por inteiro em modo local,
salvando progresso e projetos no navegador. Para sincronizar entre
dispositivos:

1. Crie um projeto Supabase e execute `supabase/schema.sql` (é idempotente).
2. Copie `.env.example` para `.env.local` e informe URL e chave pública.
3. Ative os provedores desejados e adicione a URL publicada aos
   redirecionamentos.

A sincronização usa lápides e resolução por horário de modificação: apagar um
projeto ou zerar o progresso não é desfeito pelo sync seguinte.

## Simulador

Até **16 qubits** em um Web Worker, com estado em `Float64Array`.

Portas: I, H, X, Y, Z, S, S†, T, T†, √X, √X†, P, U, RX, RY, RZ, CNOT, CY, CZ,
CH, CP, CRX, CRY, CRZ, CCX (Toffoli), CCZ, MCX, MCZ, SWAP, iSWAP, CSWAP
(Fredkin), barreira e medição.

O parser aceita um subconjunto de Qiskit: `QuantumCircuit(n)`, chamadas de
porta, variáveis (`theta = pi / 2`) e expressões com `pi`, `sqrt`, `sin` e
`cos`. Ele acumula **todos** os erros de uma vez, com número de linha e
sugestão de porta parecida. Código Python arbitrário não é executado.
