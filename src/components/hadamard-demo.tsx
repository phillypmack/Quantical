"use client";

import { useMemo, useState } from "react";
import { ArrowRight, Play, RotateCcw } from "lucide-react";
import Link from "next/link";

import { simulateCircuit } from "@/lib/quantum/simulator";
import type { Circuit } from "@/lib/quantum/types";

export function HadamardDemo() {
  const [running, setRunning] = useState(false);
  const [runCount, setRunCount] = useState(0);
  const result = useMemo(() => {
    const circuit: Circuit = {
      qubits: 1,
      shots: 1024,
      operations: running
        ? [{ id: "h", gate: "H", targets: [0], position: 0 }]
        : [],
    };
    return simulateCircuit(circuit);
  }, [running, runCount]);

  return (
    <section className="hero-demo" aria-label="Demonstração de uma porta Hadamard">
      <div className="demo-topbar">
        <span>
          <i />
          Simulador local
        </span>
        <span>1 qubit · 1.024 shots</span>
      </div>
      <div className="demo-circuit">
        <div className="qubit-label">
          <span>q₀</span>
          <small>|0⟩</small>
        </div>
        <div className="circuit-wire">
          <span className={running ? "gate gate--active" : "gate"}>H</span>
          <span className="meter-symbol" aria-hidden="true">
            <i />
          </span>
        </div>
      </div>
      <div className="demo-readout">
        <div className="bloch-mini">
          <div className="bloch-ring" />
          <div className={running ? "bloch-arrow is-superposed" : "bloch-arrow"} />
          <span>|0⟩</span>
          <span>|1⟩</span>
        </div>
        <div className="probabilities">
          <div>
            <div className="probability-label">
              <span>|0⟩</span>
              <strong>{Math.round(result.probabilities[0] * 100)}%</strong>
            </div>
            <div className="probability-track">
              <i style={{ width: `${result.probabilities[0] * 100}%` }} />
            </div>
          </div>
          <div>
            <div className="probability-label">
              <span>|1⟩</span>
              <strong>{Math.round((result.probabilities[1] ?? 0) * 100)}%</strong>
            </div>
            <div className="probability-track">
              <i style={{ width: `${(result.probabilities[1] ?? 0) * 100}%` }} />
            </div>
          </div>
          <p>
            {running
              ? "O qubit está em uma superposição equilibrada."
              : "O qubit começa no estado fundamental."}
          </p>
        </div>
      </div>
      <div className="demo-actions">
        <button
          className="run-button"
          onClick={() => {
            setRunning((value) => !value);
            setRunCount((count) => count + 1);
          }}
          type="button"
        >
          {running ? <RotateCcw size={16} /> : <Play size={16} fill="currentColor" />}
          {running ? "Reiniciar" : "Executar circuito"}
        </button>
        <Link href="/laboratorio">
          Abrir laboratório <ArrowRight size={15} />
        </Link>
      </div>
    </section>
  );
}
