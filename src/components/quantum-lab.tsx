"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Braces,
  Check,
  CircleHelp,
  Clipboard,
  Code2,
  Download,
  Eraser,
  FlaskConical,
  GripVertical,
  Link2,
  Play,
  Save,
} from "lucide-react";

import { cn } from "@/lib/cn";
import { parseQiskit } from "@/lib/quantum/parser";
import { circuitHref, readCircuitFromHash } from "@/lib/quantum/permalink";
import { circuitToQiskit } from "@/lib/quantum/qiskit";
import { runSync, SimulationFailure, SimulatorClient } from "@/lib/quantum/simulator-client";
import { MAX_QUBITS, type Circuit, type GateName, type SimulationResult } from "@/lib/quantum/types";
import { ResultPanel } from "./quantum/result-panel";
import { CircuitDiagram } from "./quantum/circuit-diagram";
import { useProgress } from "./progress-provider";

const initialCircuit: Circuit = {
  qubits: 2,
  shots: 1024,
  // Semente fixa na carga inicial: sem ela, servidor e cliente sorteiam
  // amostras diferentes e a hidratação diverge. Executar de verdade usa
  // semente aleatória.
  seed: 20260731,
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
  { gate: "SDG", label: "Fase S†", group: "Fase" },
  { gate: "T", label: "Fase T", group: "Fase" },
  { gate: "TDG", label: "Fase T†", group: "Fase" },
  { gate: "P", label: "Fase λ", group: "Fase" },
  { gate: "RX", label: "Rotação X", group: "Rotações" },
  { gate: "RY", label: "Rotação Y", group: "Rotações" },
  { gate: "RZ", label: "Rotação Z", group: "Rotações" },
  { gate: "SX", label: "Raiz de X", group: "Rotações" },
  { gate: "CNOT", label: "Controlada X", group: "Múltiplos" },
  { gate: "CZ", label: "Controlada Z", group: "Múltiplos" },
  { gate: "CP", label: "Fase controlada", group: "Múltiplos" },
  { gate: "SWAP", label: "Troca", group: "Múltiplos" },
  { gate: "CCX", label: "Toffoli", group: "Múltiplos" },
  { gate: "CSWAP", label: "Fredkin", group: "Múltiplos" },
];

const GROUPS = ["Básicas", "Fase", "Rotações", "Múltiplos"];
const PARAMETRIC: GateName[] = ["RX", "RY", "RZ", "P", "CP", "CRX", "CRY", "CRZ"];
const needsAngle = (gate: GateName) => PARAMETRIC.includes(gate);

function makeOperation(gate: GateName, target: number, circuit: Circuit) {
  const id = `${gate.toLowerCase()}-${circuit.operations.length}-${Math.random().toString(36).slice(2, 6)}`;
  const position = circuit.operations.length;
  const others = Array.from({ length: circuit.qubits }, (_, index) => index).filter(
    (qubit) => qubit !== target,
  );

  const base = { id, gate, position, ...(needsAngle(gate) ? { params: [Math.PI / 2] } : {}) };

  if (gate === "CCX" || gate === "CSWAP") {
    if (circuit.qubits < 3) throw new Error(`A porta ${gate} precisa de pelo menos 3 qubits.`);
    return gate === "CCX"
      ? { ...base, controls: others.slice(0, 2), targets: [target] }
      : { ...base, controls: [others[0]], targets: [target, others[1]] };
  }

  if (["CNOT", "CZ", "CP", "CRX", "CRY", "CRZ"].includes(gate)) {
    if (circuit.qubits < 2) throw new Error(`A porta ${gate} precisa de pelo menos 2 qubits.`);
    return { ...base, controls: [others[0]], targets: [target] };
  }

  if (gate === "SWAP" || gate === "ISWAP") {
    if (circuit.qubits < 2) throw new Error(`A porta ${gate} precisa de pelo menos 2 qubits.`);
    return { ...base, targets: [target, others[0]] };
  }

  return { ...base, targets: [target] };
}

export function QuantumLab() {
  const { saveProject } = useProgress();
  const [circuit, setCircuit] = useState<Circuit>(initialCircuit);
  const [code, setCode] = useState(() => circuitToQiskit(initialCircuit));
  const [result, setResult] = useState<SimulationResult>(() => runSync(initialCircuit));
  const [mode, setMode] = useState<"visual" | "codigo">("visual");
  const [error, setError] = useState<string>();
  const [issues, setIssues] = useState<{ line: number; message: string; suggestion?: string }[]>();
  const [running, setRunning] = useState(false);
  const [copied, setCopied] = useState<"code" | "link" | null>(null);
  // Impede que uma edição visual apague código escrito à mão sem avisar.
  const [codeDirty, setCodeDirty] = useState(false);

  const clientRef = useRef<SimulatorClient | null>(null);

  useEffect(() => {
    clientRef.current = new SimulatorClient();
    return () => clientRef.current?.dispose();
  }, []);

  // Carrega o circuito do fragmento: é assim que a aula entrega o "circuito
  // preparado" e como um link compartilhado abre já montado.
  useEffect(() => {
    const load = () => {
      const shared = readCircuitFromHash(window.location.hash);
      if (!shared) return;
      setCircuit(shared);
      setCode(circuitToQiskit(shared));
      setCodeDirty(false);
      try {
        setResult(runSync(shared));
        setError(undefined);
      } catch {
        setError("O circuito do link não pôde ser simulado.");
      }
    };

    load();
    // Trocar só o fragmento NÃO remonta o componente: sem este listener, quem
    // já está no laboratório e abre outro link de circuito não veria nada mudar.
    window.addEventListener("hashchange", load);
    return () => window.removeEventListener("hashchange", load);
  }, []);

  const updateCircuit = useCallback(
    (next: Circuit) => {
      setCircuit(next);
      if (!codeDirty) setCode(circuitToQiskit(next));
      setError(undefined);
      setIssues(undefined);
    },
    [codeDirty],
  );

  const addGate = useCallback(
    (gate: GateName, target: number) => {
      try {
        updateCircuit({
          ...circuit,
          operations: [...circuit.operations, makeOperation(gate, target, circuit)],
        });
      } catch (caught) {
        setError(caught instanceof Error ? caught.message : "Não foi possível adicionar a porta.");
      }
    },
    [circuit, updateCircuit],
  );

  const removeOperation = useCallback(
    (id: string) => {
      updateCircuit({
        ...circuit,
        operations: circuit.operations
          .filter((operation) => operation.id !== id)
          .map((operation, index) => ({ ...operation, position: index })),
      });
    },
    [circuit, updateCircuit],
  );

  /** Editor de ângulo: antes RX/RY/RZ eram fixos em π/2 sem forma de mudar. */
  const setAngle = useCallback(
    (id: string, angle: number) => {
      const next = {
        ...circuit,
        operations: circuit.operations.map((operation) =>
          operation.id === id ? { ...operation, params: [angle] } : operation,
        ),
      };
      setCircuit(next);
      if (!codeDirty) setCode(circuitToQiskit(next));
      // Re-simula ao vivo: a seta de Bloch varre a esfera enquanto se arrasta.
      try {
        setResult(runSync(next));
      } catch {
        /* estados intermediários inválidos são ignorados durante o arrasto */
      }
    },
    [circuit, codeDirty],
  );

  const run = useCallback(async () => {
    setRunning(true);
    setError(undefined);
    setIssues(undefined);

    let target = circuit;
    if (mode === "codigo") {
      try {
        target = parseQiskit(code, circuit.shots);
        setCircuit(target);
        setCodeDirty(false);
      } catch (caught) {
        setRunning(false);
        if (caught instanceof Error) setError(caught.message);
        const parsed = caught as { issues?: typeof issues };
        if (parsed.issues) setIssues(parsed.issues);
        return;
      }
    }

    try {
      setResult(await clientRef.current!.run({ ...target, seed: undefined }));
    } catch (caught) {
      setError(caught instanceof SimulationFailure ? caught.message : "A simulação falhou.");
      if (caught instanceof SimulationFailure) setIssues(caught.issues);
    } finally {
      setRunning(false);
    }
  }, [circuit, code, mode]);

  const copy = useCallback(async (value: string, kind: "code" | "link") => {
    try {
      await navigator.clipboard.writeText(value);
    } catch {
      // Contexto sem permissão de área de transferência (http, iframe, alguns
      // navegadores): recorre ao caminho antigo em vez de estourar.
      const helper = document.createElement("textarea");
      helper.value = value;
      helper.style.position = "fixed";
      helper.style.opacity = "0";
      document.body.append(helper);
      helper.select();
      document.execCommand("copy");
      helper.remove();
    }
    setCopied(kind);
    setTimeout(() => setCopied(null), 1800);
  }, []);

  const parametricOperations = useMemo(
    () => circuit.operations.filter((operation) => needsAngle(operation.gate)),
    [circuit.operations],
  );

  return (
    <div className="lab-app">
      <aside className="gate-palette">
        <div className="palette-heading">
          <FlaskConical size={18} />
          <div>
            <strong>Portas</strong>
            <span>Arraste para o circuito</span>
          </div>
        </div>
        {GROUPS.map((group) => (
          <div className="gate-group" key={group}>
            <span>{group}</span>
            <div>
              {gates
                .filter((item) => item.group === group)
                .map((item) => (
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
          <p>
            <strong>Dica</strong> Clique numa porta do circuito para removê-la.
          </p>
        </div>
      </aside>

      <section className="lab-workspace">
        <div className="lab-toolbar">
          <div className="lab-tabs" role="tablist" aria-label="Modo do laboratório">
            <button
              aria-controls="painel-visual"
              aria-selected={mode === "visual"}
              className={cn(mode === "visual" && "is-active")}
              onClick={() => setMode("visual")}
              role="tab"
              type="button"
            >
              <Braces size={15} /> Circuito
            </button>
            <button
              aria-controls="painel-codigo"
              aria-selected={mode === "codigo"}
              className={cn(mode === "codigo" && "is-active")}
              onClick={() => setMode("codigo")}
              role="tab"
              type="button"
            >
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
                    // Descarta portas que apontariam para qubits inexistentes.
                    operations: circuit.operations.filter((operation) =>
                      [...operation.targets, ...(operation.controls ?? [])].every(
                        (index) => index < qubits,
                      ),
                    ),
                  });
                }}
                value={circuit.qubits}
              >
                {Array.from({ length: MAX_QUBITS }, (_, index) => index + 1).map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Shots
              <select
                onChange={(event) =>
                  updateCircuit({ ...circuit, shots: Number(event.target.value) })
                }
                value={circuit.shots}
              >
                {[256, 512, 1024, 2048, 4096].map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>

        {mode === "visual" ? (
          <div id="painel-visual" role="tabpanel">
            <CircuitDiagram
              circuit={circuit}
              onDropGate={(qubit, payload) => payload && addGate(payload as GateName, qubit)}
              onRemove={removeOperation}
            />

            {parametricOperations.length > 0 && (
              <div className="angle-editors">
                <span>Ângulos</span>
                {parametricOperations.map((operation) => (
                  <label key={operation.id}>
                    <b>
                      {operation.gate} q{operation.targets[0]}
                    </b>
                    <input
                      max={Math.PI * 2}
                      min={-Math.PI * 2}
                      onChange={(event) => setAngle(operation.id, Number(event.target.value))}
                      step={Math.PI / 24}
                      type="range"
                      value={operation.params?.[0] ?? 0}
                    />
                    <small>{((operation.params?.[0] ?? 0) / Math.PI).toFixed(2)}π</small>
                  </label>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="lab-code" id="painel-codigo" role="tabpanel">
            <textarea
              aria-label="Código Python Qiskit"
              onChange={(event) => {
                setCode(event.target.value);
                setCodeDirty(true);
              }}
              spellCheck={false}
              value={code}
            />
            <button
              className="lab-copy"
              onClick={() => void copy(code, "code")}
              type="button"
            >
              {copied === "code" ? <Check size={15} /> : <Clipboard size={15} />}
              {copied === "code" ? "Copiado" : "Copiar"}
            </button>
          </div>
        )}

        {error && (
          <div className="lab-error" role="alert">
            <p>{error}</p>
            {issues && issues.length > 1 && (
              <ul>
                {issues.map((issue) => (
                  <li key={`${issue.line}-${issue.message}`}>
                    <strong>Linha {issue.line}:</strong> {issue.message}
                    {issue.suggestion ? <em> {issue.suggestion}</em> : null}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        <div className="lab-actions">
          <button
            className="button button--ghost button--small"
            onClick={() => updateCircuit({ ...circuit, operations: [] })}
            type="button"
          >
            <Eraser size={15} /> Limpar
          </button>
          <button
            className="button button--ghost button--small"
            onClick={() =>
              saveProject({
                title: `Circuito de ${circuit.qubits} qubits`,
                code,
                // Antes só o texto era salvo; o circuito estruturado se perdia.
                circuit,
              })
            }
            type="button"
          >
            <Save size={15} /> Salvar projeto
          </button>
          <button
            className="button button--ghost button--small"
            onClick={() => void copy(`${window.location.origin}${circuitHref(circuit)}`, "link")}
            title="Link que abre este circuito já montado"
            type="button"
          >
            {copied === "link" ? <Check size={15} /> : <Link2 size={15} />}
            {copied === "link" ? "Link copiado" : "Copiar link"}
          </button>
          <button
            className="button button--ghost button--small"
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
          <button
            className="button button--dark"
            disabled={running}
            onClick={() => void run()}
            type="button"
          >
            <Play size={15} /> {running ? "Simulando…" : "Executar"}
          </button>
        </div>
      </section>

      <ResultPanel qubits={circuit.qubits} result={result} />
    </div>
  );
}
