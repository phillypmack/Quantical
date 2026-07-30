"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Braces,
  Check,
  ChevronDown,
  CircleHelp,
  Clipboard,
  Code2,
  Download,
  Eraser,
  FlaskConical,
  GripVertical,
  Play,
  Save,
  Trash2,
} from "lucide-react";

import { parseQiskit } from "@/lib/quantum/parser";
import { circuitToQiskit } from "@/lib/quantum/qiskit";
import { simulateCircuit } from "@/lib/quantum/simulator";
import type { Circuit, GateName, SimulationResult } from "@/lib/quantum/types";
import { cn } from "@/lib/cn";
import { useProgress } from "./progress-provider";

const initialCircuit: Circuit = {
  qubits: 2,
  shots: 1024,
  operations: [
    { id: "initial-h", gate: "H", targets: [0], position: 0 },
    { id: "initial-cx", gate: "CNOT", controls: [0], targets: [1], position: 1 },
  ],
};

const gates: { gate: GateName; label: string; group: string }[] = [
  { gate: "H", label: "Hadamard", group: "Básicas" },
  { gate: "X", label: "Pauli X", group: "Básicas" },
  { gate: "Y", label: "Pauli Y", group: "Básicas" },
  { gate: "Z", label: "Pauli Z", group: "Básicas" },
  { gate: "S", label: "Fase S", group: "Fase" },
  { gate: "T", label: "Fase T", group: "Fase" },
  { gate: "RX", label: "Rotação X", group: "Rotações" },
  { gate: "RY", label: "Rotação Y", group: "Rotações" },
  { gate: "RZ", label: "Rotação Z", group: "Rotações" },
  { gate: "CNOT", label: "Controlada X", group: "Múltiplos" },
  { gate: "CZ", label: "Controlada Z", group: "Múltiplos" },
  { gate: "SWAP", label: "Troca", group: "Múltiplos" },
];

function makeOperation(gate: GateName, target: number, circuit: Circuit) {
  const id = `${gate.toLowerCase()}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  const position = circuit.operations.length;
  if (gate === "CNOT" || gate === "CZ") {
    if (circuit.qubits < 2) throw new Error(`A porta ${gate} precisa de pelo menos 2 qubits.`);
    const control = target === 0 ? 1 : 0;
    return { id, gate, controls: [control], targets: [target], position };
  }
  if (gate === "SWAP") {
    if (circuit.qubits < 2) throw new Error("A porta SWAP precisa de pelo menos 2 qubits.");
    const second = target === circuit.qubits - 1 ? 0 : target + 1;
    return { id, gate, targets: [target, second], position };
  }
  if (["RX", "RY", "RZ"].includes(gate)) {
    return { id, gate, targets: [target], params: [Math.PI / 2], position };
  }
  return { id, gate, targets: [target], position };
}

function formatAmplitude(value: { re: number; im: number }) {
  if (Math.abs(value.im) < 0.0001) return value.re.toFixed(3);
  if (Math.abs(value.re) < 0.0001) return `${value.im.toFixed(3)}i`;
  return `${value.re.toFixed(3)} ${value.im >= 0 ? "+" : "−"} ${Math.abs(value.im).toFixed(3)}i`;
}

export function QuantumLab() {
  const { saveProject } = useProgress();
  const [circuit, setCircuit] = useState<Circuit>(initialCircuit);
  const [code, setCode] = useState(() => circuitToQiskit(initialCircuit));
  const [result, setResult] = useState<SimulationResult>(() => simulateCircuit(initialCircuit));
  const [mode, setMode] = useState<"visual" | "codigo">("visual");
  const [panel, setPanel] = useState<"probabilidades" | "estado" | "bloch">("probabilidades");
  const [error, setError] = useState<string>();
  const [running, setRunning] = useState(false);
  const [copied, setCopied] = useState(false);
  const workerRef = useRef<Worker | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      workerRef.current = new Worker(new URL("../workers/quantum.worker.ts", import.meta.url));
    } catch {
      workerRef.current = null;
    }
    return () => workerRef.current?.terminate();
  }, []);

  const updateCircuit = useCallback((next: Circuit) => {
    setCircuit(next);
    setCode(circuitToQiskit(next));
    setError(undefined);
  }, []);

  const addGate = useCallback(
    (gate: GateName, target: number) => {
      try {
        const operation = makeOperation(gate, target, circuit);
        updateCircuit({ ...circuit, operations: [...circuit.operations, operation] });
      } catch (caught) {
        setError(caught instanceof Error ? caught.message : "Não foi possível adicionar a porta.");
      }
    },
    [circuit, updateCircuit],
  );

  const run = useCallback(() => {
    setRunning(true);
    setError(undefined);
    let nextCircuit = circuit;
    try {
      if (mode === "codigo") {
        nextCircuit = parseQiskit(code, circuit.shots);
        setCircuit(nextCircuit);
      }
    } catch (caught) {
      setRunning(false);
      setError(caught instanceof Error ? caught.message : "Revise o código do circuito.");
      return;
    }

    const worker = workerRef.current;
    if (!worker) {
      try {
        setResult(simulateCircuit(nextCircuit));
      } catch (caught) {
        setError(caught instanceof Error ? caught.message : "A simulação falhou.");
      } finally {
        setRunning(false);
      }
      return;
    }
    worker.onmessage = (event: MessageEvent<{ result?: SimulationResult; error?: string }>) => {
      setRunning(false);
      if (event.data.error) setError(event.data.error);
      if (event.data.result) setResult(event.data.result);
    };
    worker.postMessage(nextCircuit);
  }, [circuit, code, mode]);

  const maxProbability = Math.max(...result.probabilities, 0.0001);
  const stateRows = useMemo(
    () =>
      result.amplitudes
        .map((amplitude, index) => ({
          amplitude,
          probability: result.probabilities[index],
          state: index.toString(2).padStart(circuit.qubits, "0"),
        }))
        .filter((row) => row.probability > 0.00001),
    [result, circuit.qubits],
  );

  return (
    <div className="lab-app">
      <aside className="gate-palette">
        <div className="palette-heading">
          <FlaskConical size={18} />
          <div><strong>Portas</strong><span>Arraste para o circuito</span></div>
        </div>
        {["Básicas", "Fase", "Rotações", "Múltiplos"].map((group) => (
          <div className="gate-group" key={group}>
            <span>{group}</span>
            <div>
              {gates.filter((item) => item.group === group).map((item) => (
                <button
                  draggable
                  key={item.gate}
                  onClick={() => addGate(item.gate, 0)}
                  onDragStart={(event) => event.dataTransfer.setData("gate", item.gate)}
                  title={`${item.label}. Clique para adicionar em q0 ou arraste.`}
                  type="button"
                >
                  <GripVertical size={11} />
                  <b>{item.gate === "CNOT" ? "CX" : item.gate}</b>
                  <small>{item.label}</small>
                </button>
              ))}
            </div>
          </div>
        ))}
        <div className="palette-tip">
          <CircleHelp size={15} />
          <p><strong>Dica</strong> Clique em uma porta no circuito para removê-la.</p>
        </div>
      </aside>

      <section className="lab-workspace">
        <div className="lab-toolbar">
          <div className="lab-tabs" role="tablist" aria-label="Modo do laboratório">
            <button className={mode === "visual" ? "is-active" : ""} onClick={() => setMode("visual")} role="tab" type="button">
              <Braces size={15} /> Circuito
            </button>
            <button className={mode === "codigo" ? "is-active" : ""} onClick={() => setMode("codigo")} role="tab" type="button">
              <Code2 size={15} /> Código
            </button>
          </div>
          <div className="lab-settings">
            <label>
              Qubits
              <select
                onChange={(event) => {
                  const qubits = Number(event.target.value);
                  updateCircuit({
                    ...circuit,
                    qubits,
                    operations: circuit.operations.filter((operation) =>
                      [...operation.targets, ...(operation.controls ?? [])].every((qubit) => qubit < qubits),
                    ),
                  });
                }}
                value={circuit.qubits}
              >
                {[1, 2, 3, 4, 5, 6].map((value) => <option key={value}>{value}</option>)}
              </select>
            </label>
            <label>
              Shots
              <select onChange={(event) => setCircuit({ ...circuit, shots: Number(event.target.value) })} value={circuit.shots}>
                {[256, 512, 1024, 2048, 4096].map((value) => <option key={value}>{value}</option>)}
              </select>
            </label>
          </div>
        </div>

        {mode === "visual" ? (
          <div className="circuit-canvas">
            <div className="canvas-grid" aria-label={`Circuito com ${circuit.qubits} qubits`}>
              {Array.from({ length: circuit.qubits }, (_, qubit) => (
                <div
                  className="circuit-row"
                  key={qubit}
                  onDragOver={(event) => event.preventDefault()}
                  onDrop={(event) => addGate(event.dataTransfer.getData("gate") as GateName, qubit)}
                >
                  <div className="wire-label"><strong>q{qubit}</strong><span>|0⟩</span></div>
                  <div className="workspace-wire">
                    {circuit.operations.map((operation) => {
                      const isTarget = operation.targets.includes(qubit);
                      const isControl = operation.controls?.includes(qubit);
                      return (
                        <div className="operation-slot" key={`${operation.id}-${qubit}`}>
                          {isTarget && (
                            <button
                              className={cn("circuit-gate", operation.gate === "CNOT" && "is-controlled", operation.gate === "SWAP" && "is-swap")}
                              onClick={() => updateCircuit({ ...circuit, operations: circuit.operations.filter((item) => item.id !== operation.id) })}
                              title={`${operation.gate}: remover`}
                              type="button"
                            >
                              {operation.gate === "CNOT" ? "X" : operation.gate === "SWAP" ? "×" : operation.gate}
                            </button>
                          )}
                          {isControl && <button className="control-dot" onClick={() => updateCircuit({ ...circuit, operations: circuit.operations.filter((item) => item.id !== operation.id) })} title="Remover porta controlada" type="button" />}
                          {(isTarget || isControl) && (operation.gate === "CNOT" || operation.gate === "CZ") && <i className="control-line" />}
                        </div>
                      );
                    })}
                    <div className="measure-gate"><i /><span>M</span></div>
                  </div>
                </div>
              ))}
              {circuit.operations.length === 0 && (
                <div className="canvas-empty">Arraste uma porta para qualquer linha</div>
              )}
            </div>
          </div>
        ) : (
          <div className="code-editor-wrap">
            <div className="editor-topbar">
              <span>main.py</span>
              <button
                onClick={async () => {
                  await navigator.clipboard.writeText(code);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 1400);
                }}
                type="button"
              >
                {copied ? <Check size={14} /> : <Clipboard size={14} />} {copied ? "Copiado" : "Copiar"}
              </button>
            </div>
            <textarea
              aria-label="Código Python Qiskit"
              onChange={(event) => setCode(event.target.value)}
              spellCheck={false}
              value={code}
            />
          </div>
        )}

        {error && <div className="lab-error" role="alert"><CircleHelp size={16} /> {error}</div>}

        <div className="lab-bottom-bar">
          <div>
            <button
              onClick={() => {
                const next = { ...circuit, operations: [] };
                updateCircuit(next);
                setResult(simulateCircuit(next));
              }}
              type="button"
            >
              <Eraser size={15} /> Limpar
            </button>
            <button
              onClick={() => {
                saveProject({ title: `Circuito de ${circuit.qubits} qubits`, code });
              }}
              type="button"
            >
              <Save size={15} /> Salvar projeto
            </button>
            <button
              onClick={() => {
                const blob = new Blob([code], { type: "text/x-python" });
                const url = URL.createObjectURL(blob);
                const anchor = document.createElement("a");
                anchor.href = url;
                anchor.download = "quantical_circuit.py";
                anchor.click();
                URL.revokeObjectURL(url);
              }}
              type="button"
            >
              <Download size={15} /> Baixar .py
            </button>
          </div>
          <button className="execute-button" disabled={running} onClick={run} type="button">
            <Play fill="currentColor" size={15} /> {running ? "Simulando…" : "Executar"}
          </button>
        </div>
      </section>

      <aside className="result-panel">
        <div className="result-heading">
          <div><span>Resultado</span><small>{result.executionTime.toFixed(2)} ms</small></div>
          <button aria-label="Opções de resultado" type="button"><ChevronDown size={15} /></button>
        </div>
        <div className="result-tabs">
          <button className={panel === "probabilidades" ? "is-active" : ""} onClick={() => setPanel("probabilidades")} type="button">Prob.</button>
          <button className={panel === "estado" ? "is-active" : ""} onClick={() => setPanel("estado")} type="button">Estado</button>
          <button className={panel === "bloch" ? "is-active" : ""} onClick={() => setPanel("bloch")} type="button">Bloch</button>
        </div>
        {panel === "probabilidades" && (
          <div className="histogram">
            <div className="histogram-scale"><span>100%</span><span>50%</span><span>0%</span></div>
            <div className="histogram-bars">
              {result.probabilities.map((probability, index) => (
                <div className="histogram-column" key={index}>
                  <div className="histogram-bar-wrap">
                    <b>{probability >= .01 ? `${Math.round(probability * 100)}%` : ""}</b>
                    <i style={{ height: `${(probability / maxProbability) * 100}%` }} />
                  </div>
                  <span>|{index.toString(2).padStart(circuit.qubits, "0")}⟩</span>
                </div>
              ))}
            </div>
          </div>
        )}
        {panel === "estado" && (
          <div className="state-table">
            <div><span>Estado</span><span>Amplitude</span><span>Prob.</span></div>
            {stateRows.map((row) => (
              <div key={row.state}>
                <strong>|{row.state}⟩</strong>
                <code>{formatAmplitude(row.amplitude)}</code>
                <span>{(row.probability * 100).toFixed(1)}%</span>
              </div>
            ))}
          </div>
        )}
        {panel === "bloch" && (
          <div className="bloch-panel">
            {result.blochVectors.map((vector, index) => (
              <div key={index}>
                <svg aria-label={`Esfera de Bloch do qubit ${index}`} role="img" viewBox="0 0 180 180">
                  <circle cx="90" cy="90" fill="none" r="67" stroke="#c8ccd4" />
                  <ellipse cx="90" cy="90" fill="none" rx="67" ry="21" stroke="#d8dae0" />
                  <line stroke="#d8dae0" x1="90" x2="90" y1="18" y2="162" />
                  <line stroke="#7457e8" strokeWidth="3" x1="90" x2={90 + vector.x * 58} y1="90" y2={90 - vector.z * 58} />
                  <circle cx={90 + vector.x * 58} cy={90 - vector.z * 58} fill="#7457e8" r="5" />
                  <text fill="#858c9b" fontSize="10" x="96" y="21">|0⟩</text>
                  <text fill="#858c9b" fontSize="10" x="96" y="166">|1⟩</text>
                </svg>
                <strong>q{index}</strong>
                <span>x {vector.x.toFixed(2)} · y {vector.y.toFixed(2)} · z {vector.z.toFixed(2)}</span>
              </div>
            ))}
          </div>
        )}
        <div className="result-insight">
          <span>Leitura</span>
          <p>
            {stateRows.length === 2 && stateRows[0]?.state === "00" && stateRows[1]?.state === "11"
              ? "Você criou um estado de Bell: os qubits estão perfeitamente correlacionados."
              : `${stateRows.length} estado${stateRows.length === 1 ? "" : "s"} com probabilidade observável.`}
          </p>
        </div>
      </aside>
    </div>
  );
}
