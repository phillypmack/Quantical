import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test("landing apresenta a proposta e a demonstração Hadamard", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /O futuro não é binário/i })).toBeVisible();
  await page.getByRole("button", { name: "Executar circuito" }).click();
  await expect(page.getByText("O qubit está em uma superposição equilibrada.")).toBeVisible();
  await expect(page.getByText("50%", { exact: true })).toHaveCount(2);
});

test("aluno conclui uma aula e vê o progresso salvo", async ({ page }) => {
  await page.goto("/curso/iniciante/bits-e-qubits/teoria");
  await page.getByRole("button", { name: /^A / }).click();
  await page.getByRole("button", { name: "Verificar resposta" }).click();
  await expect(page.getByText("aula concluída!", { exact: false })).toBeVisible();

  await page.goto("/progresso");
  await expect(page.getByText("1", { exact: true }).first()).toBeVisible();
  await expect(page.getByRole("heading", { name: "Do bit ao qubit" })).toBeVisible();
});

test("laboratório executa código Qiskit e mostra estado de Bell", async ({ page }) => {
  await page.goto("/laboratorio");
  await page.getByRole("tab", { name: "Código" }).click();
  await expect(page.getByLabel("Código Python Qiskit")).toContainText("qc.cx(0, 1)");
  await page.getByRole("button", { name: "Executar" }).click();
  await expect(page.getByText(/estado de Bell/i)).toBeVisible();
  await page.getByRole("button", { name: "Estado" }).click();
  await expect(page.getByText("|00⟩")).toBeVisible();
  await expect(page.getByText("|11⟩")).toBeVisible();
});

test("páginas principais não criam rolagem horizontal no celular", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  for (const path of ["/", "/aprender", "/laboratorio", "/progresso"]) {
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

test("landing e laboratório não têm violações graves de acessibilidade", async ({ page }) => {
  test.setTimeout(60_000);
  for (const path of ["/", "/laboratorio"]) {
    await page.goto(path);
    const results = await new AxeBuilder({ page }).analyze();
    const blocking = results.violations.filter(
      (violation) => violation.impact === "critical" || violation.impact === "serious",
    );
    expect(blocking, `${path}: ${blocking.map((item) => item.id).join(", ")}`).toEqual([]);
  }
});
