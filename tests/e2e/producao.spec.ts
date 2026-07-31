import { expect, test } from "@playwright/test";

/**
 * Fumaça de produção: o ciclo inteiro, sem nenhuma rota interceptada.
 *
 * A suíte principal simula a API para ser determinística e rodar offline —
 * mas simulação nenhuma prova que o nginx roteia /api/, que o container está
 * de pé e que o Postgres aceitou a escrita. Isto aqui prova.
 *
 * Só roda quando a suíte é apontada para um site publicado:
 *   PLAYWRIGHT_BASE_URL=https://quantical.com.br npx playwright test producao
 */
const ALVO = process.env.PLAYWRIGHT_BASE_URL;

test.skip(!ALVO, "só roda contra um site publicado (defina PLAYWRIGHT_BASE_URL)");

test("a tentativa sai do navegador e chega no banco de produção", async ({ page }) => {
  await page.goto("/");

  // Identidade descartável, para o dado deste teste ser localizável e
  // removível sem tocar em ninguém.
  const alunoId = await page.evaluate(() => {
    const id = crypto.randomUUID();
    window.localStorage.setItem(
      "quantical:progress:v2",
      JSON.stringify({
        version: 2,
        completed: [],
        completedAt: {},
        quizScores: {},
        streak: 0,
        projects: [],
        deletedProjects: {},
        unlockedOverrides: [],
        alunoId: id,
        tentativas: [],
        revisao: {},
      }),
    );
    return id;
  });

  await page.goto("/curso/iniciante/bits-e-qubits/teoria");
  await page.getByRole("button", { name: /O qubit sorteia mais rápido/i }).click();
  await page.getByRole("button", { name: /80%, porque β = 0,8/i }).click();
  await page.getByRole("button", { name: /apenas uma convenção de notação/i }).click();
  await page.getByRole("button", { name: /Verificar respostas/i }).click();

  await expect(page.getByText("0 de 3 · 0%")).toBeVisible();

  // A marca de sincronizada só é aplicada depois que a API confirma. Se ela
  // aparece, a linha existe no Postgres de produção.
  await expect
    .poll(
      async () =>
        page.evaluate(() => {
          const bruto = window.localStorage.getItem("quantical:progress:v2");
          const estado = bruto ? JSON.parse(bruto) : { tentativas: [] };
          return estado.tentativas.filter((item: { sincronizada?: boolean }) => item.sincronizada)
            .length;
        }),
      { timeout: 20_000 },
    )
    .toBe(3);

  // O agregado é o outro sentido do laço: o que os alunos erram volta em
  // números. Aqui só confirmamos que ele responde sem erro.
  const agregado = await page.evaluate(async () => {
    const resposta = await fetch("/api/agregado?licao=iniciante/bits-e-qubits/teoria");
    return { status: resposta.status, corpo: await resposta.json() };
  });
  expect(agregado.status).toBe(200);
  expect(Array.isArray(agregado.corpo.itens)).toBe(true);

  console.log(`aluno de teste: ${alunoId}`);
});
