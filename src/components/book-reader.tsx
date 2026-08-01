import Link from "next/link";
import { ArrowLeft, ArrowRight, BookOpen, LibraryBig } from "lucide-react";

import type { BookChapterPlan, BookPage, BookReference } from "@/data/book";
import { BOOK_TOTAL_PAGES } from "@/data/book";
import { audiolivroCapitulos } from "@/data/audio/audiolivro";
import { AudiolivroPlayer } from "./audio/audiolivro-player";
import { BookProgressMarker } from "./book-progress";

type BookReaderProps = {
  page: BookPage;
  chapter: BookChapterPlan;
  references: BookReference[];
  previousPage?: number;
  nextPage?: number;
};

export function BookReader({ page, chapter, references, previousPage, nextPage }: BookReaderProps) {
  const progress = (page.number / BOOK_TOTAL_PAGES) * 100;
  // Só aparece quando o capítulo já foi narrado. São dez horas de síntese, e
  // ela vai ficando pronta capítulo a capítulo — a página não pode prometer
  // áudio que ainda não existe.
  const narracao = audiolivroCapitulos.find((item) => item.numero === page.chapter);
  const firstHalf = page.paragraphs.slice(0, 3);
  const secondHalf = page.paragraphs.slice(3);

  return (
    <div className="book-reader-shell">
      <header className="book-reader-bar">
        <Link href="/livro">
          <LibraryBig aria-hidden="true" size={17} /> Sumário
        </Link>
        <div aria-label={`Página ${page.number} de ${BOOK_TOTAL_PAGES}`} className="book-page-progress">
          <span>{page.number} / {BOOK_TOTAL_PAGES}</span>
          <i style={{ width: `${progress}%` }} />
        </div>
        <BookProgressMarker pageNumber={page.number} />
      </header>

      <main className="book-leaf">
        <div className="book-leaf-heading">
          <span>{page.kicker}</span>
          <h1>{page.title}</h1>
          <p>{chapter.subtitle}</p>
        </div>

        {narracao && <AudiolivroPlayer capitulo={narracao} pagina={page.number} />}

        <article className="book-prose">
          {firstHalf.map((paragraph, index) => <p key={`a-${index}`}>{paragraph}</p>)}

          <aside className="book-science-note" aria-label="Nota científica">
            <span><BookOpen aria-hidden="true" size={15} /> Caderno de campo</span>
            <h2>{page.science.title}</h2>
            <p>{page.science.body}</p>
            {page.science.formula && <code>{page.science.formula}</code>}
          </aside>

          {secondHalf.map((paragraph, index) => <p key={`b-${index}`}>{paragraph}</p>)}
        </article>

        <section className="book-references" aria-labelledby="referencias-da-pagina">
          <h2 id="referencias-da-pagina">Fontes desta página</h2>
          <ol>
            {references.map((reference) => (
              <li key={reference.id}>
                <a href={reference.url} rel="noreferrer" target="_blank">
                  <strong>{reference.authors} ({reference.year}).</strong> {reference.title}.
                </a>
                <span>{reference.venue}. {reference.note}</span>
              </li>
            ))}
          </ol>
        </section>

        <nav className="book-pagination" aria-label="Navegação entre páginas">
          {previousPage ? (
            <Link href={`/livro/${previousPage}`} rel="prev">
              <ArrowLeft aria-hidden="true" size={17} />
              <span><small>Página anterior</small>{previousPage}</span>
            </Link>
          ) : <span />}
          {nextPage ? (
            <Link href={`/livro/${nextPage}`} rel="next">
              <span><small>Próxima página</small>{nextPage}</span>
              <ArrowRight aria-hidden="true" size={17} />
            </Link>
          ) : (
            <Link href="/livro#sumario">
              <span><small>Capítulo concluído</small>Voltar ao sumário</span>
              <ArrowRight aria-hidden="true" size={17} />
            </Link>
          )}
        </nav>
      </main>
    </div>
  );
}
