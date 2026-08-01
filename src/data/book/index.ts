import { chapter01 } from "./chapters/ch01";
import { chapter02 } from "./chapters/ch02";
import { chapter03 } from "./chapters/ch03";

export { BOOK_SUBTITLE, BOOK_TITLE, BOOK_TOTAL_PAGES, PAGES_PER_CHAPTER, bookChapters, bookParts } from "./outline";
export { bookReferenceById, bookReferences } from "./bibliography";
export type { BookChapterPlan, BookPage, BookPart, BookReference } from "./types";

export const bookPages = [...chapter01, ...chapter02, ...chapter03];

export const bookPageByNumber = new Map(bookPages.map((page) => [page.number, page]));

export function getBookPage(number: number) {
  return bookPageByNumber.get(number);
}

export function getPublishedPagesForChapter(chapter: number) {
  return bookPages.filter((page) => page.chapter === chapter);
}
