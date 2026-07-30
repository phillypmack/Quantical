"use client";

import Link from "next/link";
import { ArrowRight, Check, Clock3, LockKeyhole } from "lucide-react";

import { getModuleLessons, tracks } from "@/data/curriculum";
import { useProgress } from "./progress-provider";

export function TrackCurriculum() {
  const { completed, hydrated } = useProgress();

  return (
    <div className="track-list">
      {tracks.map((track, trackIndex) => {
        const lessonCount = track.modules.length * 3;
        const completedCount = track.modules.flatMap((module) =>
          getModuleLessons(track.id, module.id),
        ).filter((lesson) => completed.includes(lesson.id)).length;
        const percentage = Math.round((completedCount / lessonCount) * 100);
        return (
          <section className={`track-detail track-detail--${track.id}`} id={track.id} key={track.id}>
            <div className="track-detail-intro">
              <span className="track-index">0{trackIndex + 1}</span>
              <p className="eyebrow">{track.audience}</p>
              <h2>{track.title}</h2>
              <p>{track.description}</p>
              <div className="track-meta">
                <span><Clock3 size={14} /> {Math.round(track.modules.reduce((sum, module) => sum + module.duration, 0) / 60)}h de conteúdo</span>
                <span>{lessonCount} aulas</span>
              </div>
              <div className="track-progress-line">
                <i style={{ width: hydrated ? `${percentage}%` : "0%" }} />
              </div>
              <small>{percentage}% concluído</small>
            </div>
            <div className="module-list">
              {track.modules.map((module, moduleIndex) => {
                const lessons = getModuleLessons(track.id, module.id);
                const done = lessons.filter((lesson) => completed.includes(lesson.id)).length;
                const href = lessons.find((lesson) => !completed.includes(lesson.id))?.href ?? lessons[0].href;
                const previous = track.modules[moduleIndex - 1];
                const previousChallenge = previous
                  ? getModuleLessons(track.id, previous.id).find((lesson) => lesson.id.endsWith("/desafio"))
                  : undefined;
                const suggested = moduleIndex === 0 || Boolean(previousChallenge && completed.includes(previousChallenge.id));
                return (
                  <article className="module-row" key={module.id}>
                    <div className="module-status">
                      {done === 3 ? <Check size={15} /> : suggested ? module.number : <LockKeyhole size={13} />}
                    </div>
                    <div>
                      <span>Módulo {module.number}</span>
                      <h3>{module.title}</h3>
                      <p>{module.description}</p>
                      <div className="concept-tags">
                        {module.concepts.map((concept) => <span key={concept}>{concept}</span>)}
                      </div>
                    </div>
                    <div className="module-row-action">
                      <span>{done}/3</span>
                      <Link href={href} aria-label={`Abrir ${module.title}`}>
                        <ArrowRight size={18} />
                      </Link>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
}
