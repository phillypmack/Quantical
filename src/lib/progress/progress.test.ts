import { describe, expect, it } from "vitest";

import { mergeProgress, projectsToDelete } from "./merge";
import {
  MAX_TENTATIVAS,
  aplicarTentativa,
  applyCompletion,
  dayDifference,
  emptyState,
  parseProgressState,
  studyDate,
} from "./state";
import type { ProgressState } from "./types";
import type { Tentativa } from "@/lib/revisao/types";

const base = (overrides: Partial<ProgressState> = {}): ProgressState => ({
  ...emptyState,
  ...overrides,
});

describe("validação do estado persistido", () => {
  it("aceita um payload íntegro", () => {
    const parsed = parseProgressState({
      completed: ["a", "b"],
      quizScores: { a: 80 },
      streak: 3,
      projects: [{ id: "p1", title: "T", code: "qc.h(0)", updatedAt: "2026-01-01T00:00:00.000Z" }],
    });
    expect(parsed.completed).toEqual(["a", "b"]);
    expect(parsed.quizScores).toEqual({ a: 80 });
    expect(parsed.streak).toBe(3);
    expect(parsed.projects).toHaveLength(1);
  });

  // A v1 fazia spread cego: `completed: null` chegava intacto ao app e
  // derrubava todo consumidor que chamasse .includes ou .map.
  it("não deixa um payload corrompido entrar no app", () => {
    for (const corrupted of [
      { completed: null },
      { completed: "nope" },
      { projects: {} },
      { quizScores: [1, 2, 3] },
      { streak: Number.NaN },
      null,
      "string solta",
      42,
    ]) {
      const parsed = parseProgressState(corrupted);
      expect(Array.isArray(parsed.completed)).toBe(true);
      expect(Array.isArray(parsed.projects)).toBe(true);
      expect(Number.isFinite(parsed.streak)).toBe(true);
      expect(() => parsed.completed.includes("x")).not.toThrow();
    }
  });

  it("descarta itens inválidos em vez do payload inteiro", () => {
    const parsed = parseProgressState({
      completed: ["ok", 7, null, "outro"],
      projects: [{ id: "p1", title: "T", code: "" }, { id: 9 }, null],
    });
    expect(parsed.completed).toEqual(["ok", "outro"]);
    expect(parsed.projects.map((p) => p.id)).toEqual(["p1"]);
  });

  it("nunca deixa passar um circuito vazio como se fosse circuito", () => {
    const parsed = parseProgressState({
      projects: [{ id: "p1", title: "T", code: "", circuit: {} }],
    });
    expect(parsed.projects[0].circuit).toBeUndefined();
  });

  it("migra a v1 preenchendo os campos novos", () => {
    const parsed = parseProgressState({ completed: ["a"], quizScores: {}, streak: 1, projects: [] });
    expect(parsed.version).toBe(2);
    expect(parsed.deletedProjects).toEqual({});
    expect(parsed.unlockedOverrides).toEqual([]);
  });
});

describe("sequência de estudos no fuso do aluno", () => {
  // O defeito da v1: toISOString().slice(0,10) é UTC. Às 21h30 em Brasília
  // já é o dia seguinte em UTC, então a sequência contava dois dias de uma vez.
  it("21h30 em Brasília ainda é hoje", () => {
    const lateNightBrasilia = new Date("2026-07-31T00:30:00.000Z"); // 21h30 BRT do dia 30
    expect(studyDate(lateNightBrasilia)).toBe("2026-07-30");
    expect(lateNightBrasilia.toISOString().slice(0, 10)).toBe("2026-07-31"); // o jeito antigo
  });

  it("conta dias consecutivos", () => {
    expect(dayDifference("2026-07-30", "2026-07-31")).toBe(1);
    expect(dayDifference("2026-07-30", "2026-07-30")).toBe(0);
    expect(dayDifference("2026-07-30", "2026-08-05")).toBe(6);
  });

  it("não incrementa a sequência duas vezes no mesmo dia", () => {
    const manha = new Date("2026-07-30T13:00:00.000Z");
    const noite = new Date("2026-07-31T00:30:00.000Z"); // ainda dia 30 em Brasília
    const depoisDaPrimeira = applyCompletion(base(), "aula-1", 100, manha);
    const depoisDaSegunda = applyCompletion(depoisDaPrimeira, "aula-2", 100, noite);
    expect(depoisDaPrimeira.streak).toBe(1);
    expect(depoisDaSegunda.streak).toBe(1);
  });

  it("preserva a data original da primeira conclusão", () => {
    const primeira = applyCompletion(base(), "aula-1", 100, new Date("2026-07-01T10:00:00.000Z"));
    const refeita = applyCompletion(primeira, "aula-1", 100, new Date("2026-07-20T10:00:00.000Z"));
    expect(refeita.completedAt["aula-1"]).toBe("2026-07-01T10:00:00.000Z");
  });

  it("guarda a melhor nota, não a última", () => {
    const alta = applyCompletion(base(), "aula-1", 100);
    const baixa = applyCompletion(alta, "aula-1", 40);
    expect(baixa.quizScores["aula-1"]).toBe(100);
  });
});

describe("merge com o servidor", () => {
  it("traz conclusões remotas que faltavam no local", () => {
    const merged = mergeProgress(base({ completed: ["a"] }), {
      lessons: [{ lesson_id: "b", completed_at: "2026-01-01T00:00:00.000Z" }],
      projects: [],
    });
    expect(merged.completed.sort()).toEqual(["a", "b"]);
  });

  it("mantém a data de conclusão mais antiga entre local e remoto", () => {
    const local = base({
      completed: ["a"],
      completedAt: { a: "2026-05-01T00:00:00.000Z" },
    });
    const merged = mergeProgress(local, {
      lessons: [{ lesson_id: "a", completed_at: "2026-01-01T00:00:00.000Z" }],
      projects: [],
    });
    expect(merged.completedAt.a).toBe("2026-01-01T00:00:00.000Z");
  });

  // Defeito real da v1: removeProject só mexia no estado local, e o sync
  // seguinte baixava a linha de volta do servidor.
  it("projeto apagado NÃO volta no sync seguinte", () => {
    const local = base({
      projects: [],
      deletedProjects: { p1: "2026-07-30T12:00:00.000Z" },
    });
    const remote = {
      lessons: [],
      projects: [
        { id: "p1", title: "Antigo", code: "qc.h(0)", circuit: null, updated_at: "2026-07-30T10:00:00.000Z" },
      ],
    };
    expect(mergeProgress(local, remote).projects).toHaveLength(0);
    expect(projectsToDelete(local, remote.projects)).toEqual(["p1"]);
  });

  it("mas uma edição remota MAIS NOVA que a exclusão vence", () => {
    const local = base({ deletedProjects: { p1: "2026-07-30T10:00:00.000Z" } });
    const remote = {
      lessons: [],
      projects: [
        { id: "p1", title: "Editado noutro aparelho", code: "qc.x(0)", circuit: null, updated_at: "2026-07-30T18:00:00.000Z" },
      ],
    };
    expect(mergeProgress(local, remote).projects).toHaveLength(1);
    expect(projectsToDelete(local, remote.projects)).toEqual([]);
  });

  // Defeito real da v1: resetProgress era desfeito pelo sync seguinte.
  it("resetProgress NÃO é desfeito pelo sync", () => {
    const local = base({ completed: [], resetAt: "2026-07-30T12:00:00.000Z" });
    const merged = mergeProgress(local, {
      lessons: [
        { lesson_id: "antiga", completed_at: "2026-07-01T00:00:00.000Z" },
        { lesson_id: "nova", completed_at: "2026-07-30T18:00:00.000Z" },
      ],
      projects: [],
    });
    expect(merged.completed).toEqual(["nova"]);
  });

  it("resolve projeto editado nos dois lados pelo mais recente", () => {
    const local = base({
      projects: [{ id: "p1", title: "Local mais novo", code: "local", updatedAt: "2026-07-30T18:00:00.000Z" }],
    });
    const merged = mergeProgress(local, {
      lessons: [],
      projects: [{ id: "p1", title: "Remoto antigo", code: "remoto", circuit: null, updated_at: "2026-07-30T10:00:00.000Z" }],
    });
    expect(merged.projects).toHaveLength(1);
    expect(merged.projects[0].title).toBe("Local mais novo");
  });

  it("não duplica o mesmo projeto vindo dos dois lados", () => {
    const local = base({
      projects: [{ id: "p1", title: "T", code: "c", updatedAt: "2026-07-30T10:00:00.000Z" }],
    });
    const merged = mergeProgress(local, {
      lessons: [],
      projects: [{ id: "p1", title: "T", code: "c", circuit: null, updated_at: "2026-07-30T10:00:00.000Z" }],
    });
    expect(merged.projects).toHaveLength(1);
  });
});

describe("registro de tentativas", () => {
  const tentativa = (over: Partial<Tentativa> = {}): Tentativa => ({
    id: over.id ?? "t1",
    tipo: "quiz",
    licaoId: "iniciante/superposicao/teoria",
    itemId: "q1",
    acertou: false,
    conceitos: ["superposicao"],
    em: "2026-07-30T10:00:00.000Z",
    ...over,
  });

  it("guarda a tentativa e agenda o conceito que ela toca", () => {
    const next = aplicarTentativa(emptyState, tentativa(), new Date("2026-07-30T13:00:00Z"));
    expect(next.tentativas).toHaveLength(1);
    // Errou: volta para força 0 e revisa amanhã.
    expect(next.revisao.superposicao).toMatchObject({ forca: 0, proximaEm: "2026-07-31" });
  });

  it("não apaga a tentativa anterior quando o aluno refaz o quiz", () => {
    // Este é exatamente o defeito que motivou o registro: o `retry()` do quiz
    // fazia setAnswers({}) e a alternativa errada escolhida sumia.
    const errou = aplicarTentativa(emptyState, tentativa({ id: "t1", acertou: false }));
    const acertou = aplicarTentativa(errou, tentativa({ id: "t2", acertou: true }));

    expect(acertou.tentativas.map((item) => item.id)).toEqual(["t2", "t1"]);
    expect(acertou.tentativas[1].acertou).toBe(false);
  });

  it("a tentativa mais recente fica na frente e o excesso antigo é descartado", () => {
    let state: ProgressState = emptyState;
    for (let index = 0; index < MAX_TENTATIVAS + 10; index += 1) {
      state = aplicarTentativa(state, tentativa({ id: `t${index}` }));
    }
    expect(state.tentativas).toHaveLength(MAX_TENTATIVAS);
    expect(state.tentativas[0].id).toBe(`t${MAX_TENTATIVAS + 9}`);
  });

  it("uma tentativa sem conceitos é gravada mas não agenda nada", () => {
    // É o caso dos desafios, que não declaram termos do glossário.
    const next = aplicarTentativa(emptyState, tentativa({ conceitos: [], licaoId: "desafio/bell" }));
    expect(next.tentativas).toHaveLength(1);
    expect(Object.keys(next.revisao)).toHaveLength(0);
  });

  it("sobrevive à ida e volta pelo localStorage", () => {
    const state = aplicarTentativa(emptyState, tentativa({ equivocoId: "h-e-sorteio" }));
    const round = parseProgressState(JSON.parse(JSON.stringify(state)));
    expect(round.tentativas[0].equivocoId).toBe("h-e-sorteio");
    expect(round.revisao.superposicao.proximaEm).toBe(state.revisao.superposicao.proximaEm);
  });

  it("descarta tentativa corrompida sem derrubar o resto do estado", () => {
    const round = parseProgressState({
      ...emptyState,
      tentativas: [tentativa(), { id: "quebrada" }, null, "texto"],
    });
    expect(round.tentativas).toHaveLength(1);
  });
});
