import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test("landing apresenta a proposta e a demonstração Hadamard", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /O futuro não é binário/i })).toBeVisible();
  await page.getByRole("button", { name: "Executar circuito" }).click();
  await expect(page.getByText("O qubit está em uma superposição equilibrada.")).toBeVisible();
});

test("aluno responde o quiz pelo TEXTO da alternativa e conclui a aula", async ({ page }) => {
  // A versão anterior deste teste clicava em `name: /^A /` — ou seja, ele só
  // passava porque a resposta certa era sempre a primeira alternativa.
  // Selecionar pelo texto é o que valida o embaralhamento.
  await page.goto("/curso/iniciante/bits-e-qubits/teoria");

  await page.getByRole("button", { name: /indecisão do qubit é reversível/i }).click();
  await page.getByRole("button", { name: /64%, porque a probabilidade/i }).click();
  await page.getByRole("button", { name: /sinal permite que caminhos diferentes se cancelem/i }).click();
  await page.getByRole("button", { name: /Verificar respostas/i }).click();

  await expect(page.getByText("3 de 3 · 100%")).toBeVisible();

  await page.goto("/progresso");
  await expect(page.getByRole("heading", { name: "Do bit ao qubit" })).toBeVisible();
});

test("as alternativas do quiz não ficam sempre na mesma ordem", async ({ page }) => {
  await page.goto("/curso/iniciante/bits-e-qubits/teoria");
  const firstOption = page.locator(".quiz-question").first().getByRole("button").first();
  const before = await firstOption.textContent();

  // Uma nova tentativa reembaralha com semente diferente.
  await page.getByRole("button", { name: /indecisão do qubit é reversível/i }).click();
  await page.getByRole("button", { name: /64%, porque a probabilidade/i }).click();
  await page.getByRole("button", { name: /sinal permite que caminhos diferentes se cancelem/i }).click();
  await page.getByRole("button", { name: /Verificar respostas/i }).click();
  await page.getByRole("button", { name: /Tentar de novo/i }).click();

  const after = await firstOption.textContent();
  expect(before).not.toBe(after);
});

test("o experimento guiado exige previsão antes de deixar executar", async ({ page }) => {
  await page.goto("/curso/iniciante/bits-e-qubits/experimento");

  const executar = page.getByRole("button", { name: /Executar/ });
  // A trava: sem palpite registrado, não roda.
  await expect(executar).toBeDisabled();
  await expect(page.getByText(/Registre seu palpite/i)).toBeVisible();

  await page.getByRole("radio", { name: /Sempre 0/ }).click();
  await page.getByRole("button", { name: /Registrar palpite/i }).click();

  await expect(page.getByText(/Palpite registrado/i)).toBeVisible();
  await expect(executar).toBeEnabled();

  await executar.click();
  await expect(page.getByText(/Intuição afiada/i)).toBeVisible();
  await expect(page.getByText(/linha de base/i)).toBeVisible();
});

test("o roteiro chega ao passo do H·H, onde a intuição clássica quebra", async ({ page }) => {
  test.setTimeout(60_000);
  await page.goto("/curso/iniciante/bits-e-qubits/experimento");

  // Passo 1
  await page.getByRole("radio", { name: /Sempre 0/ }).click();
  await page.getByRole("button", { name: /Registrar palpite/i }).click();
  await page.getByRole("button", { name: /^Executar/ }).click();
  await page.getByRole("button", { name: /Próximo passo/i }).click();

  // Passo 2
  await page.getByRole("radio", { name: /Sempre 1/ }).click();
  await page.getByRole("button", { name: /Registrar palpite/i }).click();
  await page.getByRole("button", { name: /^Executar/ }).click();
  await page.getByRole("button", { name: /Próximo passo/i }).click();

  // Passo 3: slider
  await page.getByRole("button", { name: /Registrar palpite/i }).click();
  await page.getByRole("button", { name: /^Executar/ }).click();
  await page.getByRole("button", { name: /Próximo passo/i }).click();

  // Passo 4
  await page.getByRole("radio", { name: /Variam um pouco/ }).click();
  await page.getByRole("button", { name: /Registrar palpite/i }).click();
  await page.getByRole("button", { name: /^Executar/ }).click();
  await page.getByRole("button", { name: /Próximo passo/i }).click();

  // Passo 5: aposta em 50/50, como quase todo mundo faria.
  await expect(page.locator(".guided-instruction").getByText(/DOIS H seguidos/i)).toBeVisible();
  await page.getByRole("radio", { name: /Continua 50\/50/ }).click();
  await page.getByRole("button", { name: /Registrar palpite/i }).click();
  await page.getByRole("button", { name: /^Executar/ }).click();

  // A previsão tem que ser desmentida, e a revelação tem que explicar por quê.
  await expect(page.getByText(/Sua intuição errou aqui/i)).toBeVisible();
  await expect(page.getByText(/H não é aleatoriedade/i)).toBeVisible();
});

test("o cursor de passos mostra o estado no meio do circuito", async ({ page }) => {
  await page.goto("/laboratorio");
  await page.getByRole("button", { name: "Executar" }).click();

  await expect(page.getByText(/Passo 2 de 2/)).toBeVisible();
  await page.getByRole("button", { name: "Voltar uma porta" }).click();
  await expect(page.getByText(/Mostrando o estado/)).toBeVisible();
  await expect(page.getByText(/Passo 1 de 2/)).toBeVisible();
});

test("a esfera de Bloch explica o emaranhamento em vez de mostrar seta vazia", async ({ page }) => {
  await page.goto("/laboratorio");
  await page.getByRole("button", { name: "Executar" }).click();
  await page.getByRole("tab", { name: "Bloch" }).click();
  // Antes: seta de comprimento zero, sem nenhuma explicação.
  await expect(page.getByText(/não tem estado próprio/i).first()).toBeVisible();
});

test("desafio corrige o circuito do aluno de verdade", async ({ page }) => {
  await page.goto("/desafios/bell");
  await expect(page.getByRole("heading", { name: /Prepare o estado/ })).toBeVisible();

  const editor = page.getByLabel("Seu código Qiskit");
  await editor.fill("from qiskit import QuantumCircuit\n\nqc = QuantumCircuit(2)\nqc.h(0)\n");
  await page.getByRole("button", { name: "Verificar" }).click();
  await expect(page.getByText(/de 3 conferidos/)).toBeVisible();

  await editor.fill("from qiskit import QuantumCircuit\n\nqc = QuantumCircuit(2)\nqc.h(0)\nqc.cx(0, 1)\n");
  await page.getByRole("button", { name: "Verificar" }).click();
  await expect(page.getByText("Resolvido.")).toBeVisible();
});

test("o desafio aceita solução que difere só por fase global", async ({ page }) => {
  await page.goto("/desafios/inversor");
  // Y|0⟩ = i|1⟩ é fisicamente o mesmo estado que X|0⟩ = |1⟩.
  await page
    .getByLabel("Seu código Qiskit")
    .fill("from qiskit import QuantumCircuit\n\nqc = QuantumCircuit(1)\nqc.y(0)\n");
  await page.getByRole("button", { name: "Verificar" }).click();
  await expect(page.getByText("Resolvido.")).toBeVisible();
});

test("erro de sintaxe aponta a linha e sugere a porta certa", async ({ page }) => {
  await page.goto("/desafios/moeda");
  await page
    .getByLabel("Seu código Qiskit")
    .fill("from qiskit import QuantumCircuit\n\nqc = QuantumCircuit(1)\nqc.hh(0)\n");
  await page.getByRole("button", { name: "Verificar" }).click();
  await expect(page.getByText(/Linha 4/)).toBeVisible();
});

test("permalink abre o laboratório com o circuito já montado", async ({ page, context }) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.goto("/laboratorio");
  await page.getByRole("button", { name: /Copiar link/i }).click();
  await expect(page.getByText("Link copiado")).toBeVisible();

  // Um circuito de 3 qubits codificado no fragmento (GHZ).
  await page.goto("/laboratorio#c=eyJxIjozLCJvIjpbWzEsWzBdXSxbMTYsWzFdLFswXV0sWzE2LFsyXSxbMV1dXX0");
  // Três fios de qubit e as duas CNOTs do GHZ chegaram montados.
  await expect(page.locator(".circuit-qubit b", { hasText: "q2" })).toBeVisible();
  await expect(page.locator(".circuit-row")).toHaveCount(3);
});

/** Abre o primeiro episódio e espera o player estar hidratado. */
async function abrirPrimeiroEpisodio(page: import("@playwright/test").Page) {
  await page.goto("/audio");
  const primeiro = page.locator(".audio-card a").first();
  await expect(primeiro).toBeVisible();
  await primeiro.click();
  // Só depois que o player aparece a página está hidratada e os handlers de
  // clique da transcrição existem de fato.
  await expect(page.getByRole("button", { name: "Tocar episódio" })).toBeVisible();
}

test("o episódio toca e a transcrição navega o áudio", async ({ page }) => {
  await abrirPrimeiroEpisodio(page);

  // O mp3 é servido de fora do build; se isso quebrar, o player entra em modo
  // erro e nada abaixo funciona.
  await expect
    .poll(() => page.locator("audio").evaluate((el: HTMLAudioElement) => el.readyState))
    .toBeGreaterThan(0);

  await page.locator(".episode-turno button").nth(3).click();

  await expect
    .poll(() => page.locator("audio").evaluate((el: HTMLAudioElement) => el.currentTime))
    .toBeGreaterThan(0);

  // E a fala clicada precisa acender.
  await expect(page.locator(".episode-turno.is-atual")).toHaveCount(1);
});

test("a transcrição do episódio é HTML de verdade, não só legenda do áudio", async ({ page }) => {
  await abrirPrimeiroEpisodio(page);

  // É o que torna o episódio indexável em português — e a alternativa
  // acessível para quem não vai ouvir.
  const falas = page.locator(".episode-turno p");
  await expect(falas).not.toHaveCount(0);
  expect(await falas.count()).toBeGreaterThanOrEqual(20);
  expect((await falas.first().textContent())?.length ?? 0).toBeGreaterThan(20);
});

test("páginas principais não criam rolagem horizontal no celular", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  for (const path of [
    "/",
    "/aprender",
    "/laboratorio",
    "/progresso",
    "/desafios",
    "/desafios/bell",
    "/curso/iniciante/bits-e-qubits/teoria",
  ]) {
    await page.goto(path);
    const dimensions = await page.evaluate(() => ({
      viewport: window.innerWidth,
      document: document.documentElement.scrollWidth,
      offenders: [...document.querySelectorAll("*")]
        .map((element) => {
          const rect = element.getBoundingClientRect();
          return {
            element: `${element.tagName.toLowerCase()}.${typeof element.className === "string" ? element.className.replaceAll(" ", ".") : ""}`,
            left: Math.round(rect.left),
            right: Math.round(rect.right),
            width: Math.round(rect.width),
          };
        })
        .filter((item) => item.left < -1 || item.right > window.innerWidth + 1)
        .sort((a, b) => b.right - a.right)
        .slice(0, 10),
    }));
    expect(
      dimensions.document,
      `${path} ultrapassou a largura da tela: ${JSON.stringify(dimensions.offenders)}`,
    ).toBeLessThanOrEqual(dimensions.viewport);
  }
});

test("as rotas principais não têm violações graves de acessibilidade", async ({ page }) => {
  test.setTimeout(120_000);
  // Antes o scan cobria apenas / e /laboratorio.
  for (const path of [
    "/",
    "/aprender",
    "/laboratorio",
    "/desafios",
    "/desafios/bell",
    "/glossario",
    "/progresso",
    "/projetos",
    "/entrar",
    "/audio",
    "/revisar",
    "/curso/iniciante/bits-e-qubits/teoria",
  ]) {
    await page.goto(path);
    const results = await new AxeBuilder({ page }).analyze();
    const blocking = results.violations.filter(
      (violation) => violation.impact === "critical" || violation.impact === "serious",
    );
    expect(blocking, `${path}: ${blocking.map((item) => item.id).join(", ")}`).toEqual([]);
  }
});

/* ---------------------------------------------------------------------------
   Revisão espaçada
--------------------------------------------------------------------------- */

const CHAVE = "quantical:progress:v2";

/** Estado com um conceito vencido e o erro que o produziu, pronto para revisar. */
const ESTADO_COM_REVISAO_VENCIDA = {
  version: 2,
  completed: [],
  completedAt: {},
  quizScores: {},
  streak: 0,
  projects: [],
  deletedProjects: {},
  unlockedOverrides: [],
  alunoId: "11111111-2222-3333-4444-555555555555",
  tentativas: [
    {
      id: "t1",
      tipo: "quiz",
      licaoId: "iniciante/bits-e-qubits/teoria",
      itemId: "q1",
      acertou: false,
      conceitos: ["qubit"],
      em: "2020-01-01T10:00:00.000Z",
    },
  ],
  // Data no passado: o agendador considera vencido qualquer `proximaEm <= hoje`.
  revisao: {
    qubit: { conceitoId: "qubit", forca: 0, proximaEm: "2020-01-02", ultimaEm: "2020-01-01", errosTotais: 1 },
  },
};

test("errar o quiz deixa rastro que sobrevive ao 'tentar de novo' e ao reload", async ({ page }) => {
  // Este é exatamente o defeito que motivou o registro: o retry() fazia
  // setAnswers({}) e a alternativa errada escolhida desaparecia para sempre.
  await page.goto("/curso/iniciante/bits-e-qubits/teoria");

  await page.getByRole("button", { name: /O qubit sorteia mais rápido/i }).click();
  await page.getByRole("button", { name: /80%, porque β = 0,8/i }).click();
  await page.getByRole("button", { name: /apenas uma convenção de notação/i }).click();
  await page.getByRole("button", { name: /Verificar respostas/i }).click();

  await expect(page.getByRole("button", { name: /Tentar de novo/i })).toBeVisible();

  const gravado = async () =>
    page.evaluate((chave) => {
      const bruto = window.localStorage.getItem(chave);
      return bruto ? JSON.parse(bruto).tentativas : [];
    }, CHAVE);

  await expect.poll(async () => (await gravado()).length).toBe(3);

  const erradas = await gravado();
  expect(erradas.every((item: { acertou: boolean }) => !item.acertou)).toBe(true);
  expect(erradas.some((item: { detalhe?: { escolha?: string } }) =>
    item.detalhe?.escolha?.includes("sorteia mais rápido"),
  )).toBe(true);

  // Refaz acertando: as tentativas antigas continuam lá.
  await page.getByRole("button", { name: /Tentar de novo/i }).click();
  await page.getByRole("button", { name: /indecisão do qubit é reversível/i }).click();
  await page.getByRole("button", { name: /64%, porque a probabilidade/i }).click();
  await page.getByRole("button", { name: /sinal permite que caminhos diferentes se cancelem/i }).click();
  await page.getByRole("button", { name: /Verificar respostas/i }).click();

  await expect.poll(async () => (await gravado()).length).toBe(6);

  await page.reload();
  await expect.poll(async () => (await gravado()).length).toBe(6);
});

test("a revisão devolve a pergunta exata que o aluno errou", async ({ page }) => {
  await page.goto("/");
  await page.evaluate(
    ([chave, estado]) => window.localStorage.setItem(chave as string, JSON.stringify(estado)),
    [CHAVE, ESTADO_COM_REVISAO_VENCIDA] as const,
  );

  await page.goto("/revisar");

  await expect(page.getByRole("heading", { name: "Qubit", exact: true })).toBeVisible();
  await expect(
    page.getByText(/Qual é a diferença essencial entre um qubit e um bit que é sorteado/i),
  ).toBeVisible();

  // A sessão não pode se desmanchar sob o aluno quando ele responde.
  await page.getByRole("button", { name: /indecisão do qubit é reversível/i }).click();
  await page.getByRole("button", { name: /Verificar respostas/i }).click();
  await expect(page.getByText("1 de 1 · 100%")).toBeVisible();
  await expect(
    page.getByText(/Qual é a diferença essencial entre um qubit e um bit que é sorteado/i),
  ).toBeVisible();

  // Acertar empurra o conceito para frente na agenda.
  await expect
    .poll(async () =>
      page.evaluate((chave) => {
        const bruto = window.localStorage.getItem(chave);
        return bruto ? JSON.parse(bruto).revisao.qubit.forca : -1;
      }, CHAVE),
    )
    .toBe(1);

  await page.getByRole("button", { name: /Encerrar revisão/i }).click();
  await expect(page.getByRole("heading", { name: /Sessão concluída/i })).toBeVisible();
});

test("sem nada vencido, a revisão explica quando o conceito volta", async ({ page }) => {
  await page.goto("/revisar");
  await expect(page.getByRole("heading", { name: /Nada vencido por hoje/i })).toBeVisible();
  await expect(page.getByText(/A revisão nasce dos seus erros/i)).toBeVisible();
  // Sem revisão pendente, o aviso não aparece em lugar nenhum.
  await page.goto("/progresso");
  await expect(page.locator(".revisao-aviso")).toHaveCount(0);
});

test("o aviso de revisão aparece na home e leva para a sessão", async ({ page }) => {
  await page.goto("/");
  await page.evaluate(
    ([chave, estado]) => window.localStorage.setItem(chave as string, JSON.stringify(estado)),
    [CHAVE, ESTADO_COM_REVISAO_VENCIDA] as const,
  );
  await page.goto("/");

  const aviso = page.locator(".revisao-aviso");
  await expect(aviso).toContainText("1 conceito para revisar");
  await aviso.click();
  await expect(page).toHaveURL(/\/revisar/);
});

test("a sessão de revisão não tem violações graves de acessibilidade", async ({ page }) => {
  await page.goto("/");
  await page.evaluate(
    ([chave, estado]) => window.localStorage.setItem(chave as string, JSON.stringify(estado)),
    [CHAVE, ESTADO_COM_REVISAO_VENCIDA] as const,
  );
  await page.goto("/revisar");
  await expect(page.getByRole("heading", { name: "Qubit", exact: true })).toBeVisible();

  const results = await new AxeBuilder({ page }).analyze();
  const blocking = results.violations.filter(
    (violation) => violation.impact === "critical" || violation.impact === "serious",
  );
  expect(blocking, blocking.map((item) => item.id).join(", ")).toEqual([]);
});

test("o painel nomeia o pensamento por trás do erro e oferece a demolição", async ({ page }) => {
  // O aluno escolhe, nas duas aulas, alternativas marcadas com o mesmo
  // equívoco: confundir amplitude com probabilidade.
  await page.goto("/curso/iniciante/bits-e-qubits/teoria");
  await page.getByRole("button", { name: /indecisão do qubit é reversível/i }).click();
  await page.getByRole("button", { name: /80%, porque β = 0,8/i }).click();
  await page.getByRole("button", { name: /probabilidade negativa/i }).click();
  await page.getByRole("button", { name: /Verificar respostas/i }).click();
  await expect(page.getByText("1 de 3 · 33%")).toBeVisible();

  await page.goto("/progresso");

  await expect(page.getByRole("heading", { name: /Como sua intuição erra/i })).toBeVisible();
  const cartao = page.locator(".equivoco-grid article").filter({
    hasText: /Amplitude e probabilidade são a mesma coisa/i,
  });
  await expect(cartao).toBeVisible();
  await expect(cartao).toContainText("Apareceu 2 vezes");

  // O experimento que derruba já existe: o cartão precisa levar até ele.
  await cartao.getByRole("link", { name: /Refazer o experimento/i }).click();
  await expect(page).toHaveURL(/\/curso\/iniciante\/superposicao\/teoria/);
});

test("sem erro registrado, o painel não inventa diagnóstico", async ({ page }) => {
  await page.goto("/progresso");
  await expect(page.getByRole("heading", { name: /Como sua intuição erra/i })).toHaveCount(0);
});

/* ---------------------------------------------------------------------------
   Local primeiro: a API é durabilidade, nunca caminho crítico
--------------------------------------------------------------------------- */

test("com a API fora do ar, o site inteiro continua funcionando", async ({ page }) => {
  test.setTimeout(60_000);
  // Aborta TODA chamada à API — pior caso: nem 500, nem timeout, conexão
  // recusada. É o cenário de container caído.
  const chamadas: string[] = [];
  await page.route("**/api/**", (route) => {
    chamadas.push(route.request().url());
    return route.abort("connectionrefused");
  });

  // 1. A aula responde e conclui.
  await page.goto("/curso/iniciante/bits-e-qubits/teoria");
  await page.getByRole("button", { name: /indecisão do qubit é reversível/i }).click();
  await page.getByRole("button", { name: /64%, porque a probabilidade/i }).click();
  await page.getByRole("button", { name: /sinal permite que caminhos diferentes se cancelem/i }).click();
  await page.getByRole("button", { name: /Verificar respostas/i }).click();
  await expect(page.getByText("3 de 3 · 100%")).toBeVisible();

  // 2. O simulador roda — ele sempre foi 100% local.
  await page.goto("/laboratorio");
  await page.getByRole("button", { name: "Executar" }).click();
  await expect(page.getByText(/Passo 2 de 2/)).toBeVisible();

  // 3. O desafio corrige.
  await page.goto("/desafios/bell");
  await page
    .getByLabel("Seu código Qiskit")
    .fill("from qiskit import QuantumCircuit\n\nqc = QuantumCircuit(2)\nqc.h(0)\nqc.cx(0, 1)\n");
  await page.getByRole("button", { name: "Verificar" }).click();
  await expect(page.getByText("Resolvido.")).toBeVisible();

  // 4. O progresso e o diagnóstico continuam de pé — são locais.
  await page.goto("/progresso");
  await expect(page.getByRole("heading", { name: "Do bit ao qubit" })).toBeVisible();

  // 5. A revisão continua sendo decidida no cliente.
  await page.goto("/revisar");
  await expect(page.getByRole("heading", { name: /Nada vencido por hoje/i })).toBeVisible();

  // A API foi mesmo procurada e recusou conexão — o teste não passou por
  // nunca ter tocado nela. O envio é adiado de propósito para agrupar o lote,
  // então esperar aqui é parte do comportamento, não folga do teste.
  await expect.poll(() => chamadas.length, { timeout: 10_000 }).toBeGreaterThan(0);

  // E o mais importante: nada do que falhou virou erro visível para o aluno.
  // O filtro por texto é necessário porque o Next mantém sempre um
  // role="alert" vazio na página (o anunciador de rota).
  await expect(page.getByRole("alert").filter({ hasText: /\S/ })).toHaveCount(0);
});

test("a tentativa é gravada localmente ANTES de qualquer ida à rede", async ({ page }) => {
  // Se a ordem fosse a inversa, uma falha de rede custaria o registro do erro
  // — que é justamente a informação mais valiosa da plataforma.
  let liberar: () => void = () => {};
  const rotaPresa = new Promise<void>((resolve) => {
    liberar = resolve;
  });
  await page.route("**/api/tentativas", async (route) => {
    await rotaPresa;
    return route.abort("connectionrefused");
  });

  await page.goto("/curso/iniciante/bits-e-qubits/teoria");
  await page.getByRole("button", { name: /O qubit sorteia mais rápido/i }).click();
  await page.getByRole("button", { name: /80%, porque β = 0,8/i }).click();
  await page.getByRole("button", { name: /apenas uma convenção de notação/i }).click();
  await page.getByRole("button", { name: /Verificar respostas/i }).click();

  // Com a requisição ainda pendurada, o registro local já tem que estar lá.
  await expect
    .poll(async () =>
      page.evaluate(() => {
        const bruto = window.localStorage.getItem("quantical:progress:v2");
        return bruto ? JSON.parse(bruto).tentativas.length : 0;
      }),
    )
    .toBe(3);

  liberar();

  // Depois da falha, seguem pendentes — para subirem na próxima oportunidade.
  await expect
    .poll(async () =>
      page.evaluate(() => {
        const bruto = window.localStorage.getItem("quantical:progress:v2");
        const estado = bruto ? JSON.parse(bruto) : { tentativas: [] };
        return estado.tentativas.filter((item: { sincronizada?: boolean }) => item.sincronizada)
          .length;
      }),
    )
    .toBe(0);
});

test("quando a API responde, as tentativas sobem e ficam marcadas", async ({ page }) => {
  const corpos: unknown[] = [];
  await page.route("**/api/tentativas", async (route) => {
    corpos.push(JSON.parse(route.request().postData() ?? "{}"));
    return route.fulfill({ json: { gravadas: 3, recebidas: 3 } });
  });

  await page.goto("/curso/iniciante/bits-e-qubits/teoria");
  await page.getByRole("button", { name: /indecisão do qubit é reversível/i }).click();
  await page.getByRole("button", { name: /64%, porque a probabilidade/i }).click();
  await page.getByRole("button", { name: /sinal permite que caminhos diferentes se cancelem/i }).click();
  await page.getByRole("button", { name: /Verificar respostas/i }).click();

  await expect
    .poll(async () =>
      page.evaluate(() => {
        const bruto = window.localStorage.getItem("quantical:progress:v2");
        const estado = bruto ? JSON.parse(bruto) : { tentativas: [] };
        return estado.tentativas.filter((item: { sincronizada?: boolean }) => item.sincronizada)
          .length;
      }),
    )
    .toBe(3);

  // As três respostas de um quiz sobem num lote só, não numa requisição cada.
  expect(corpos).toHaveLength(1);
  const lote = corpos[0] as { alunoId: string; tentativas: unknown[] };
  expect(lote.tentativas).toHaveLength(3);
  expect(lote.alunoId).toMatch(/^[0-9a-f-]{36}$/);
});

test("o exercício mostra para onde ir, e a distância encolhe até zero", async ({ page }) => {
  await page.goto("/desafios/inversor");
  const editor = page.getByLabel("Seu código Qiskit");

  // Circuito errado de propósito: o estado fica longe do alvo.
  await editor.fill("from qiskit import QuantumCircuit\n\nqc = QuantumCircuit(1)\nqc.h(0)\n");
  await page.getByRole("button", { name: "Verificar" }).click();
  await page.getByRole("tab", { name: "Bloch" }).click();

  const distancia = page.locator(".bloch-distancia").first();
  await expect(distancia).toContainText(/Falta \d/);
  // A seta-fantasma tem que estar desenhada enquanto não se chegou.
  await expect(page.locator(".bloch-alvo")).toHaveCount(1);

  const antes = Number((await distancia.textContent())?.match(/[\d.]+/)?.[0]);
  expect(antes).toBeGreaterThan(0);

  // Agora o circuito certo.
  await editor.fill("from qiskit import QuantumCircuit\n\nqc = QuantumCircuit(1)\nqc.x(0)\n");
  await page.getByRole("button", { name: "Verificar" }).click();
  await page.getByRole("tab", { name: "Bloch" }).click();

  await expect(distancia).toContainText("No alvo");
  // Chegou: o fantasma sai de cena em vez de ficar sobreposto à seta real.
  await expect(page.locator(".bloch-alvo")).toHaveCount(0);
});

/* ---------------------------------------------------------------------------
   Defeitos corrigidos
--------------------------------------------------------------------------- */

test("o cabeçalho mostra quem está usando o site e permite sair", async ({ page }) => {
  // Antes: o cabeçalho dizia "Entrar" para sempre, e `signOut` não aparecia
  // uma vez sequer no projeto.
  await page.goto("/");
  await expect(page.getByRole("link", { name: "Entrar" })).toBeVisible();

  await page.evaluate(() =>
    window.localStorage.setItem(
      "quantical:local-user",
      JSON.stringify({ name: "Felipe", email: "felipe@exemplo.br" }),
    ),
  );
  await page.reload();

  const gatilho = page.getByRole("button", { name: /Felipe/ });
  await expect(gatilho).toBeVisible();
  await gatilho.click();
  await page.getByRole("button", { name: /Sair/ }).click();

  await expect(page.getByRole("link", { name: "Entrar" })).toBeVisible();
  expect(await page.evaluate(() => window.localStorage.getItem("quantical:local-user"))).toBeNull();
});

test("dá para zerar o progresso, e a confirmação diz o que se perde", async ({ page }) => {
  await page.goto("/curso/iniciante/bits-e-qubits/teoria");
  await page.getByRole("button", { name: /indecisão do qubit é reversível/i }).click();
  await page.getByRole("button", { name: /64%, porque a probabilidade/i }).click();
  await page.getByRole("button", { name: /sinal permite que caminhos diferentes se cancelem/i }).click();
  await page.getByRole("button", { name: /Verificar respostas/i }).click();

  await page.goto("/progresso");
  await expect(page.getByText("1", { exact: true }).first()).toBeVisible();

  await page.getByRole("button", { name: /Zerar meu progresso/i }).click();
  await expect(page.getByText(/Isto apaga 1 aula concluída/)).toBeVisible();

  // Cancelar não pode apagar nada.
  await page.getByRole("button", { name: "Cancelar" }).click();
  await expect(page.getByRole("button", { name: /Zerar meu progresso/i })).toBeVisible();

  await page.getByRole("button", { name: /Zerar meu progresso/i }).click();
  await page.getByRole("button", { name: /Zerar mesmo assim/i }).click();

  // Sem nada concluído, o botão some junto.
  await expect(page.getByRole("button", { name: /Zerar meu progresso/i })).toHaveCount(0);
  expect(
    await page.evaluate(() => {
      const bruto = window.localStorage.getItem("quantical:progress:v2");
      return bruto ? JSON.parse(bruto).completed.length : -1;
    }),
  ).toBe(0);
});

test("as portas que faltavam na paleta estão alcançáveis sem escrever código", async ({ page }) => {
  await page.goto("/laboratorio");
  // Doze portas do motor não apareciam na tela.
  for (const rotulo of [
    "Identidade",
    "Raiz de X†",
    "Universal U(θ,φ,λ)",
    "Controlada Y",
    "Controlada H",
    "Rotação X controlada",
    "Z duplamente controlada",
    "Troca com i",
    "X multicontrolada",
    "Z multicontrolada",
  ]) {
    await expect(
      page.getByRole("button", { name: `Adicionar ${rotulo}`, exact: true }),
      rotulo,
    ).toHaveCount(1);
  }

  // E aplicá-las funciona de verdade, não só aparece.
  await page.getByRole("button", { name: "Adicionar Universal U(θ,φ,λ)", exact: true }).click();
  await page.getByRole("button", { name: "Executar" }).click();
  // O anunciador de rota do Next é um role="alert" sempre presente e vazio.
  await expect(page.getByRole("alert").filter({ hasText: /\S/ })).toHaveCount(0);
  await expect(page.getByText(/Passo 3 de 3/)).toBeVisible();
});

test("cada estágio de uma aula tem título e canonical próprios", async ({ page }) => {
  // Antes: 54 páginas com 18 títulos e nenhum canonical.
  const vistos = new Set<string>();
  for (const estagio of ["teoria", "experimento", "desafio"]) {
    await page.goto(`/curso/iniciante/bits-e-qubits/${estagio}`);
    const titulo = await page.title();
    expect(vistos.has(titulo), `título repetido: ${titulo}`).toBe(false);
    vistos.add(titulo);

    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      "href",
      new RegExp(`/curso/iniciante/bits-e-qubits/${estagio}$`),
    );
    await expect(page.locator('meta[property="og:title"]')).toHaveCount(1);
  }
});
