import { chapter01 } from "./chapters/ch01";
import { chapter02 } from "./chapters/ch02";
import { chapter03 } from "./chapters/ch03";
import { chapter04 } from "./chapters/ch04";
import { chapter05 } from "./chapters/ch05";
import { chapter06 } from "./chapters/ch06";
import { chapter07 } from "./chapters/ch07";
import { chapter08 } from "./chapters/ch08";
import { chapter09 } from "./chapters/ch09";
import { chapter10 } from "./chapters/ch10";
import { chapter11 } from "./chapters/ch11";

export { BOOK_SUBTITLE, BOOK_TITLE, BOOK_TOTAL_PAGES, PAGES_PER_CHAPTER, bookChapters, bookParts } from "./outline";
export { bookReferenceById, bookReferences } from "./bibliography";
export type { BookChapterPlan, BookPage, BookPart, BookReference } from "./types";

export const bookPages = [
  ...chapter01,
  ...chapter02,
  ...chapter03,
  ...chapter04,
  ...chapter05,
  ...chapter06,
  ...chapter07,
  ...chapter08,
  ...chapter09,
  ...chapter10,
  ...chapter11,
];

export const bookPageByNumber = new Map(bookPages.map((page) => [page.number, page]));

export function getBookPage(number: number) {
  return bookPageByNumber.get(number);
}

export function getPublishedPagesForChapter(chapter: number) {
  return bookPages.filter((page) => page.chapter === chapter);
}
