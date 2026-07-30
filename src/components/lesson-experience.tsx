"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  Circle,
  FlaskConical,
  Lightbulb,
  RotateCcw,
} from "lucide-react";

import type { Module, Track } from "@/data/curriculum";
import { getModuleLessons } from "@/data/curriculum";
import { cn } from "@/lib/cn";
import { useProgress } from "./progress-provider";

type LessonExperienceProps = {
  track: Track;
  module: Module;
  stageId: string;
  lessonId: string;
  nextHref?: string;
  nextLabel?: string;
};

const stageCopy: Record<string, { title: string; kicker: string; verb: string }> = {
  teoria: { title: "Construa a intuição", kicker: "Conceito", verb: "entender" },
  experimento: { title: "Teste a ideia", kicker: "Experimento", verb: "observar" },
  desafio: { title: "Faça por conta própria", kicker: "Desafio", verb: "construir" },
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
  const [selected, setSelected] = useState<number | null>(null);
  const [checked, setChecked] = useState(false);
  const lesson = stageCopy[stageId] ?? stageCopy.teoria;
  const stages = getModuleLessons(track.id, module.id);
  const isComplete = completed.includes(lessonId);
  const answerOptions = useMemo(
    () => [
      `É uma ferramenta para ${module.description.toLowerCase()}`,
      "É apenas uma forma diferente de armazenar bits clássicos.",
      "Só existe quando um computador está conectado à internet.",
    ],
    [module.description],
  );

  const checkAnswer = () => {
    if (selected === null) return;
    setChecked(true);
    if (selected === 0) completeLesson(lessonId, 100);
  };

  return (
    <div className="lesson-layout">
      <aside className="lesson-sidebar">
        <Link href="/aprender" className="lesson-back"><ArrowLeft size={15} /> Todas as trilhas</Link>
        <div className="lesson-track-label" style={{ color: track.accent }}>
          {track.eyebrow}
        </div>
        <h2>{module.title}</h2>
        <div className="lesson-stage-list">
          {stages.map((stage, index) => {
            const done = completed.includes(stage.id);
            return (
              <Link
                className={cn("lesson-stage-link", stage.id === lessonId && "is-current")}
                href={stage.href}
                key={stage.id}
              >
                {done ? <CheckCircle2 size={17} /> : <Circle size={17} />}
                <span><small>0{index + 1}</small>{stage.label}</span>
              </Link>
            );
          })}
        </div>
        <div className="lesson-module-progress">
          <span>Progresso do módulo</span>
          <strong>{stages.filter((stage) => completed.includes(stage.id)).length}/3</strong>
          <i><b style={{ width: `${(stages.filter((stage) => completed.includes(stage.id)).length / 3) * 100}%` }} /></i>
        </div>
      </aside>

      <article className="lesson-content">
        <header className="lesson-heading">
          <div>
            <span>{lesson.kicker} · {module.duration < 50 ? "12 min" : "18 min"}</span>
            <h1>{lesson.title}:<br /><em>{module.shortTitle}</em></h1>
          </div>
          <span className="lesson-number">{String(module.number).padStart(2, "0")}</span>
        </header>

        <p className="lesson-opening">
          {module.description} Nesta aula, você vai {lesson.verb} como{" "}
          <strong>{module.concepts.join(", ")}</strong> se conectam em um programa quântico.
        </p>

        <section className="lesson-prose">
          <h2>Uma nova forma de representar informação</h2>
          <p>
            Em computação quântica, não descrevemos apenas respostas prontas. Descrevemos
            um espaço de possibilidades e as transformações que acontecem dentro dele.
            Cada operação muda as amplitudes do estado, e essas amplitudes determinam o
            que podemos observar ao medir.
          </p>
          <p>
            O ponto central de <strong>{module.title.toLowerCase()}</strong> é aprender
            a separar três momentos: preparar o estado, transformá-lo com portas e,
            somente então, realizar a medição. Essa ordem é a gramática básica de todo
            circuito quântico.
          </p>
        </section>

        <div className="concept-card">
          <div className="concept-card-label"><Lightbulb size={16} /> Ideia-chave</div>
          <p>
            Um circuito não calcula uma única resposta de forma direta. Ele organiza
            amplitudes para tornar algumas respostas mais prováveis que outras.
          </p>
          <div className="state-notation">|ψ⟩ = α|0⟩ + β|1⟩</div>
          <small>|α|² + |β|² = 1</small>
        </div>

        <section className="lesson-prose">
          <h2>Do conceito ao circuito</h2>
          <p>
            A maneira mais segura de criar intuição é prever o resultado antes de
            executar. Imagine o estado inicial, aplique mentalmente cada transformação
            e só depois compare sua hipótese com o histograma do simulador.
          </p>
        </section>

        <div className="lesson-experiment">
          <div>
            <span><FlaskConical size={15} /> Experimento guiado</span>
            <h3>{module.project}</h3>
            <p>Abra o laboratório com um circuito preparado para este conceito.</p>
          </div>
          <Link className="button button--light button--small" href="/laboratorio">
            Experimentar <ArrowRight size={15} />
          </Link>
        </div>

        <section className="lesson-quiz">
          <span className="pill">Cheque sua intuição</span>
          <h2>Qual afirmação descreve melhor “{module.shortTitle}” neste contexto?</h2>
          <div className="quiz-options">
            {answerOptions.map((option, index) => (
              <button
                className={cn(
                  selected === index && "is-selected",
                  checked && index === 0 && "is-correct",
                  checked && selected === index && index !== 0 && "is-wrong",
                )}
                key={option}
                onClick={() => {
                  setSelected(index);
                  setChecked(false);
                }}
                type="button"
              >
                <span>{String.fromCharCode(65 + index)}</span>
                {option}
                {checked && index === 0 && <Check size={17} />}
              </button>
            ))}
          </div>
          {checked && selected !== 0 && (
            <p className="quiz-feedback">Quase. Lembre que o conceito descreve uma transformação ou representação genuinamente quântica.</p>
          )}
          {checked && selected === 0 && (
            <p className="quiz-feedback quiz-feedback--correct">Exato. A intuição está no lugar certo — aula concluída!</p>
          )}
          {!isComplete || !checked ? (
            <button className="button button--dark" disabled={selected === null} onClick={checkAnswer} type="button">
              Verificar resposta
            </button>
          ) : null}
          {checked && selected === 0 && (
            <button
              className="quiz-reset"
              onClick={() => { setSelected(null); setChecked(false); }}
              type="button"
            >
              <RotateCcw size={14} /> Refazer
            </button>
          )}
        </section>

        <footer className="lesson-footer-nav">
          <div>
            <span>{isComplete ? "Aula concluída" : "Conclua o quiz para avançar"}</span>
            <strong>{isComplete ? "Seu progresso foi salvo." : "Você está quase lá."}</strong>
          </div>
          {nextHref ? (
            <Link
              aria-disabled={!isComplete}
              className={cn("button button--dark", !isComplete && "is-disabled")}
              href={isComplete ? nextHref : "#quiz"}
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
