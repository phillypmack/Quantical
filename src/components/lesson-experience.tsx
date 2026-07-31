"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, CheckCircle2, Circle, Clock, Target } from "lucide-react";

import type { Module, Track } from "@/data/curriculum";
import { getModuleLessons } from "@/data/curriculum";
import { getGlossaryEntry } from "@/data/glossary";
import { getLesson } from "@/data/lessons";
import { cn } from "@/lib/cn";
import { LessonBlocks } from "./lesson/blocks";
import { Quiz } from "./lesson/quiz";
import { ExerciseWorkbench } from "./quantum/exercise-workbench";
import { GuidedExperiment } from "./quantum/guided-experiment";
import { useProgress } from "./progress-provider";

type LessonExperienceProps = {
  track: Track;
  module: Module;
  stageId: string;
  lessonId: string;
  nextHref?: string;
  nextLabel?: string;
};

const stageCopy: Record<string, { kicker: string; fallbackTitle: string }> = {
  teoria: { kicker: "Conceito", fallbackTitle: "Construa a intuição" },
  experimento: { kicker: "Experimento", fallbackTitle: "Teste a ideia" },
  desafio: { kicker: "Desafio", fallbackTitle: "Faça por conta própria" },
};

export function LessonExperience({
  track,
  module,
  stageId,
  lessonId,
  nextHref,
  nextLabel,
}: LessonExperienceProps) {
  const { completed, completeLesson } = useProgress();
  const lesson = getLesson(lessonId);
  const stage = stageCopy[stageId] ?? stageCopy.teoria;
  const stages = getModuleLessons(track.id, module.id);
  const isComplete = completed.includes(lessonId);
  const doneCount = stages.filter((item) => completed.includes(item.id)).length;

  // O estágio "experimento" e o "desafio" concluem por ação, não por quiz.
  const [experimentDone, setExperimentDone] = useState(false);

  return (
    <div className="lesson-layout">
      <aside className="lesson-sidebar">
        <Link href="/aprender" className="lesson-back">
          <ArrowLeft size={15} /> Todas as trilhas
        </Link>
        <div className="lesson-track-label" style={{ color: track.accent }}>
          {track.eyebrow}
        </div>
        <h2>{module.title}</h2>

        <div className="lesson-stage-list">
          {stages.map((item, index) => (
            <Link
              className={cn("lesson-stage-link", item.id === lessonId && "is-current")}
              href={item.href}
              key={item.id}
            >
              {completed.includes(item.id) ? <CheckCircle2 size={17} /> : <Circle size={17} />}
              <span>
                <small>0{index + 1}</small>
                {item.label}
              </span>
            </Link>
          ))}
        </div>

        <div className="lesson-module-progress">
          <span>Progresso do módulo</span>
          <strong>
            {doneCount}/{stages.length}
          </strong>
          <i>
            <b style={{ width: `${(doneCount / stages.length) * 100}%` }} />
          </i>
        </div>

        {lesson?.glossaryRefs.length ? (
          <div className="lesson-terms">
            <span>Termos desta aula</span>
            <ul>
              {lesson.glossaryRefs.map((id) => {
                const entry = getGlossaryEntry(id);
                if (!entry) return null;
                return (
                  <li key={id} title={entry.definition}>
                    {entry.term}
                  </li>
                );
              })}
            </ul>
          </div>
        ) : null}
      </aside>

      <article className="lesson-content">
        <header className="lesson-heading">
          <div>
            <span>
              {stage.kicker}
              {/* Antes era um "12 min"/"18 min" fixo que ignorava o dado real. */}
              {lesson ? (
                <>
                  {" · "}
                  <Clock size={13} /> {lesson.minutes} min
                </>
              ) : null}
            </span>
            <h1>
              {lesson?.title ?? stage.fallbackTitle}
              {!lesson && (
                <>
                  :<br />
                  <em>{module.shortTitle}</em>
                </>
              )}
            </h1>
          </div>
          <span className="lesson-number">{String(module.number).padStart(2, "0")}</span>
        </header>

        {lesson ? (
          <>
            <p className="lesson-opening">{lesson.summary}</p>

            {lesson.objectives.length > 0 && (
              <div className="lesson-objectives">
                <span>
                  <Target size={14} /> Ao final desta aula você vai conseguir
                </span>
                <ul>
                  {lesson.objectives.map((objective) => (
                    <li key={objective}>{objective}</li>
                  ))}
                </ul>
              </div>
            )}

            <section className="lesson-prose">
              <LessonBlocks blocks={lesson.blocks} />
            </section>

            {lesson.guided && (
              <GuidedExperiment
                onComplete={() => {
                  setExperimentDone(true);
                  completeLesson(lessonId, 100);
                }}
                steps={lesson.guided.steps}
                title={lesson.guided.title}
              />
            )}

            {lesson.exercise && (
              <ExerciseWorkbench
                exercise={lesson.exercise}
                onSolved={() => completeLesson(lessonId, 100)}
                solved={isComplete}
              />
            )}

            <Quiz
              completed={isComplete}
              lessonId={lessonId}
              onPass={(score) => completeLesson(lessonId, score)}
              questions={lesson.quiz}
            />
          </>
        ) : (
          <PendingContent module={module} />
        )}

        <footer className="lesson-footer-nav">
          <div>
            <span>{isComplete ? "Aula concluída" : "Conclua a atividade para avançar"}</span>
            <strong>
              {isComplete
                ? "Seu progresso foi salvo."
                : experimentDone
                  ? "Quase lá."
                  : "Você está quase lá."}
            </strong>
          </div>
          {nextHref ? (
            <Link
              aria-disabled={!isComplete}
              className={cn("button button--dark", !isComplete && "is-disabled")}
              // Antes caía em "#quiz", âncora que não existia em lugar nenhum.
              href={isComplete ? nextHref : `#${lesson?.guided ? "experimento" : "quiz"}`}
            >
              {nextLabel ?? "Próxima aula"} <ArrowRight size={16} />
            </Link>
          ) : (
            <Link className="button button--dark" href="/progresso">
              Ver meu progresso <ArrowRight size={16} />
            </Link>
          )}
        </footer>
      </article>
    </div>
  );
}

/**
 * Módulos cujo conteúdo ainda não foi escrito. Dizer isso na cara é mais
 * honesto do que renderizar 1100 caracteres genéricos e chamar de aula.
 */
function PendingContent({ module }: { module: Module }) {
  return (
    <section className="lesson-pending">
      <h2>Esta aula ainda está sendo escrita</h2>
      <p>
        O módulo <strong>{module.title}</strong> cobre {module.concepts.join(", ")}. O conteúdo
        completo — com experimento guiado e exercício corrigido — está em produção.
      </p>
      <p>
        Enquanto isso, o módulo <strong>Do bit ao qubit</strong> já está pronto no formato final, e
        o laboratório aceita qualquer circuito que você queira testar.
      </p>
      <div className="lesson-pending-actions">
        <Link className="button button--dark button--small" href="/curso/iniciante/bits-e-qubits/teoria">
          Começar pelo módulo 1 <ArrowRight size={15} />
        </Link>
        <Link className="button button--light button--small" href="/laboratorio">
          Abrir o laboratório
        </Link>
      </div>
    </section>
  );
}
