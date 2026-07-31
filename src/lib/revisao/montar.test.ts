import { describe, expect, it } from "vitest";

import { lessons } from "@/data/lessons";
import { emptyState } from "@/lib/progress/state";
import type { ProgressState } from "@/lib/progress/types";
import { LIMITE_DA_SESSAO, montarRevisao } from "./montar";
import type { Revisao, Tentativa } from "./types";

const HOJE = "2026-08-01";

/** Uma aula real do catálogo, para os testes não dependerem de fixture inventada. */
const licao = lessons.find((item) => item.guided && item.quiz.length > 0)!;
const questao = licao.quiz[0];
const passoComPrevisao = licao.guided!.steps.find((step) => step.predict)!;

/** Pares (aula, pergunta) distintos do catálogo, para montar sessões maiores. */
const perguntas = lessons.flatMap((item) =>
  item.quiz.map((pergunta) => ({ licaoId: item.id, itemId: pergunta.id })),
);

const vencido = (conceitoId: string, errosTotais = 1): Revisao => ({
  conceitoId,
  forca: 0,
  proximaEm: "2026-07-25",
  errosTotais,
});

const tentativa = (over: Partial<Tentativa> = {}): Tentativa => ({
  id: `t-${Math.round(Math.random() * 1e9)}`,
  tipo: "quiz",
  licaoId: licao.id,
  itemId: questao.id,
  acertou: false,
  conceitos: ["c1"],
  em: "2026-07-24T10:00:00.000Z",
  ...over,
});

const estado = (over: Partial<ProgressState> = {}): ProgressState => ({
  ...emptyState,
  ...over,
});

describe("montagem da sessão de revisão", () => {
  it("devolve a pergunta exata que o aluno errou", () => {
    const itens = montarRevisao(
      estado({ revisao: { c1: vencido("c1") }, tentativas: [tentativa()] }),
      HOJE,
    );
    expect(itens).toHaveLength(1);
    expect(itens[0]).toMatchObject({ tipo: "quiz", conceitoId: "c1", licaoId: licao.id });
    expect(itens[0].tipo === "quiz" && itens[0].questao.id).toBe(questao.id);
  });

  it("devolve o passo do experimento quando a previsão furou", () => {
    const itens = montarRevisao(
      estado({
        revisao: { c1: vencido("c1") },
        tentativas: [tentativa({ tipo: "previsao", itemId: passoComPrevisao.id })],
      }),
      HOJE,
    );
    expect(itens[0]).toMatchObject({ tipo: "previsao" });
    expect(itens[0].tipo === "previsao" && itens[0].passo.predict).toBeDefined();
  });

  it("um conceito que não venceu ainda não aparece", () => {
    const itens = montarRevisao(
      estado({
        revisao: { c1: { ...vencido("c1"), proximaEm: "2026-08-20" } },
        tentativas: [tentativa()],
      }),
      HOJE,
    );
    expect(itens).toEqual([]);
  });

  it("acerto não vira item de revisão", () => {
    const itens = montarRevisao(
      estado({ revisao: { c1: vencido("c1") }, tentativas: [tentativa({ acertou: true })] }),
      HOJE,
    );
    expect(itens).toEqual([]);
  });

  it("um conceito vencido sem conteúdo resolvível não entra na sessão", () => {
    // A aula foi reescrita e a pergunta mudou de id. O conceito segue vencido,
    // mas prometer um item que não existe seria pior do que não prometer nada.
    const itens = montarRevisao(
      estado({
        revisao: { c1: vencido("c1") },
        tentativas: [tentativa({ itemId: "pergunta-que-nao-existe-mais" })],
      }),
      HOJE,
    );
    expect(itens).toEqual([]);
  });

  it("aula inexistente é ignorada em silêncio", () => {
    const itens = montarRevisao(
      estado({
        revisao: { c1: vencido("c1") },
        tentativas: [tentativa({ licaoId: "trilha/modulo-apagado/teoria" })],
      }),
      HOJE,
    );
    expect(itens).toEqual([]);
  });

  it("usa o erro mais recente, não o mais antigo", () => {
    const outraQuestao = licao.quiz[1] ?? licao.quiz[0];
    const itens = montarRevisao(
      estado({
        revisao: { c1: vencido("c1") },
        // A lista chega da mais recente para a mais antiga.
        tentativas: [
          tentativa({ itemId: outraQuestao.id, em: "2026-07-30T10:00:00.000Z" }),
          tentativa({ itemId: questao.id, em: "2026-07-01T10:00:00.000Z" }),
        ],
      }),
      HOJE,
    );
    expect(itens[0].tipo === "quiz" && itens[0].questao.id).toBe(outraQuestao.id);
  });

  it("não repete o mesmo item para dois conceitos diferentes", () => {
    const itens = montarRevisao(
      estado({
        revisao: { c1: vencido("c1"), c2: vencido("c2") },
        tentativas: [tentativa({ conceitos: ["c1", "c2"] })],
      }),
      HOJE,
    );
    expect(itens).toHaveLength(1);
  });

  it("prioriza o conceito mais atrasado e, no empate, o mais errado", () => {
    const itens = montarRevisao(
      estado({
        revisao: {
          poucoErrado: { ...vencido("poucoErrado", 1), proximaEm: "2026-07-31" },
          muitoErrado: { ...vencido("muitoErrado", 9), proximaEm: "2026-07-31" },
          maisAtrasado: { ...vencido("maisAtrasado", 1), proximaEm: "2026-07-10" },
        },
        tentativas: ["maisAtrasado", "muitoErrado", "poucoErrado"].map((conceito, index) =>
          tentativa({ ...perguntas[index], conceitos: [conceito] }),
        ),
      }),
      HOJE,
    );
    expect(itens.map((item) => item.conceitoId)).toEqual([
      "maisAtrasado",
      "muitoErrado",
      "poucoErrado",
    ]);
  });

  it("respeita o teto da sessão", () => {
    const conceitos = Array.from({ length: LIMITE_DA_SESSAO + 5 }, (_, index) => `c${index}`);
    const itens = montarRevisao(
      estado({
        revisao: Object.fromEntries(conceitos.map((id) => [id, vencido(id)])),
        // Todo conceito aponta para uma pergunta distinta de uma aula real.
        tentativas: conceitos.map((id, index) =>
          tentativa({ ...perguntas[index % perguntas.length], conceitos: [id] }),
        ),
      }),
      HOJE,
    );
    expect(itens.length).toBeLessThanOrEqual(LIMITE_DA_SESSAO);
  });

  it("estado zerado não gera sessão", () => {
    expect(montarRevisao(emptyState, HOJE)).toEqual([]);
  });
});
