import type { Metadata } from "next";

import { QuantumLab } from "@/components/quantum-lab";

export const metadata: Metadata = {
  title: "Laboratório quântico",
  description: "Monte circuitos, escreva Qiskit e simule até seis qubits no navegador.",
};

export default function LaboratoryPage() {
  return (
    <div className="lab-page">
      <header className="lab-page-header">
        <div>
          <span>Laboratório</span>
          <h1>Circuito sem título</h1>
        </div>
        <p><i /> Simulador local · sem fila</p>
      </header>
      <QuantumLab />
    </div>
  );
}
