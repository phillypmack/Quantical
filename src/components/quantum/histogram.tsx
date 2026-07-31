"use client";

import { useMemo } from "react";

import { HISTOGRAM_TOP_K } from "@/lib/quantum/types";
import { cn } from "@/lib/cn";

export type HistogramBar = {
  state: string;
  probability: number;
  /** Fração observada nos shots. Ausente no modo teórico. */
  sampled?: number;
  /** Palpite do aluno, desenhado como barra-fantasma atrás da real. */
  predicted?: number;
};

type HistogramProps = {
  qubits: number;
  probabilities: readonly number[];
  counts?: Record<string, number>;
  shots?: number;
  mode?: "teorico" | "shots";
  prediction?: Record<string, number>;
  /** Esconde os valores reais até o aluno registrar a previsão. */
  hidden?: boolean;
  onSelect?: (state: string) => void;
  selected?: string;
};

export function buildBars(
  qubits: number,
  probabilities: readonly number[],
  counts?: Record<string, number>,
  shots?: number,
): HistogramBar[] {
  const bars = probabilities.map((probability, index) => {
    const state = index.toString(2).padStart(qubits, "0");
    return {
      state,
      probability,
      sampled: counts && shots ? (counts[state] ?? 0) / shots : undefined,
    };
  });

  // Com 16 qubits seriam 65.536 colunas no DOM. Mostra as maiores e agrupa o resto.
  if (bars.length <= HISTOGRAM_TOP_K) return bars;

  const sorted = [...bars].sort((a, b) => b.probability - a.probability);
  const top = sorted.slice(0, HISTOGRAM_TOP_K).filter((bar) => bar.probability > 1e-9);
  const rest = sorted.slice(top.length).reduce((sum, bar) => sum + bar.probability, 0);

  const visible: HistogramBar[] = top.sort((a, b) => a.state.localeCompare(b.state));
  if (rest > 1e-9) visible.push({ state: "outros", probability: rest });
  return visible;
}

export function Histogram({
  qubits,
  probabilities,
  counts,
  shots,
  mode = "teorico",
  prediction,
  hidden = false,
  onSelect,
  selected,
}: HistogramProps) {
  const bars = useMemo(
    () => buildBars(qubits, probabilities, counts, shots),
    [qubits, probabilities, counts, shots],
  );

  const valueOf = (bar: HistogramBar) =>
    mode === "shots" && bar.sampled !== undefined ? bar.sampled : bar.probability;

  // Escala fixa em 100%: normalizar pelo máximo, como antes, fazia 30% e 90%
  // parecerem a mesma coisa em circuitos diferentes.
  const format = (value: number) => `${(value * 100).toFixed(value >= 0.1 ? 0 : 1)}%`;

  return (
    <div className={cn("histogram", hidden && "is-hidden")}>
      <div className="histogram-scale" aria-hidden="true">
        <span>100%</span>
        <span>50%</span>
        <span>0%</span>
      </div>
      <div className="histogram-bars" role="list">
        {bars.map((bar) => {
          const value = valueOf(bar);
          const guess = prediction?.[bar.state];
          const isClickable = Boolean(onSelect) && bar.state !== "outros";
          return (
            <div
              className={cn("histogram-column", selected === bar.state && "is-selected")}
              key={bar.state}
              role="listitem"
            >
              <div className="histogram-track">
                {guess !== undefined && (
                  <span
                    className="histogram-guess"
                    style={{ height: `${Math.min(100, guess * 100)}%` }}
                    title={`Sua previsão: ${format(guess)}`}
                  />
                )}
                {!hidden && (
                  <span
                    className="histogram-value"
                    style={{ height: `${Math.min(100, value * 100)}%` }}
                  />
                )}
              </div>
              {isClickable ? (
                <button
                  className="histogram-label"
                  onClick={() => onSelect?.(bar.state)}
                  type="button"
                >
                  |{bar.state}⟩
                </button>
              ) : (
                <span className="histogram-label">
                  {bar.state === "outros" ? "outros" : `|${bar.state}⟩`}
                </span>
              )}
              <small className="histogram-readout">
                {hidden ? "?" : value >= 0.005 ? format(value) : ""}
              </small>
            </div>
          );
        })}
      </div>
      {mode === "shots" && shots ? (
        <p className="histogram-footnote">
          Frequência observada em {shots.toLocaleString("pt-BR")} medições. Rode de novo: os números
          mudam, porque cada execução é uma amostra nova.
        </p>
      ) : null}
    </div>
  );
}
