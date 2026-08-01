import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { LessonExperience } from "@/components/lesson-experience";
import {
  getAllLessons,
  getLessonId,
  getModule,
  getModuleLessons,
  getNextLesson,
  getTrack,
  lessonStages,
  tracks,
} from "@/data/curriculum";
import { getLesson } from "@/data/lessons";
import { SITE_NAME, SOCIAL_IMAGE } from "@/lib/site";

type LessonPageProps = {
  params: Promise<{ track: string; module: string; lesson: string }>;
};

export function generateStaticParams() {
  return tracks.flatMap((track) =>
    track.modules.flatMap((module) =>
      getModuleLessons(track.id, module.id).map((lesson) => ({
        track: track.id,
        module: module.id,
        lesson: lesson.id.split("/").at(-1)!,
      })),
    ),
  );
}

/**
 * As 54 aulas tinham 18 títulos distintos — os três estágios de um módulo
 * compartilhavam o mesmo `<title>` e nenhuma delas declarava canonical nem
 * Open Graph. Para um buscador, 54 páginas com título repetido são páginas
 * competindo entre si; para um link compartilhado, era um cartão em branco.
 *
 * A aula escrita, quando existe, tem título e resumo próprios — usá-los é o
 * que dá 54 títulos de verdade em vez de 18.
 */
export async function generateMetadata({ params }: LessonPageProps): Promise<Metadata> {
  const values = await params;
  const courseModule = getModule(values.track, values.module);
  const track = getTrack(values.track);
  const lessonId = getLessonId(values.track, values.module, values.lesson);
  const lesson = getLesson(lessonId);
  const estagio = lessonStages.find((item) => item.id === values.lesson);

  const titulo = lesson
    ? `${lesson.title} — ${estagio?.label ?? "Aula"}`
    : `${courseModule?.title ?? "Aula"} — ${estagio?.label ?? "Aula"}`;

  const descricao =
    lesson?.summary ??
    (courseModule && estagio
      ? `${estagio.label} do módulo ${courseModule.title}: ${courseModule.description}`
      : undefined);

  const url = `/curso/${values.track}/${values.module}/${values.lesson}`;

  return {
    title: titulo,
    description: descricao,
    alternates: { canonical: url },
    openGraph: {
      title: titulo,
      description: descricao,
      url,
      type: "article",
      siteName: SITE_NAME,
      locale: "pt_BR",
      images: [SOCIAL_IMAGE],
    },
    other: track ? { "article:section": track.title } : undefined,
  };
}

export default async function LessonPage({ params }: LessonPageProps) {
  const values = await params;
  const track = getTrack(values.track);
  const courseModule = getModule(values.track, values.module);
  const validLesson = getAllLessons().find(
    (item) =>
      item.track.id === values.track &&
      item.module.id === values.module &&
      item.id.endsWith(`/${values.lesson}`),
  );
  if (!track || !courseModule || !validLesson) notFound();

  const next = getNextLesson(values.track, values.module, values.lesson);
  return (
    <LessonExperience
      lessonId={getLessonId(values.track, values.module, values.lesson)}
      module={courseModule}
      nextHref={next?.href}
      nextLabel={next ? `${next.label}: ${next.module.shortTitle}` : undefined}
      stageId={values.lesson}
      track={track}
    />
  );
}
