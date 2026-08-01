import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BookMarked, FlaskConical, LibraryBig, ScrollText } from "lucide-react";

import { BookResume } from "@/components/book-progress";
import {
  BOOK_SUBTITLE,
  BOOK_TITLE,
  BOOK_TOTAL_PAGES,
  bookChapters,
  bookPages,
  bookParts,
  getPublishedPagesForChapter,
} from "@/data/book";
import { SITE_URL, SOCIAL_IMAGE } from "@/lib/site";

export const metadata: Metadata = {
  title: `${BOOK_TITLE} — livro de física quântica`,
  description: `${BOOK_SUBTITLE}. Um romance científico em ${BOOK_TOTAL_PAGES} páginas, com fontes primárias e conceitos reais.`,
  alternates: { canonical: "/livro" },
  openGraph: {
    type: "book",
    url: `${SITE_URL}/livro`,
    title: BOOK_TITLE,
    description: BOOK_SUBTITLE,
    images: [SOCIAL_IMAGE],
  },
};

export default function BookHomePage() {
  const publishedPages = bookPages.length;
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Book",
    name: BOOK_TITLE,
    alternateName: BOOK_SUBTITLE,
    inLanguage: "pt-BR",
    url: `${SITE_URL}/livro`,
    numberOfPages: BOOK_TOTAL_PAGES,
    author: { "@type": "Organization", name: "Quantical" },
    educationalLevel: "Iniciante a universitário",
    isAccessibleForFree: true,
  };

  return (
    <div className="book-home">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />

      <section className="book-cover">
        <div className="book-cover-orbit" aria-hidden="true"><i /><i /><b /></div>
        <div className="shell book-cover-grid">
          <div>
            <p className="eyebrow">Um romance científico da Quantical</p>
            <h1>{BOOK_TITLE}</h1>
            <p className="book-subtitle">{BOOK_SUBTITLE}</p>
            <p className="book-deck">
              Lia abre uma porta que deveria permanecer fechada e atravessa os experimentos
              que desmontaram a física clássica. A aventura é ficção. A ciência, não.
            </p>
            <div className="book-cover-actions">
              <BookResume publishedPages={publishedPages} />
              <a href="#sumario">Explorar o sumário <ArrowRight aria-hidden="true" size={16} /></a>
            </div>
          </div>
          <aside className="book-edition-card" aria-label="Dados da edição">
            <span>Edição digital em construção</span>
            <strong>{String(publishedPages).padStart(3, "0")}</strong>
            <p>páginas publicadas de {BOOK_TOTAL_PAGES}</p>
            <div><i style={{ width: `${(publishedPages / BOOK_TOTAL_PAGES) * 100}%` }} /></div>
            <small>24 capítulos · 6 partes · referências página a página</small>
          </aside>
        </div>
      </section>

      <section className="book-promise">
        <div className="shell book-promise-grid">
          <article><ScrollText size={20} /><h2>Ritmo de ficção</h2><p>Personagens, mistério e descobertas conduzem a leitura sem substituir explicação por fantasia.</p></article>
          <article><FlaskConical size={20} /><h2>Ciência verificável</h2><p>Cada página separa a cena narrativa do caderno científico e aponta suas fontes.</p></article>
          <article><BookMarked size={20} /><h2>Sem atalhos falsos</h2><p>Analogias declaram onde quebram; interpretações são apresentadas sem fingir consenso.</p></article>
        </div>
      </section>

      <section className="book-toc shell" id="sumario">
        <header>
          <p className="eyebrow"><LibraryBig size={15} /> Mapa da viagem</p>
          <h2>Seis territórios. Duzentas e dezesseis páginas.</h2>
          <p>O manuscrito é publicado capítulo por capítulo. Páginas disponíveis têm acesso direto; as demais mostram o percurso completo sem fingir que já foram escritas.</p>
        </header>

        <div className="book-parts">
          {bookParts.map((part) => (
            <section key={part.number}>
              <div className="book-part-heading">
                <span>Parte {part.number}</span>
                <div><h3>{part.title}</h3><p>{part.premise}</p></div>
              </div>
              <ol>
                {bookChapters.filter((chapter) => chapter.part === part.number).map((chapter) => {
                  const published = getPublishedPagesForChapter(chapter.number);
                  const complete = published.length === chapter.pageEnd - chapter.pageStart + 1;
                  return (
                    <li key={chapter.number} className={published.length ? "is-published" : undefined}>
                      <span>{String(chapter.number).padStart(2, "0")}</span>
                      <div><strong>{chapter.title}</strong><small>{chapter.subtitle}</small></div>
                      {published.length ? (
                        <Link href={`/livro/${chapter.pageStart}`}>
                          {complete ? "Ler capítulo" : `${published.length} páginas`} <ArrowRight size={14} />
                        </Link>
                      ) : <em>Planejado · p. {chapter.pageStart}–{chapter.pageEnd}</em>}
                    </li>
                  );
                })}
              </ol>
            </section>
          ))}
        </div>
      </section>
    </div>
  );
}
