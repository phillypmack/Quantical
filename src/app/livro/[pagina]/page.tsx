import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { BookReader } from "@/components/book-reader";
import {
  BOOK_TITLE,
  bookChapters,
  bookPageByNumber,
  bookPages,
  bookReferenceById,
  getBookPage,
} from "@/data/book";
import { SITE_NAME, SITE_URL, SOCIAL_IMAGE } from "@/lib/site";

type BookPageProps = { params: Promise<{ pagina: string }> };

export function generateStaticParams() {
  return bookPages.map((page) => ({ pagina: String(page.number) }));
}

export async function generateMetadata({ params }: BookPageProps): Promise<Metadata> {
  const page = getBookPage(Number((await params).pagina));
  if (!page) return { title: "Página do livro" };
  const url = `/livro/${page.number}`;
  return {
    title: `${page.title} — ${BOOK_TITLE}`,
    description: page.science.body,
    alternates: { canonical: url },
    openGraph: {
      type: "article",
      url: `${SITE_URL}${url}`,
      title: page.title,
      description: page.science.body,
      siteName: SITE_NAME,
      locale: "pt_BR",
      images: [SOCIAL_IMAGE],
    },
  };
}

export default async function DigitalBookPage({ params }: BookPageProps) {
  const number = Number((await params).pagina);
  const page = getBookPage(number);
  if (!page) notFound();

  const chapter = bookChapters.find((item) => item.number === page.chapter);
  if (!chapter) notFound();

  const references = page.references.map((id) => bookReferenceById.get(id)).filter((item) => item !== undefined);

  return (
    <BookReader
      chapter={chapter}
      nextPage={bookPageByNumber.has(number + 1) ? number + 1 : undefined}
      page={page}
      previousPage={bookPageByNumber.has(number - 1) ? number - 1 : undefined}
      references={references}
    />
  );
}
