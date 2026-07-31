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
