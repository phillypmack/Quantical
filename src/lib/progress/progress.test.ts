import { describe, expect, it } from "vitest";

import { buscarAgregado, enviarTentativas } from "./api";
import { mergeProgress, projectsToDelete } from "./merge";
import {
  MAX_TENTATIVAS,
  aplicarTentativa,
  applyCompletion,
  dayDifference,
  emptyState,
  marcarSincronizadas,
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

describe("sincronização com a API", () => {
  const pendente = (id: string, sincronizada = false): Tentativa => ({
    id,
    tipo: "quiz",
    licaoId: "iniciante/superposicao/teoria",
    itemId: "q1",
    acertou: false,
    conceitos: ["superposicao"],
    em: "2026-07-30T10:00:00.000Z",
    sincronizada,
  });

  it("marca só o que a API confirmou", () => {
    const state = base({ tentativas: [pendente("a"), pendente("b"), pendente("c")] });
    const depois = marcarSincronizadas(state, ["a", "c"]);
    expect(depois.tentativas.map((item) => item.sincronizada)).toEqual([true, false, true]);
  });

  it("marcar não apaga nada", () => {
    // Apagar o que subiu deixaria a revisão dependente da rede para saber o
    // que o aluno errou — e o site precisa funcionar com a API fora do ar.
    const state = base({ tentativas: [pendente("a")] });
    expect(marcarSincronizadas(state, ["a"]).tentativas).toHaveLength(1);
  });

  it("lista vazia devolve o mesmo objeto, sem render à toa", () => {
    const state = base({ tentativas: [pendente("a")] });
    expect(marcarSincronizadas(state, [])).toBe(state);
  });

  it("id desconhecido é ignorado sem quebrar", () => {
    const state = base({ tentativas: [pendente("a")] });
    expect(marcarSincronizadas(state, ["z"]).tentativas[0].sincronizada).toBe(false);
  });

  it("a marca sobrevive ao localStorage", () => {
    const state = marcarSincronizadas(base({ tentativas: [pendente("a")] }), ["a"]);
    const round = parseProgressState(JSON.parse(JSON.stringify(state)));
    expect(round.tentativas[0].sincronizada).toBe(true);
  });
});

describe("cliente da API é tolerante a falha", () => {
  const tentativa: Tentativa = {
    id: "aaaaaaaa-0000-4000-8000-000000000001",
    tipo: "quiz",
    licaoId: "L",
    itemId: "i",
    acertou: false,
    conceitos: [],
    em: "2026-07-30T10:00:00.000Z",
  };
  const aluno = "11111111-2222-3333-4444-555555555555";

  const comFetch = async (impostor: typeof fetch, executar: () => Promise<unknown>) => {
    const original = globalThis.fetch;
    globalThis.fetch = impostor;
    try {
      return await executar();
    } finally {
      globalThis.fetch = original;
    }
  };

  it("rede caída não lança — só volta como não sincronizado", async () => {
    const resultado = await comFetch(
      () => Promise.reject(new TypeError("Failed to fetch")),
      () => enviarTentativas(aluno, [tentativa]),
    );
    expect(resultado).toEqual({ ok: false, gravadas: 0 });
  });

  it("500 do servidor não lança", async () => {
    const resultado = await comFetch(
      () => Promise.resolve(new Response("{}", { status: 500 })),
      () => enviarTentativas(aluno, [tentativa]),
    );
    expect(resultado).toEqual({ ok: false, gravadas: 0 });
  });

  it("resposta que não é JSON não lança", async () => {
    const resultado = await comFetch(
      () => Promise.resolve(new Response("<html>502</html>", { status: 200 })),
      () => enviarTentativas(aluno, [tentativa]),
    );
    expect(resultado).toEqual({ ok: false, gravadas: 0 });
  });

  it("sucesso devolve quantas foram gravadas", async () => {
    const resultado = await comFetch(
      () => Promise.resolve(Response.json({ gravadas: 1 })),
      () => enviarTentativas(aluno, [tentativa]),
    );
    expect(resultado).toEqual({ ok: true, gravadas: 1 });
  });

  it("lista vazia não chega a tocar na rede", async () => {
    let chamou = false;
    const resultado = await comFetch(
      () => {
        chamou = true;
        return Promise.reject(new Error("não deveria"));
      },
      () => enviarTentativas(aluno, []),
    );
    expect(chamou).toBe(false);
    expect(resultado).toEqual({ ok: true, gravadas: 0 });
  });

  it("o agregado devolve lista vazia quando a API não responde", async () => {
    const resultado = await comFetch(
      () => Promise.reject(new TypeError("Failed to fetch")),
      () => buscarAgregado("iniciante/superposicao/teoria"),
    );
    expect(resultado).toEqual([]);
  });

  it("não manda os conceitos: o servidor não precisa deles para agregar", async () => {
    let corpoEnviado = "";
    await comFetch(
      (_url, init) => {
        corpoEnviado = String(init?.body);
        return Promise.resolve(Response.json({ gravadas: 1 }));
      },
      () => enviarTentativas(aluno, [{ ...tentativa, conceitos: ["superposicao"] }]),
    );
    expect(corpoEnviado).not.toContain("conceitos");
    expect(corpoEnviado).toContain(tentativa.id);
  });
});
