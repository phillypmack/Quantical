"use client";

import { useMemo, useState } from "react";

import { cn } from "@/lib/cn";
import { useHydrated } from "@/lib/use-hydrated";
import type { ComplexValue, SimulationResult } from "@/lib/quantum/types";
import { BlochSphere } from "./bloch-sphere";
import { Histogram } from "./histogram";
import { StepScrubber } from "./step-scrubber";
import type { Prediction } from "./prediction-gate";

function formatAmplitude(value: ComplexValue) {
  if (Math.abs(value.im) < 0.0001) return value.re.toFixed(3);
  if (Math.abs(value.re) < 0.0001) return `${value.im.toFixed(3)}i`;
  return `${value.re.toFixed(3)} ${value.im >= 0 ? "+" : "−"} ${Math.abs(value.im).toFixed(3)}i`;
}

/** Fase em graus: é o que RZ, S e T mexem — e a tabela antiga não mostrava. */
function phaseDegrees(value: ComplexValue) {
  if (Math.hypot(value.re, value.im) < 1e-6) return "—";
  return `${((Math.atan2(value.im, value.re) * 180) / Math.PI).toFixed(0)}°`;
}

type ResultPanelProps = {
  qubits: number;
  result: SimulationResult;
  prediction?: Prediction;
  hideValues?: boolean;
  showSteps?: boolean;
};

export function ResultPanel({
  qubits,
  result,
  prediction,
  hideValues = false,
  showSteps = true,
}: ResultPanelProps) {
  const [panel, setPanel] = useState<"probabilidades" | "estado" | "bloch">("probabilidades");
  const [mode, setMode] = useState<"teorico" | "shots">("teorico");
  const [stepIndex, setStepIndex] = useState<number | null>(null);
  // Estado da base selecionado: acende a mesma informação nas três abas.
  const [selected, setSelected] = useState<string>();
  const hydrated = useHydrated();

  const steps = showSteps ? result.steps : [];
  const atLastStep = stepIndex === null || stepIndex >= steps.length - 1;
  const view = stepIndex !== null && steps[stepIndex] ? steps[stepIndex] : result;

  const rows = useMemo(
    () =>
      view.amplitudes
        .map((amplitude, index) => ({
          amplitude,
          probability: view.probabilities[index],
          state: index.toString(2).padStart(qubits, "0"),
        }))
        .filter((row) => row.probability > 1e-5)
        .sort((a, b) => b.probability - a.probability),
    [view, qubits],
  );

  return (
    <section className="result-panel">
      <header className="result-header">
        <div>
          <h2>Resultado</h2>
          {/* Semente e tempo medido são valores de execução: o servidor gera
              uns, o cliente gera outros, e renderizá-los direto quebra a
              hidratação. Só aparecem depois que o cliente assume. */}
          <small>
            {hydrated ? `${result.executionTime.toFixed(2)} ms · semente ${result.seed}` : " "}
          </small>
        </div>
        {panel === "probabilidades" && (
          <div className="result-mode" role="group" aria-label="Fonte dos números">
            <button
              aria-pressed={mode === "teorico"}
              className={cn(mode === "teorico" && "is-active")}
              onClick={() => setMode("teorico")}
              type="button"
            >
              Teórico
            </button>
            <button
              aria-pressed={mode === "shots"}
              className={cn(mode === "shots" && "is-active")}
              onClick={() => setMode("shots")}
              title="Frequências medidas de verdade, com ruído amostral"
              type="button"
            >
              {result.shots} shots
            </button>
          </div>
        )}
      </header>

      <div className="result-tabs" role="tablist" aria-label="Formas de ver o resultado">
        {(["probabilidades", "estado", "bloch"] as const).map((tab) => (
          <button
            aria-controls={`painel-${tab}`}
            aria-selected={panel === tab}
            className={cn(panel === tab && "is-active")}
            id={`aba-${tab}`}
            key={tab}
            onClick={() => setPanel(tab)}
            role="tab"
            type="button"
          >
            {tab === "probabilidades" ? "Prob." : tab === "estado" ? "Estado" : "Bloch"}
          </button>
        ))}
      </div>

      {stepIndex !== null && !atLastStep && (
        <p className="result-step-note">
          Mostrando o estado <strong>no passo {stepIndex}</strong>, não o final.
        </p>
      )}

      <div aria-labelledby={`aba-${panel}`} id={`painel-${panel}`} role="tabpanel">
        {panel === "probabilidades" && (
          <Histogram
            counts={result.counts}
            hidden={hideValues}
            mode={atLastStep ? mode : "teorico"}
            onSelect={(state) => setSelected(state === selected ? undefined : state)}
            prediction={prediction}
            probabilities={view.probabilities}
            qubits={qubits}
            selected={selected}
            shots={result.shots}
          />
        )}

        {panel === "estado" && (
          <div className="state-table-wrap">
            <table className="state-table">
              <thead>
                <tr>
                  <th scope="col">Estado</th>
                  <th scope="col">Amplitude</th>
                  <th scope="col">Fase</th>
                  <th scope="col">Prob.</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr
                    className={cn(selected === row.state && "is-selected")}
                    key={row.state}
                    onClick={() => setSelected(row.state === selected ? undefined : row.state)}
                  >
                    <th scope="row">|{row.state}⟩</th>
                    <td>{hideValues ? "?" : formatAmplitude(row.amplitude)}</td>
                    <td>{hideValues ? "?" : phaseDegrees(row.amplitude)}</td>
                    <td>{hideValues ? "?" : `${(row.probability * 100).toFixed(1)}%`}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {rows.length === 0 && <p className="state-empty">Nenhum estado com probabilidade observável.</p>}
          </div>
        )}

        {panel === "bloch" && (
          <div className="bloch-grid">
            {view.blochVectors.map((vector, qubit) => (
              <BlochSphere key={qubit} qubit={qubit} vector={vector} />
            ))}
          </div>
        )}
      </div>

      {showSteps && steps.length > 1 && (
        <StepScrubber
          index={stepIndex ?? steps.length - 1}
          onChange={(next) => setStepIndex(next)}
          steps={steps}
        />
      )}
    </section>
  );
}
