"use client";

import { useMemo, useState } from "react";
import { Check, RotateCcw, X } from "lucide-react";

import { cn } from "@/lib/cn";
import { mulberry32 } from "@/lib/quantum/rng";
import type { Question } from "@/data/lessons";
import { useProgress } from "@/components/progress-provider";

/**
 * Quiz de verdade.
 *
 * O anterior tinha a resposta correta fixa no índice 0, sempre renderizada
 * como alternativa "A", nunca embaralhada, com os MESMOS dois distratores nas
 * 54 aulas e nota sempre literal 100. O teste e2e chegava a clicar em
 * `name: /^A /` — ou seja, a suíte codificava o bug.
 */

/** Embaralha de forma estável dentro de uma tentativa, mas diferente por aula. */
function shuffle<T>(items: T[], seed: number): T[] {
  const random = mulberry32(seed);
  const result = [...items];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const swap = Math.floor(random() * (index + 1));
    [result[index], result[swap]] = [result[swap], result[index]];
  }
  return result;
}

function hashString(value: string) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

type QuizProps = {
  lessonId: string;
  questions: Question[];
  onPass: (score: number) => void;
  completed?: boolean;
  /** Conceitos da aula, usados quando a pergunta não declara os seus. */
  conceitos?: string[];
};

export function Quiz({
  lessonId,
  questions,
  onPass,
  completed = false,
  conceitos = [],
}: QuizProps) {
  const { registrarTentativa } = useProgress();
  const [attempt, setAttempt] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [checked, setChecked] = useState(false);

  const shuffled = useMemo(
    () =>
      questions.map((question) => ({
        ...question,
        options: shuffle(question.options, hashString(`${lessonId}:${question.id}:${attempt}`)),
      })),
    [questions, lessonId, attempt],
  );

  if (questions.length === 0) return null;

  const answeredAll = shuffled.every((question) => answers[question.id] !== undefined);
  const correctCount = shuffled.filter(
    (question) => question.options[answers[question.id]]?.correct,
  ).length;
  const score = Math.round((correctCount / shuffled.length) * 100);

  const check = () => {
    if (!answeredAll) return;
    setChecked(true);

    // Registrar ANTES de qualquer coisa poder apagar: o `retry()` abaixo zera
    // `answers`, e até aqui era assim que a informação mais útil do site —
    // qual alternativa errada o aluno escolheu — se perdia.
    for (const question of shuffled) {
      const escolhida = question.options[answers[question.id]];
      if (!escolhida) continue;
      registrarTentativa({
        tipo: "quiz",
        licaoId: lessonId,
        itemId: question.id,
        acertou: escolhida.correct,
        conceitos: question.conceitos ?? conceitos,
        equivocoId: escolhida.correct ? undefined : escolhida.equivoco,
        detalhe: { escolha: escolhida.text, tentativa: attempt },
      });
    }

    // Nota real, não 100 fixo. Aprova a partir de 60%.
    if (score >= 60) onPass(score);
  };

  const retry = () => {
    setAttempt((value) => value + 1);
    setAnswers({});
    setChecked(false);
  };

  return (
    <section className="lesson-quiz" id="quiz">
      <span className="pill">Cheque sua intuição</span>

      {shuffled.map((question, questionIndex) => (
        <fieldset className="quiz-question" key={question.id}>
          <legend>
            <span className="quiz-number">{questionIndex + 1}</span>
            {question.prompt}
          </legend>
          <div className="quiz-options">
            {question.options.map((option, optionIndex) => {
              const selected = answers[question.id] === optionIndex;
              const reveal = checked && (selected || option.correct);
              return (
                <button
                  aria-pressed={selected}
                  className={cn(
                    selected && "is-selected",
                    checked && option.correct && "is-correct",
                    checked && selected && !option.correct && "is-wrong",
                  )}
                  disabled={checked}
                  key={option.text}
                  onClick={() => setAnswers((current) => ({ ...current, [question.id]: optionIndex }))}
                  type="button"
                >
                  <span>{String.fromCharCode(65 + optionIndex)}</span>
                  <div>
                    {option.text}
                    {/* Explicação em TODAS as alternativas, certas e erradas. */}
                    {reveal && <small className="quiz-explanation">{option.explanation}</small>}
                  </div>
                  {checked && option.correct && <Check size={17} />}
                  {checked && selected && !option.correct && <X size={17} />}
                </button>
              );
            })}
          </div>
        </fieldset>
      ))}

      {checked ? (
        <div className={cn("quiz-result", score >= 60 ? "is-pass" : "is-fail")}>
          <strong>
            {correctCount} de {shuffled.length} · {score}%
          </strong>
          <p>
            {score === 100
              ? "Tudo certo. Sua intuição está no lugar."
              : score >= 60
                ? "Passou. Leia as explicações das que errou antes de seguir."
                : "Ainda não. As explicações acima mostram onde o raciocínio saiu do trilho."}
          </p>
          <button className="quiz-reset" onClick={retry} type="button">
            <RotateCcw size={14} /> Tentar de novo
          </button>
        </div>
      ) : (
        <button
          className="button button--dark"
          disabled={!answeredAll}
          onClick={check}
          type="button"
        >
          {answeredAll ? "Verificar respostas" : `Responda as ${shuffled.length} perguntas`}
        </button>
      )}

      {completed && !checked && <p className="quiz-note">Você já concluiu esta aula.</p>}
    </section>
  );
}
