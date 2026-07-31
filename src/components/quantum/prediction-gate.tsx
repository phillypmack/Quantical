"use client";

import { useMemo, useState } from "react";
import { Check, Lightbulb, Target } from "lucide-react";

import { cn } from "@/lib/cn";

/**
 * Portão de previsão: o aluno NÃO consegue executar antes de apostar.
 *
 * A aula já dizia, em texto, "preveja o resultado antes de executar" — e não
 * oferecia nenhum instrumento para isso. Era instrução sem ferramenta.
 * Aqui a previsão vira uma porta trancada, e o instrumento de palpite é a
 * própria interface de resultado, para o aluno não precisar traduzir nada.
 *
 * Custo de autoria: zero. A verdade é o simulador — não há gabarito a
 * escrever, para nenhum circuito, em nenhuma aula.
 */

export type PredictionInstrument = "choice" | "slider" | "bars";

export type PredictionSpec = {
  instrument: PredictionInstrument;
  question: string;
  /** Estados da base envolvidos, na ordem em que aparecem. */
  states: string[];
  /**
   * Só para `choice`: alternativas de histograma desenhadas.
   *
   * `equivoco` marca o palpite que revela um engano nomeado — é assim que um
   * palpite errado vira "você tende a pensar que H sorteia" em vez de sumir.
   */
  choices?: {
    id: string;
    label: string;
    distribution: Record<string, number>;
    equivoco?: string;
  }[];
};

export type Prediction = Record<string, number>;

/** Dentro desta margem, a intuição do aluno conta como afiada. */
export const PREDICTION_TOLERANCE = 0.1;

export function scorePrediction(prediction: Prediction, actual: Record<string, number>) {
  const states = new Set([...Object.keys(prediction), ...Object.keys(actual)]);
  let worst = 0;
  for (const state of states) {
    worst = Math.max(worst, Math.abs((prediction[state] ?? 0) - (actual[state] ?? 0)));
  }
  return { worst, sharp: worst <= PREDICTION_TOLERANCE };
}

/**
 * Qual alternativa foi escolhida — não só a distribuição resultante.
 *
 * Duas alternativas podem produzir a mesma distribuição por caminhos de
 * raciocínio diferentes; sem o id, o equívoco por trás do palpite se perde.
 */
export type EscolhaPrevisao = { id: string; equivoco?: string };

type PredictionGateProps = {
  spec: PredictionSpec;
  onCommit: (prediction: Prediction, escolha?: EscolhaPrevisao) => void;
  committed?: Prediction;
};

export function PredictionGate({ spec, onCommit, committed }: PredictionGateProps) {
  const [choice, setChoice] = useState<string>();
  const [slider, setSlider] = useState(50);
  const [bars, setBars] = useState<Record<string, number>>(() =>
    Object.fromEntries(spec.states.map((state) => [state, 1 / spec.states.length])),
  );

  const prediction = useMemo<Prediction | undefined>(() => {
    if (spec.instrument === "choice") {
      return spec.choices?.find((option) => option.id === choice)?.distribution;
    }
    if (spec.instrument === "slider") {
      const [zero, one] = spec.states;
      return { [zero]: 1 - slider / 100, [one]: slider / 100 };
    }
    const total = Object.values(bars).reduce((sum, value) => sum + value, 0) || 1;
    return Object.fromEntries(Object.entries(bars).map(([state, value]) => [state, value / total]));
  }, [spec, choice, slider, bars]);

  if (committed) {
    return (
      <div className="prediction-gate is-committed">
        <span className="prediction-badge">
          <Check size={14} /> Palpite registrado
        </span>
        <p>
          Você apostou em{" "}
          {Object.entries(committed)
            .filter(([, value]) => value > 0.005)
            .map(([state, value]) => `|${state}⟩ ${Math.round(value * 100)}%`)
            .join(" · ")}
          . Agora execute e compare.
        </p>
      </div>
    );
  }

  return (
    <div className="prediction-gate">
      <span className="prediction-badge">
        <Target size={14} /> Antes de rodar
      </span>
      <h4>{spec.question}</h4>

      {spec.instrument === "choice" && (
        <div className="prediction-choices" role="radiogroup" aria-label={spec.question}>
          {spec.choices?.map((option) => (
            <button
              aria-checked={choice === option.id}
              className={cn("prediction-choice", choice === option.id && "is-selected")}
              key={option.id}
              onClick={() => setChoice(option.id)}
              role="radio"
              type="button"
            >
              <span className="prediction-mini" aria-hidden="true">
                {spec.states.map((state) => (
                  <i
                    key={state}
                    style={{ height: `${Math.max(3, (option.distribution[state] ?? 0) * 100)}%` }}
                  />
                ))}
              </span>
              <small>{option.label}</small>
            </button>
          ))}
        </div>
      )}

      {spec.instrument === "slider" && (
        <label className="prediction-slider">
          <span>
            Chance de sair <strong>|{spec.states[1]}⟩</strong>: {slider}%
          </span>
          <input
            max={100}
            min={0}
            onChange={(event) => setSlider(Number(event.target.value))}
            step={5}
            type="range"
            value={slider}
          />
          <small>
            |{spec.states[0]}⟩ fica com {100 - slider}%
          </small>
        </label>
      )}

      {spec.instrument === "bars" && (
        <div className="prediction-bars">
          {spec.states.map((state) => (
            <label key={state}>
              <span>|{state}⟩</span>
              <input
                max={100}
                min={0}
                onChange={(event) =>
                  setBars((current) => ({ ...current, [state]: Number(event.target.value) / 100 }))
                }
                step={5}
                type="range"
                value={Math.round((bars[state] ?? 0) * 100)}
              />
              <b>{Math.round((bars[state] ?? 0) * 100)}%</b>
            </label>
          ))}
          <small>Os valores são normalizados para somar 100%.</small>
        </div>
      )}

      <div className="prediction-actions">
        <button
          className="button button--dark button--small"
          disabled={!prediction}
          onClick={() => {
            if (!prediction) return;
            const option = spec.choices?.find((item) => item.id === choice);
            onCommit(prediction, option && { id: option.id, equivoco: option.equivoco });
          }}
          type="button"
        >
          Registrar palpite
        </button>
        <span className="prediction-hint">
          <Lightbulb size={13} /> Errar aqui é o ponto: é o que revela onde sua intuição precisa mudar.
        </span>
      </div>
    </div>
  );
}

export function PredictionVerdict({
  prediction,
  actual,
}: {
  prediction: Prediction;
  actual: Record<string, number>;
}) {
  const { worst, sharp } = scorePrediction(prediction, actual);
  const gaps = Object.keys({ ...prediction, ...actual })
    .map((state) => ({
      state,
      guess: prediction[state] ?? 0,
      real: actual[state] ?? 0,
    }))
    .filter((row) => Math.abs(row.guess - row.real) > PREDICTION_TOLERANCE)
    .sort((a, b) => Math.abs(b.guess - b.real) - Math.abs(a.guess - a.real));

  return (
    <div className={cn("prediction-verdict", sharp ? "is-sharp" : "is-off")}>
      <strong>{sharp ? "Intuição afiada." : "Sua intuição errou aqui — e é justamente por isso que funciona."}</strong>
      {sharp ? (
        <p>Sua previsão ficou a {Math.round(worst * 100)} pontos percentuais do resultado real.</p>
      ) : (
        <ul>
          {gaps.slice(0, 3).map((row) => (
            <li key={row.state}>
              <code>|{row.state}⟩</code> você apostou {Math.round(row.guess * 100)}%, o circuito deu{" "}
              <strong>{Math.round(row.real * 100)}%</strong>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
