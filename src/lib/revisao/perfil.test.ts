import { describe, expect, it } from "vitest";

import { equivocos, getEquivoco } from "@/data/equivocos";
import { getLesson } from "@/data/lessons";
import { FORCA_FIRME, FORCA_MAXIMA } from "./agenda";
import { fracaoSuperada, hrefDaDemolicao, perfilDeEquivocos } from "./perfil";
import type { Revisao, Tentativa } from "./types";

const alvo = getEquivoco("h-e-sorteio")!;

const erro = (equivocoId: string, em: string, id = em): Tentativa => ({
  id,
  tipo: "quiz",
  licaoId: "iniciante/bits-e-qubits/experimento",
  itemId: "q1",
  acertou: false,
  conceitos: [],
  equivocoId,
  em,
});

const firme = (conceitoId: string, forca = FORCA_FIRME): Revisao => ({
  conceitoId,
  forca,
  proximaEm: "2030-01-01",
  errosTotais: 0,
});

const agendaFirme = (equivocoId: string, forca = FORCA_FIRME) =>
  Object.fromEntries(
    getEquivoco(equivocoId)!.conceitos.map((id) => [id, firme(id, forca)]),
  );

describe("perfil de equívocos", () => {
  it("conta quantas vezes o pensamento apareceu e quando foi a última", () => {
    const perfil = perfilDeEquivocos(
      [
        erro("h-e-sorteio", "2026-07-30T10:00:00.000Z"),
        erro("h-e-sorteio", "2026-07-10T10:00:00.000Z"),
        erro("h-e-sorteio", "2026-07-20T10:00:00.000Z"),
      ],
      {},
    );
    expect(perfil).toHaveLength(1);
    expect(perfil[0].vezes).toBe(3);
    expect(perfil[0].ultimaEm).toBe("2026-07-30T10:00:00.000Z");
    expect(perfil[0].equivoco.id).toBe("h-e-sorteio");
  });

  it("acerto nunca acusa o aluno de um equívoco", () => {
    const perfil = perfilDeEquivocos(
      [{ ...erro("h-e-sorteio", "2026-07-30T10:00:00.000Z"), acertou: true }],
      {},
    );
    expect(perfil).toEqual([]);
  });

  it("ignora equívoco que não existe mais na taxonomia", () => {
    // Um id renomeado não pode derrubar o painel nem inventar uma entrada.
    const perfil = perfilDeEquivocos([erro("equivoco-removido", "2026-07-30T10:00:00.000Z")], {});
    expect(perfil).toEqual([]);
  });

  it("só marca como superado quando TODOS os conceitos estão firmes", () => {
    const [primeiro, ...resto] = alvo.conceitos;
    const parcial = {
      ...Object.fromEntries(resto.map((id) => [id, firme(id)])),
      [primeiro]: firme(primeiro, FORCA_FIRME - 1),
    };
    const tentativas = [erro(alvo.id, "2026-07-30T10:00:00.000Z")];

    expect(perfilDeEquivocos(tentativas, parcial)[0].superado).toBe(false);
    expect(perfilDeEquivocos(tentativas, agendaFirme(alvo.id))[0].superado).toBe(true);
  });

  it("um acerto isolado não conta como superado", () => {
    // Força 1 é o acerto logo depois de ler a explicação: memória curta.
    const perfil = perfilDeEquivocos(
      [erro(alvo.id, "2026-07-30T10:00:00.000Z")],
      agendaFirme(alvo.id, 1),
    );
    expect(perfil[0].superado).toBe(false);
  });

  it("os ainda vivos vêm antes dos superados, e os mais frequentes primeiro", () => {
    const perfil = perfilDeEquivocos(
      [
        erro("h-e-sorteio", "2026-07-30T10:00:00.000Z", "a"),
        erro("medir-e-ler", "2026-07-29T10:00:00.000Z", "b"),
        erro("medir-e-ler", "2026-07-28T10:00:00.000Z", "c"),
      ],
      agendaFirme("medir-e-ler"),
    );
    expect(perfil.map((item) => item.equivoco.id)).toEqual(["h-e-sorteio", "medir-e-ler"]);
  });

  it("sem tentativas, não há perfil nem fração", () => {
    expect(perfilDeEquivocos([], {})).toEqual([]);
    expect(fracaoSuperada([])).toBe(0);
  });

  it("a fração superada mede o caminho andado", () => {
    const perfil = perfilDeEquivocos(
      [erro("h-e-sorteio", "2026-07-30T10:00:00.000Z", "a"), erro("medir-e-ler", "2026-07-29T10:00:00.000Z", "b")],
      agendaFirme("medir-e-ler"),
    );
    expect(fracaoSuperada(perfil)).toBe(0.5);
  });
});

describe("caminho para a demolição", () => {
  it("todo equívoco aponta para uma aula que existe", () => {
    for (const equivoco of equivocos) {
      const href = hrefDaDemolicao(equivoco);
      expect(getLesson(equivoco.demolicao.licaoId), equivoco.id).toBeDefined();
      expect(href.startsWith("/curso/"), equivoco.id).toBe(true);
    }
  });

  it("a força firme cabe na escala do agendador", () => {
    expect(FORCA_FIRME).toBeLessThanOrEqual(FORCA_MAXIMA);
  });
});
