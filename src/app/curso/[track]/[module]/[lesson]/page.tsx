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
  tracks,
} from "@/data/curriculum";

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

export async function generateMetadata({ params }: LessonPageProps): Promise<Metadata> {
  const values = await params;
  const module = getModule(values.track, values.module);
  return {
    title: module ? `${module.title} — Aula` : "Aula",
    description: module?.description,
  };
}

export default async function LessonPage({ params }: LessonPageProps) {
  const values = await params;
  const track = getTrack(values.track);
  const module = getModule(values.track, values.module);
  const validLesson = getAllLessons().find(
    (item) =>
      item.track.id === values.track &&
      item.module.id === values.module &&
      item.id.endsWith(`/${values.lesson}`),
  );
  if (!track || !module || !validLesson) notFound();

  const next = getNextLesson(values.track, values.module, values.lesson);
  return (
    <LessonExperience
      lessonId={getLessonId(values.track, values.module, values.lesson)}
      module={module}
      nextHref={next?.href}
      nextLabel={next ? `${next.label}: ${next.module.shortTitle}` : undefined}
      stageId={values.lesson}
      track={track}
    />
  );
}
