import { describe, expect, it } from "vitest";

import {
  FORCA_MAXIMA,
  INTERVALOS,
  agendar,
  consolidados,
  diasAte,
  registrar,
  somarDias,
  vencidos,
} from "./agenda";
import type { Revisao, Tentativa } from "./types";

const HOJE = "2026-07-31";

const tentativa = (overrides: Partial<Tentativa> = {}): Tentativa => ({
  id: "t1",
  tipo: "quiz",
  licaoId: "iniciante/superposicao/teoria",
  itemId: "q1",
  acertou: false,
  conceitos: ["fase"],
  em: `${HOJE}T12:00:00.000Z`,
  ...overrides,
});

describe("aritmética de datas", () => {
  it("soma dias sem escorregar por fuso", () => {
    expect(somarDias("2026-07-31", 1)).toBe("2026-08-01");
    expect(somarDias("2026-02-28", 1)).toBe("2026-03-01"); // 2026 não é bissexto
    expect(somarDias("2026-12-31", 1)).toBe("2027-01-01");
    expect(somarDias("2026-07-31", 0)).toBe("2026-07-31");
  });
});

describe("agendamento", () => {
  it("errar pela primeira vez traz de volta amanhã", () => {
    const revisao = agendar(undefined, false, HOJE);
    expect(revisao.forca).toBe(0);
    expect(revisao.proximaEm).toBe(somarDias(HOJE, 1));
    expect(revisao.errosTotais).toBe(1);
  });

  it("acertar de primeira já espaça", () => {
    const revisao = agendar(undefined, true, HOJE);
    expect(revisao.forca).toBe(0);
    expect(revisao.proximaEm).toBe(somarDias(HOJE, INTERVALOS[0]));
    expect(revisao.errosTotais).toBe(0);
  });

  it("acertos sucessivos empurram o intervalo", () => {
    let revisao = agendar(undefined, true, HOJE);
    const intervalos: number[] = [];
    for (let i = 0; i < 5; i += 1) {
      revisao = agendar(revisao, true, HOJE);
      intervalos.push(diasAte(revisao, HOJE));
    }
    expect(intervalos).toEqual([3, 7, 16, 35, 90]);
  });

  it("a força satura no topo", () => {
    let revisao = agendar(undefined, true, HOJE);
    for (let i = 0; i < 20; i += 1) revisao = agendar(revisao, true, HOJE);
    expect(revisao.forca).toBe(FORCA_MAXIMA);
    expect(diasAte(revisao, HOJE)).toBe(INTERVALOS[FORCA_MAXIMA]);
  });

  // Se errou, não estava firme — suavizar aqui só adiaria o problema.
  it("errar zera a força por mais alta que estivesse", () => {
    let revisao = agendar(undefined, true, HOJE);
    for (let i = 0; i < 4; i += 1) revisao = agendar(revisao, true, HOJE);
    expect(revisao.forca).toBeGreaterThan(2);

    const depoisDoErro = agendar(revisao, false, HOJE);
    expect(depoisDoErro.forca).toBe(0);
    expect(depoisDoErro.proximaEm).toBe(somarDias(HOJE, 1));
  });

  it("acumula o total de erros ao longo do tempo", () => {
    let revisao = agendar(undefined, false, HOJE);
    revisao = agendar(revisao, false, HOJE);
    revisao = agendar(revisao, true, HOJE);
    revisao = agendar(revisao, false, HOJE);
    expect(revisao.errosTotais).toBe(3);
  });
});

describe("registro sobre a agenda", () => {
  it("uma tentativa agenda todos os conceitos que ela toca", () => {
    const agenda = registrar({}, tentativa({ conceitos: ["fase", "amplitude"] }), HOJE);
    expect(Object.keys(agenda).sort()).toEqual(["amplitude", "fase"]);
    expect(agenda.fase.conceitoId).toBe("fase");
    expect(agenda.amplitude.proximaEm).toBe(somarDias(HOJE, 1));
  });

  it("tentativa sem conceito não mexe na agenda", () => {
    const antes = { fase: agendar(undefined, true, HOJE) };
    const depois = registrar(antes, tentativa({ conceitos: [] }), HOJE);
    expect(depois).toBe(antes);
  });

  it("não muta a agenda recebida", () => {
    const antes: Record<string, Revisao> = { fase: agendar(undefined, true, HOJE) };
    const forcaOriginal = antes.fase.forca;
    registrar(antes, tentativa({ conceitos: ["fase"] }), HOJE);
    expect(antes.fase.forca).toBe(forcaOriginal);
  });
});

describe("fila do dia", () => {
  it("só devolve o que já venceu", () => {
    const agenda = {
      fase: { conceitoId: "fase", forca: 0, proximaEm: HOJE, errosTotais: 1 },
      qubit: { conceitoId: "qubit", forca: 2, proximaEm: somarDias(HOJE, 5), errosTotais: 0 },
    };
    expect(vencidos(agenda, HOJE).map((r) => r.conceitoId)).toEqual(["fase"]);
  });

  it("o mais atrasado vem primeiro", () => {
    const agenda = {
      fase: { conceitoId: "fase", forca: 0, proximaEm: HOJE, errosTotais: 1 },
      qubit: { conceitoId: "qubit", forca: 0, proximaEm: somarDias(HOJE, -4), errosTotais: 1 },
    };
    expect(vencidos(agenda, HOJE).map((r) => r.conceitoId)).toEqual(["qubit", "fase"]);
  });

  it("empatada a data, o mais errado vem primeiro", () => {
    const agenda = {
      fase: { conceitoId: "fase", forca: 0, proximaEm: HOJE, errosTotais: 1 },
      medicao: { conceitoId: "medicao", forca: 0, proximaEm: HOJE, errosTotais: 7 },
    };
    expect(vencidos(agenda, HOJE).map((r) => r.conceitoId)).toEqual(["medicao", "fase"]);
  });

  // Revisão consolida o que já passou pela cabeça do aluno; não apresenta
  // assunto novo.
  it("conceito nunca respondido nunca entra na fila", () => {
    expect(vencidos({}, HOJE)).toEqual([]);
  });

  it("depois de acertar, o conceito sai da fila de hoje", () => {
    let agenda = registrar({}, tentativa({ acertou: false }), HOJE);
    expect(vencidos(agenda, somarDias(HOJE, 1))).toHaveLength(1);

    agenda = registrar(agenda, tentativa({ acertou: true }), somarDias(HOJE, 1));
    expect(vencidos(agenda, somarDias(HOJE, 1))).toHaveLength(0);
  });
});

describe("consolidados", () => {
  it("conta só o que atingiu força alta", () => {
    let firme = agendar(undefined, true, HOJE);
    for (let i = 0; i < 3; i += 1) firme = agendar(firme, true, HOJE);
    const fraco = agendar(undefined, false, HOJE);

    const lista = consolidados({
      firme: { ...firme, conceitoId: "firme" },
      fraco: { ...fraco, conceitoId: "fraco" },
    });
    expect(lista.map((r) => r.conceitoId)).toEqual(["firme"]);
  });
});
