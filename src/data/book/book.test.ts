import { describe, expect, it } from "vitest";

import {
  BOOK_TOTAL_PAGES,
  PAGES_PER_CHAPTER,
  bookChapters,
  bookPageByNumber,
  bookPages,
  bookReferenceById,
  bookReferences,
} from ".";

describe("arquitetura editorial do livro", () => {
  it("planeja exatamente 216 páginas em 24 capítulos de nove páginas", () => {
    expect(BOOK_TOTAL_PAGES).toBeGreaterThanOrEqual(200);
    expect(bookChapters).toHaveLength(24);
    expect(bookChapters.at(-1)?.pageEnd).toBe(BOOK_TOTAL_PAGES);

    for (const [index, chapter] of bookChapters.entries()) {
      expect(chapter.number).toBe(index + 1);
      expect(chapter.pageStart).toBe(index * PAGES_PER_CHAPTER + 1);
      expect(chapter.pageEnd - chapter.pageStart + 1).toBe(PAGES_PER_CHAPTER);
      expect(chapter.concepts.length).toBeGreaterThanOrEqual(3);
    }
  });

  it("não usa páginas-fantasma para inflar a contagem publicada", () => {
    expect(bookPages.map((page) => page.number)).toEqual(
      Array.from({ length: bookPages.length }, (_, index) => index + 1),
    );
    expect(bookPages.length).toBeLessThan(BOOK_TOTAL_PAGES);
  });
});

describe("capítulos escritos", () => {
  it("publica as duas primeiras partes e os capítulos 9 a 11 completos, página por página", () => {
    expect(bookPages.filter((page) => page.chapter === 1)).toHaveLength(PAGES_PER_CHAPTER);
    expect(bookPages.filter((page) => page.chapter === 2)).toHaveLength(PAGES_PER_CHAPTER);
    expect(bookPages.filter((page) => page.chapter === 3)).toHaveLength(PAGES_PER_CHAPTER);
    expect(bookPages.filter((page) => page.chapter === 4)).toHaveLength(PAGES_PER_CHAPTER);
    expect(bookPages.filter((page) => page.chapter === 5)).toHaveLength(PAGES_PER_CHAPTER);
    expect(bookPages.filter((page) => page.chapter === 6)).toHaveLength(PAGES_PER_CHAPTER);
    expect(bookPages.filter((page) => page.chapter === 7)).toHaveLength(PAGES_PER_CHAPTER);
    expect(bookPages.filter((page) => page.chapter === 8)).toHaveLength(PAGES_PER_CHAPTER);
    expect(bookPages.filter((page) => page.chapter === 9)).toHaveLength(PAGES_PER_CHAPTER);
    expect(bookPages.filter((page) => page.chapter === 10)).toHaveLength(PAGES_PER_CHAPTER);
    expect(bookPages.filter((page) => page.chapter === 11)).toHaveLength(PAGES_PER_CHAPTER);
    expect(bookPageByNumber.get(1)?.title).toBe("A oficina do Sol");
    expect(bookPageByNumber.get(9)?.title).toBe("A menor assinatura");
    expect(bookPageByNumber.get(10)?.title).toBe("A chave violeta");
    expect(bookPageByNumber.get(18)?.title).toBe("A linha impossível de desver");
    expect(bookPageByNumber.get(19)?.title).toBe("O alvo que devolveu outra cor");
    expect(bookPageByNumber.get(27)?.title).toBe("Uma unidade completa de impacto");
    expect(bookPageByNumber.get(28)?.title).toBe("A folha que quase não existia");
    expect(bookPageByNumber.get(36)?.title).toBe("Um modelo brilhante e insuficiente");
    expect(bookPageByNumber.get(37)?.title).toBe("A pergunta invertida");
    expect(bookPageByNumber.get(45)?.title).toBe("O caminho que não cabia");
    expect(bookPageByNumber.get(46)?.title).toBe("O vidro que respirou");
    expect(bookPageByNumber.get(54)?.title).toBe("O níquel respondeu");
    expect(bookPageByNumber.get(55)?.title).toBe("O relógio sem ponteiros");
    expect(bookPageByNumber.get(63)?.title).toBe("O mapa sem legenda");
    expect(bookPageByNumber.get(64)?.title).toBe("O choque sem trajetória");
    expect(bookPageByNumber.get(72)?.title).toBe("A porta das duas fendas");
    expect(bookPageByNumber.get(73)?.title).toBe("Uma marca por vez");
    expect(bookPageByNumber.get(81)?.title).toBe("A pergunta que mudava a resposta");
    expect(bookPageByNumber.get(82)?.title).toBe("O mapa apertado");
    expect(bookPageByNumber.get(90)?.title).toBe("O limite virou caminho");
    expect(bookPageByNumber.get(91)?.title).toBe("O forno de prata");
    expect(bookPageByNumber.get(99)?.title).toBe("A bússola partida");
  });

  it.each(bookPages.map((page) => [page.number, page] as const))(
    "página %s tem narrativa substancial, ciência e fontes resolvidas",
    (_number, page) => {
      const body = page.paragraphs.join(" ");
      expect(page.paragraphs.length).toBeGreaterThanOrEqual(5);
      expect(body.length).toBeGreaterThan(1_300);
      expect(page.science.body.length).toBeGreaterThan(120);
      expect(page.references.length).toBeGreaterThanOrEqual(2);
      for (const reference of page.references) {
        expect(bookReferenceById.has(reference), reference).toBe(true);
      }
    },
  );

  it("não contém fontes duplicadas nem links sem DOI ou instituição reconhecível", () => {
    expect(new Set(bookReferences.map((reference) => reference.id)).size).toBe(bookReferences.length);
    for (const reference of bookReferences) {
      expect(reference.url).toMatch(/^https:\/\//);
      expect(["fonte-primaria", "revisao", "institucional"]).toContain(reference.kind);
    }
  });
});
