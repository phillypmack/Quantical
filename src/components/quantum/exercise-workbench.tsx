"use client";

import { useCallback, useMemo, useState } from "react";
import { Check, Eye, Lightbulb, Play, RotateCcw, X } from "lucide-react";

import { cn } from "@/lib/cn";
import { validateExercise, type Exercise, type ValidationResult } from "@/lib/quantum/validator";
import { ResultPanel } from "./result-panel";

/**
 * Bancada de exercício: escreve, roda, e o corretor confere o ESTADO
 * produzido — não as portas usadas. Existe mais de um caminho certo, e
 * soluções que diferem só por fase global são aceitas.
 */
export function ExerciseWorkbench({
  exercise,
  onSolved,
  solved = false,
}: {
  exercise: Exercise;
  onSolved?: () => void;
  solved?: boolean;
}) {
  const [code, setCode] = useState(exercise.starterCode);
  const [result, setResult] = useState<ValidationResult | null>(null);
  const [attempts, setAttempts] = useState(0);
  const [hintsShown, setHintsShown] = useState(0);
  const [showSolution, setShowSolution] = useState(false);

  const check = useCallback(() => {
    const validation = validateExercise(code, exercise);
    setResult(validation);
    setAttempts((value) => value + 1);
    if (validation.passed) onSolved?.();
  }, [code, exercise, onSolved]);

  // "Ver solução" libera após três tentativas — ou a pedido, sem julgamento.
  const canReveal = attempts >= 3 || hintsShown >= exercise.hints.length;

  const lineCount = useMemo(() => code.split("\n").length, [code]);

  return (
    <section className="workbench" aria-label="Exercício">
      <header className="workbench-prompt">
        <h3>{exercise.prompt}</h3>
        <span>{exercise.qubits} qubit{exercise.qubits === 1 ? "" : "s"}</span>
      </header>

      <div className="workbench-editor">
        <div className="workbench-gutter" aria-hidden="true">
          {Array.from({ length: lineCount }, (_, index) => (
            <span key={index}>{index + 1}</span>
          ))}
        </div>
        <textarea
          aria-label="Seu código Qiskit"
          onChange={(event) => setCode(event.target.value)}
          spellCheck={false}
          value={code}
        />
      </div>

      <div className="workbench-actions">
        <button className="button button--dark" onClick={check} type="button">
          <Play size={15} /> Verificar
        </button>
        <button
          className="button button--ghost button--small"
          disabled={hintsShown >= exercise.hints.length}
          onClick={() => setHintsShown((value) => value + 1)}
          type="button"
        >
          <Lightbulb size={14} />
          {hintsShown === 0
            ? "Preciso de uma dica"
            : hintsShown >= exercise.hints.length
              ? "Sem mais dicas"
              : "Outra dica"}
        </button>
        <button
          className="button button--ghost button--small"
          onClick={() => {
            setCode(exercise.starterCode);
            setResult(null);
          }}
          type="button"
        >
          <RotateCcw size={14} /> Recomeçar
        </button>
        {canReveal && !showSolution && (
          <button
            className="button button--ghost button--small"
            onClick={() => setShowSolution(true)}
            type="button"
          >
            <Eye size={14} /> Ver solução
          </button>
        )}
      </div>

      {hintsShown > 0 && (
        <ol className="workbench-hints">
          {exercise.hints.slice(0, hintsShown).map((hint, index) => (
            <li key={hint}>
              <span>Dica {index + 1}</span>
              {hint}
            </li>
          ))}
        </ol>
      )}

      {showSolution && (
        <figure className="workbench-solution">
          <figcaption>Uma solução possível</figcaption>
          <pre>
            <code>{exercise.solutionCode}</code>
          </pre>
          <button
            className="button button--light button--small"
            onClick={() => setCode(exercise.solutionCode)}
            type="button"
          >
            Carregar no editor
          </button>
        </figure>
      )}

      {result?.error && (
        <p className="workbench-error" role="alert">
          {result.error.line ? <strong>Linha {result.error.line}: </strong> : null}
          {result.error.message}
          {result.error.suggestion ? <em> {result.error.suggestion}</em> : null}
        </p>
      )}

      {result && result.checks.length > 0 && (
        <div className={cn("workbench-checks", result.passed && "is-passed")}>
          <strong>
            {result.passed
              ? "Resolvido."
              : `${result.checks.filter((check) => check.passed).length} de ${result.checks.length} conferidos`}
          </strong>
          <ul>
            {result.checks.map((check) => (
              <li className={check.passed ? "is-ok" : "is-off"} key={check.label}>
                {check.passed ? <Check size={15} /> : <X size={15} />}
                <div>
                  {check.label}
                  {check.detail && <small>{check.detail}</small>}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {result?.result && result.circuit && (
        <ResultPanel qubits={result.circuit.qubits} result={result.result} />
      )}

      {solved && <p className="workbench-solved">Desafio concluído.</p>}
    </section>
  );
}
