export type BookReferenceKind = "fonte-primaria" | "revisao" | "institucional";

export type BookReference = {
  id: string;
  authors: string;
  title: string;
  year: number;
  venue: string;
  url: string;
  kind: BookReferenceKind;
  note: string;
};

export type BookScienceNote = {
  title: string;
  body: string;
  formula?: string;
};

export type BookPage = {
  number: number;
  chapter: number;
  title: string;
  kicker: string;
  paragraphs: string[];
  science: BookScienceNote;
  references: string[];
};

export type BookPart = {
  number: number;
  title: string;
  premise: string;
};

export type BookChapterPlan = {
  number: number;
  part: number;
  title: string;
  subtitle: string;
  pageStart: number;
  pageEnd: number;
  concepts: string[];
};
