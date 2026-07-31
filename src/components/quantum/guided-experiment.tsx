"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowRight, Check, ExternalLink, Play, RotateCcw, Split } from "lucide-react";
import Link from "next/link";

import { cn } from "@/lib/cn";
import { circuitHref } from "@/lib/quantum/permalink";
import { SimulationFailure, SimulatorClient } from "@/lib/quantum/simulator-client";
import type { Circuit, SimulationResult } from "@/lib/quantum/types";
import { CircuitDiagram } from "./circuit-diagram";
import { PredictionGate, PredictionVerdict, type Prediction, type PredictionSpec } from "./prediction-gate";
import { ResultPanel } from "./result-panel";

export type GuidedBranch = {
  id: string;
  label: string;
  question: string;
  circuit: Circuit;
  reveal: string;
};

export type GuidedStep = {
  id: string;
  instruction: string;
  circuit: Circuit;
  predict?: PredictionSpec;
  /** O que dizer DEPOIS que a realidade aparece. É onde mora a lição. */
  reveal: string;
  branches?: GuidedBranch[];
};

/**
 * Experimento guiado: um roteiro, não um link.
 *
 * O card "Experimento guiado" prometia "um circuito preparado para este
 * conceito" e mandava o aluno para /laboratorio sem nenhum parâmetro — tela
 * em branco, sem tarefa, sem objetivo. E mesmo com o circuito carregado o
 * problema continuaria: um laboratório é uma ferramenta, não uma aula.
 * Ferramenta sem tarefa produz paralisia.
 */
export function GuidedExperiment({
  steps,
  title,
  onComplete,
}: {
  steps: GuidedStep[];
  title: string;
  onComplete?: () => void;
}) {
  const [index, setIndex] = useState(0);
  const [predictions, setPredictions] = useState<Record<string, Prediction>>({});
  const [results, setResults] = useState<Record<string, SimulationResult>>({});
  const [branch, setBranch] = useState<GuidedBranch | null>(null);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string>();

  const clientRef = useRef<SimulatorClient | null>(null);
  useEffect(() => {
    clientRef.current = new SimulatorClient();
    return () => clientRef.current?.dispose();
  }, []);

  const step = steps[index];
  const active = branch ?? step;
  const key = branch ? `${step.id}:${branch.id}` : step.id;
  const prediction = predictions[step.id];
  const result = results[key];
  const needsPrediction = Boolean(step.predict) && !prediction && !branch;

  const actual = useMemo(() => {
    if (!result) return undefined;
    return Object.fromEntries(
      result.probabilities.map((probability, position) => [
        position.toString(2).padStart(active.circuit.qubits, "0"),
        probability,
      ]),
    );
  }, [result, active.circuit.qubits]);

  const run = useCallback(async () => {
    setRunning(true);
    setError(undefined);
    try {
      const simulation = await clientRef.current!.run({ ...active.circuit, captureSteps: true });
      setResults((current) => ({ ...current, [key]: simulation }));
    } catch (caught) {
      setError(caught instanceof SimulationFailure ? caught.message : "A simulação falhou.");
    } finally {
      setRunning(false);
    }
  }, [active.circuit, key]);

  const goTo = (next: number) => {
    setIndex(next);
    setBranch(null);
    setError(undefined);
    if (next >= steps.length - 1) onComplete?.();
  };

  return (
    <section className="guided" aria-label={`Experimento guiado: ${title}`}>
      <header className="guided-header">
        <div>
          <span className="guided-eyebrow">Experimento guiado</span>
          <h3>{title}</h3>
        </div>
        <ol className="guided-progress" aria-label="Progresso do roteiro">
          {steps.map((item, position) => (
            <li key={item.id}>
              <button
                aria-current={position === index}
                aria-label={`Passo ${position + 1}`}
                className={cn(
                  position === index && "is-current",
                  results[item.id] && "is-done",
                )}
                // Só libera passos já alcançados: o roteiro é uma escada.
                disabled={position > index}
                onClick={() => goTo(position)}
                type="button"
              >
                {results[item.id] && position !== index ? <Check size={12} /> : position + 1}
              </button>
            </li>
          ))}
        </ol>
      </header>

      <div className="guided-body">
        <div className="guided-instruction">
          <p>{branch ? branch.question : step.instruction}</p>
          {branch && (
            <button className="guided-back" onClick={() => setBranch(null)} type="button">
              <RotateCcw size={13} /> Voltar ao passo {index + 1}
            </button>
          )}
        </div>

        <CircuitDiagram circuit={active.circuit} />

        {needsPrediction && step.predict && (
          <PredictionGate
            onCommit={(value) => setPredictions((current) => ({ ...current, [step.id]: value }))}
            spec={step.predict}
          />
        )}

        {prediction && !branch && step.predict && (
          <PredictionGate committed={prediction} onCommit={() => {}} spec={step.predict} />
        )}

        <div className="guided-actions">
          <button
            className="button button--dark"
            // A trava: sem palpite registrado, não roda.
            disabled={running || needsPrediction}
            onClick={() => void run()}
            type="button"
          >
            <Play size={15} /> {running ? "Simulando…" : result ? "Rodar de novo" : "Executar"}
          </button>
          {needsPrediction && (
            <span className="guided-locked">Registre seu palpite para liberar a execução.</span>
          )}
          <Link className="guided-open" href={circuitHref(active.circuit)}>
            Abrir no laboratório <ExternalLink size={13} />
          </Link>
        </div>

        {error && (
          <p className="guided-error" role="alert">
            {error}
          </p>
        )}

        {result && (
          <>
            {prediction && actual && !branch && (
              <PredictionVerdict actual={actual} prediction={prediction} />
            )}

            <ResultPanel
              prediction={branch ? undefined : prediction}
              qubits={active.circuit.qubits}
              result={result}
            />

            <div className="guided-reveal">
              <span>O que aconteceu</span>
              <p>{active.reveal}</p>
            </div>

            {!branch && step.branches?.length ? (
              <div className="guided-branches">
                <span>
                  <Split size={14} /> E se…?
                </span>
                <div>
                  {step.branches.map((option) => (
                    <button key={option.id} onClick={() => setBranch(option)} type="button">
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}

            {!branch && (
              <div className="guided-next">
                {index < steps.length - 1 ? (
                  <button className="button button--light" onClick={() => goTo(index + 1)} type="button">
                    Próximo passo <ArrowRight size={15} />
                  </button>
                ) : (
                  <p className="guided-finished">
                    <Check size={15} /> Roteiro concluído.
                  </p>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
}
