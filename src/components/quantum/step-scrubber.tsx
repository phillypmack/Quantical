"use client";

import { useEffect, useRef, useState } from "react";
import { Pause, Play, SkipBack, SkipForward } from "lucide-react";

import { cn } from "@/lib/cn";
import type { StepSnapshot } from "@/lib/quantum/types";

/**
 * Cursor de tempo sobre as portas do circuito.
 *
 * Sem isto o aluno aperta Executar e recebe a resposta final: tudo que
 * acontece no meio fica invisível — e o meio É o conceito. Arrastando o
 * cursor, a esfera de Bloch gira, as amplitudes mudam e o histograma se
 * deforma em sincronia. É o que transforma "H coloca o qubit em superposição"
 * de frase lida em coisa assistida.
 */

const FRAME_MS = 900;

type StepScrubberProps = {
  steps: readonly StepSnapshot[];
  index: number;
  onChange: (index: number) => void;
};

export function StepScrubber({ steps, index, onChange }: StepScrubberProps) {
  const [playing, setPlaying] = useState(false);
  const onChangeRef = useRef(onChange);

  // Atualizar ref durante o render dispara render em cascata; o lugar certo
  // é um efeito de sincronização.
  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    if (!playing) return;
    const timer = setInterval(() => {
      onChangeRef.current(index + 1);
      if (index + 1 >= steps.length - 1) setPlaying(false);
    }, FRAME_MS);
    return () => clearInterval(timer);
  }, [playing, index, steps.length]);

  if (steps.length < 2) return null;

  const last = steps.length - 1;
  const current = steps[Math.min(index, last)];

  return (
    <section className="step-scrubber" aria-label="Linha do tempo do circuito">
      <header>
        <div>
          <span className="step-counter">
            Passo {index} de {last}
          </span>
          <strong>{current.label}</strong>
        </div>
        <div className="step-controls">
          <button
            aria-label="Voltar uma porta"
            disabled={index === 0}
            onClick={() => {
              setPlaying(false);
              onChange(index - 1);
            }}
            type="button"
          >
            <SkipBack size={15} />
          </button>
          <button
            aria-label={playing ? "Pausar" : "Reproduzir passo a passo"}
            onClick={() => {
              if (index >= last) onChange(0);
              setPlaying((value) => !value);
            }}
            type="button"
          >
            {playing ? <Pause size={15} /> : <Play size={15} />}
          </button>
          <button
            aria-label="Avançar uma porta"
            disabled={index >= last}
            onClick={() => {
              setPlaying(false);
              onChange(index + 1);
            }}
            type="button"
          >
            <SkipForward size={15} />
          </button>
        </div>
      </header>

      <input
        aria-label="Posição no circuito"
        aria-valuetext={current.label}
        className="step-range"
        max={last}
        min={0}
        onChange={(event) => {
          setPlaying(false);
          onChange(Number(event.target.value));
        }}
        step={1}
        type="range"
        value={Math.min(index, last)}
      />

      <ol className="step-ticks">
        {steps.map((step, position) => (
          <li key={`${step.operationId ?? "inicial"}-${position}`}>
            <button
              aria-current={position === index}
              className={cn(position === index && "is-current", position < index && "is-past")}
              onClick={() => {
                setPlaying(false);
                onChange(position);
              }}
              title={step.label}
              type="button"
            >
              {position === 0 ? "início" : (step.gate ?? "?")}
            </button>
          </li>
        ))}
      </ol>
    </section>
  );
}
