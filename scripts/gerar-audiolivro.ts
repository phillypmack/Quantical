/**
 * Transforma O Arquivo da Luz em roteiros para a Dubla.
 *
 * Um roteiro por capítulo — 24 arquivos JSON — porque é assim que um
 * audiolivro se ouve: em sessões que começam e terminam num lugar, não num
 * bloco único de dez horas.
 *
 * DUAS VOZES, e a divisão não é enfeite. O livro promete "leia como ficção,
 * verifique como ciência", e a página tem exatamente essas duas camadas:
 * `paragraphs` conduz a história, `science` sustenta o que ela afirma. Nina
 * narra, Téo lê as notas. A troca de voz é o que torna audível a fronteira
 * que na página é visual — sem ela, a nota vira continuação da ficção.
 *
 * Uso: npx tsx scripts/gerar-audiolivro.ts [destino]
 */

import { mkdirSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";

import { bookChapters, bookPages } from "../src/data/book";

type Fala = { voz: string; texto: string; pausa?: number };
type Roteiro = {
  id: string;
  titulo: string;
  resumo: string;
  perfil: "livro";
  falas: Fala[];
  /**
   * Página do livro -> índice da fala em que ela começa.
   *
   * É o que permite abrir a página 7 e o áudio começar exatamente ali, em vez
   * de no início do capítulo. A Dubla devolve o tempo de cada fala na
   * transcrição; cruzando as duas coisas, o índice vira segundo.
   *
   * A Dubla ignora campos que não conhece, então isto viaja de carona sem
   * mexer no cache — a chave dele é o texto de cada fala, não o arquivo.
   */
  paginas: Record<string, number>;
};

const NARRADORA = "nina";
const CIENTISTA = "teo";

const PAUSA = {
  paragrafo: 0.6,
  dialogo: 0.5,
  pergunta: 0.8,
  ultimaFrase: 0.9,
  antesDaNota: 1.4,
  depoisDaNota: 1.2,
  pagina: 1.6,
  depoisDoTitulo: 2.0,
} as const;

/**
 * O kicker traz um `·` como separador visual ("Capítulo 1 · A cidade que
 * brilhava errado"). Falado, esse ponto vira "vezes" — no perfil de física ele
 * é multiplicação. Aqui vira pausa, que é o que ele significa na página.
 */
/**
 * Junta frases sem empilhar pontuação.
 *
 * Muitos títulos de nota já terminam em "?" ("O que é radiação térmica?"), e
 * concatenar com ". " produzia "térmica?. É radiação…" — uma interrogação
 * seguida de ponto, que o XTTS lê como duas pausas.
 */
function juntar(...partes: string[]): string {
  return partes
    .map((parte) => parte.trim())
    .filter(Boolean)
    .map((parte, indice, todas) =>
      indice === todas.length - 1 || /[.!?…:]$/.test(parte) ? parte : `${parte}.`,
    )
    .join(" ");
}

function kickerFalado(kicker: string): string {
  return kicker
    .split("·")
    .map((parte) => parte.trim())
    .filter(Boolean)
    .join(". ");
}

/** Um capítulo inteiro, na ordem em que se ouve. */
function roteiroDoCapitulo(numero: number): Roteiro {
  const plano = bookChapters.find((item) => item.number === numero);
  if (!plano) throw new Error(`capítulo ${numero} não existe no outline`);

  const paginas = bookPages
    .filter((pagina) => pagina.chapter === numero)
    .sort((a, b) => a.number - b.number);

  if (paginas.length === 0) throw new Error(`capítulo ${numero} não tem páginas escritas`);

  const falas: Fala[] = [];
  const paginasNaFala: Record<string, number> = {};

  function adicionar(voz: string, texto: string, pausa?: number) {
    const anterior = falas.at(-1)?.texto.trimEnd();
    const depoisDePergunta = anterior?.endsWith("?") ? PAUSA.pergunta : 0;
    const pausaEfetiva = pausa === undefined ? undefined : Math.max(pausa, depoisDePergunta);
    falas.push({ voz, texto, ...(pausaEfetiva === undefined ? {} : { pausa: pausaEfetiva }) });
  }

  // Abertura: diz onde o ouvinte está. Num audiolivro não há número de página
  // para consultar, então o áudio precisa se situar sozinho.
  adicionar(NARRADORA, juntar(`Capítulo ${numero}`, plano.title, plano.subtitle));

  for (const [indiceDaPagina, pagina] of paginas.entries()) {
    // Marca onde esta página começa, ANTES de empilhar as falas dela.
    paginasNaFala[String(pagina.number)] = falas.length;

    // O título da seção substitui a virada de página. É curto e evocativo
    // ("A oficina do Sol"), então serve de marco sem virar burocracia.
    adicionar(
      NARRADORA,
      juntar(pagina.title, kickerFalado(pagina.kicker)),
      indiceDaPagina === 0 ? PAUSA.depoisDoTitulo : Math.max(PAUSA.pagina, PAUSA.depoisDaNota),
    );

    for (const [indiceDoParagrafo, paragrafo] of pagina.paragraphs.entries()) {
      const dialogo = paragrafo.trimStart().startsWith("—");
      const ultimo = indiceDoParagrafo === pagina.paragraphs.length - 1;
      const pausa = ultimo
        ? PAUSA.ultimaFrase
        : dialogo
          ? PAUSA.dialogo
          : PAUSA.paragrafo;
      adicionar(NARRADORA, paragrafo, pausa);
    }

    // A fórmula fica de fora de propósito: `u(ν,T) = (8πhν³/c³) / (e^(hν/kT) − 1)`
    // dita em voz alta é ruído, e o corpo da nota já explica a física em
    // prosa. Quem quiser a expressão a tem na página, que continua existindo.
    adicionar(
      CIENTISTA,
      juntar("Nota científica", pagina.science.title, pagina.science.body),
      PAUSA.antesDaNota,
    );
  }

  return {
    id: `livro/ch${String(numero).padStart(2, "0")}`,
    titulo: `${plano.title}`,
    resumo: plano.subtitle,
    perfil: "livro",
    falas,
    paginas: paginasNaFala,
  };
}

function main() {
  const destino = resolve(process.argv[2] ?? "../Dubla/work/livro/roteiros");
  mkdirSync(destino, { recursive: true });

  const capitulos = [...new Set(bookPages.map((pagina) => pagina.chapter))].sort((a, b) => a - b);

  let totalFalas = 0;
  let totalChars = 0;

  for (const numero of capitulos) {
    const roteiro = roteiroDoCapitulo(numero);
    const arquivo = join(destino, `${roteiro.id.replace("/", "-")}.json`);
    writeFileSync(arquivo, JSON.stringify(roteiro, null, 2) + "\n", "utf8");

    const chars = roteiro.falas.reduce((soma, fala) => soma + fala.texto.length, 0);
    totalFalas += roteiro.falas.length;
    totalChars += chars;

    // 13,8 caracteres por segundo é a velocidade de fala medida pelo autor da
    // Dubla, e é o que `narrar.py` usa para detectar quando o XTTS engasga.
    const minutos = chars / 13.8 / 60;
    console.log(
      `ch${String(numero).padStart(2, "0")}  ${String(roteiro.falas.length).padStart(3)} falas  ` +
        `${String(chars).padStart(6)} chars  ~${minutos.toFixed(1)} min  ${plano(numero)}`,
    );
  }

  const horas = totalChars / 13.8 / 3600;
  console.log(
    `\n${capitulos.length} capítulos · ${totalFalas} falas · ` +
      `${totalChars.toLocaleString("pt-BR")} caracteres · ~${horas.toFixed(1)} h de áudio`,
  );
  console.log(`escritos em ${destino}`);
}

function plano(numero: number) {
  return bookChapters.find((item) => item.number === numero)?.title ?? "";
}

main();
