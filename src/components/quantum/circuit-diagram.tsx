"use client";

import { cn } from "@/lib/cn";
import type { Circuit, Operation } from "@/lib/quantum/types";

const GLYPH: Partial<Record<string, string>> = {
  CNOT: "⊕", CCX: "⊕", MCX: "⊕", CY: "Y", CZ: "Z", CCZ: "Z", MCZ: "Z",
  SWAP: "×", ISWAP: "×", CSWAP: "×", MEASURE: "M", BARRIER: "▏",
};

function glyphFor(operation: Operation) {
  if (GLYPH[operation.gate]) return GLYPH[operation.gate]!;
  if (operation.gate === "CRX") return "RX";
  if (operation.gate === "CRY") return "RY";
  if (operation.gate === "CRZ") return "RZ";
  if (operation.gate === "CP") return "P";
  return operation.gate;
}

function angleLabel(operation: Operation) {
  const value = operation.params?.[0];
  if (value === undefined) return null;
  const ratio = value / Math.PI;
  if (Math.abs(ratio - 0.5) < 1e-9) return "π/2";
  if (Math.abs(ratio - 0.25) < 1e-9) return "π/4";
  if (Math.abs(ratio - 1) < 1e-9) return "π";
  return value.toFixed(2);
}

type CircuitDiagramProps = {
  circuit: Circuit;
  /** Índice da operação em foco — usado pelo cursor de passos. */
  highlight?: number;
  onRemove?: (id: string) => void;
  onDropGate?: (qubit: number, payload: string) => void;
};

export function CircuitDiagram({ circuit, highlight, onRemove, onDropGate }: CircuitDiagramProps) {
  const operations = [...circuit.operations].sort((a, b) => a.position - b.position);

  return (
    <div className="circuit-diagram" aria-label="Diagrama do circuito" role="group">
      {Array.from({ length: circuit.qubits }, (_, qubit) => (
        <div
          className="circuit-row"
          key={qubit}
          onDragOver={onDropGate ? (event) => event.preventDefault() : undefined}
          onDrop={
            onDropGate
              ? (event) => {
                  event.preventDefault();
                  onDropGate(qubit, event.dataTransfer.getData("gate"));
                }
              : undefined
          }
        >
          <span className="circuit-qubit">
            <b>q{qubit}</b>
            <small>|0⟩</small>
          </span>
          <div className="circuit-wire">
            {operations.map((operation, index) => {
              const isTarget = operation.targets.includes(qubit);
              const isControl = operation.controls?.includes(qubit) ?? false;
              const spanned =
                [...operation.targets, ...(operation.controls ?? [])].length > 1 &&
                qubit > Math.min(...operation.targets, ...(operation.controls ?? [])) &&
                qubit < Math.max(...operation.targets, ...(operation.controls ?? []));

              return (
                <div
                  className={cn(
                    "circuit-slot",
                    highlight === index && "is-highlighted",
                    highlight !== undefined && index > highlight && "is-future",
                  )}
                  key={operation.id}
                >
                  {spanned && <i className="circuit-link" aria-hidden="true" />}
                  {isControl && (
                    <button
                      aria-label={`Controle de ${operation.gate} em q${qubit}`}
                      className="circuit-control"
                      disabled={!onRemove}
                      onClick={() => onRemove?.(operation.id)}
                      type="button"
                    >
                      <i className="circuit-link" aria-hidden="true" />
                    </button>
                  )}
                  {isTarget && (
                    <button
                      aria-label={`${operation.gate} em q${qubit}${onRemove ? ". Clique para remover." : ""}`}
                      className={cn(
                        "circuit-gate",
                        `is-${operation.gate.toLowerCase()}`,
                        operation.gate === "MEASURE" && "is-measure",
                      )}
                      disabled={!onRemove}
                      onClick={() => onRemove?.(operation.id)}
                      type="button"
                    >
                      {glyphFor(operation)}
                      {angleLabel(operation) && <small>{angleLabel(operation)}</small>}
                    </button>
                  )}
                </div>
              );
            })}
            {operations.length === 0 && (
              <span className="circuit-empty">Sem portas — o qubit fica em |0⟩</span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
