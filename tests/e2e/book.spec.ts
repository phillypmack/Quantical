import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test("o livro apresenta o arco completo sem fingir páginas ainda não escritas", async ({ page }) => {
  await page.goto("/livro");
  await expect(page.getByRole("heading", { name: "O Arquivo da Luz" })).toBeVisible();
  await expect(page.getByText("Duzentas e dezesseis páginas.")).toBeVisible();
  await expect(page.getByText("090", { exact: true })).toBeVisible();
  await expect(page.getByText(/páginas publicadas de 216/i)).toBeVisible();
  await expect(page.getByRole("link", { name: "Ler capítulo" })).toHaveCount(10);
  await expect(page.getByText(/Planejado · p. 91–99/)).toBeVisible();
});

test("a leitura guarda a página, mostra ciência e expõe as fontes", async ({ page }) => {
  await page.goto("/livro/1");
  await expect(page.getByRole("heading", { name: "A oficina do Sol" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "O que é radiação térmica?" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Fontes desta página" })).toBeVisible();
  await expect(page.getByRole("link", { name: /Max Planck \(1901\)/ })).toHaveAttribute("target", "_blank");

  await page.getByRole("link", { name: /Próxima página/ }).click();
  await expect(page).toHaveURL(/\/livro\/2$/);
  await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem("quantical:book-progress:v1")!).lastPage)).toBe(2);

  await page.goto("/livro");
  await expect(page.getByRole("link", { name: "Retomar na página 2" })).toBeVisible();
});

test("livro é navegável no celular e não tem violações graves de acessibilidade", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/livro/1");
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow).toBeLessThanOrEqual(1);

  const results = await new AxeBuilder({ page }).analyze();
  const blocking = results.violations.filter(
    (violation) => violation.impact === "critical" || violation.impact === "serious",
  );
  expect(blocking, blocking.map((item) => item.id).join(", ")).toEqual([]);
});
