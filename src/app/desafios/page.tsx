import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, CircuitBoard, Target, Trophy } from "lucide-react";

import { challenges } from "@/data/challenges";

export const metadata: Metadata = { title: "Desafios quânticos" };

export default function ChallengesPage() {
  return (
    <>
      <section className="page-hero challenge-hero">
        <div className="shell">
          <p className="eyebrow">Aprenda construindo</p>
          <h1 className="page-title">Desafios para<br />expandir a intuição.</h1>
          <p className="lead">Cada missão dá um objetivo e poucas pistas. O circuito é por sua conta.</p>
        </div>
      </section>
      <section className="challenge-section">
        <div className="shell">
          <div className="challenge-summary">
            <div><Target size={18} /><span><strong>6 missões</strong> em três níveis</span></div>
            <div><CircuitBoard size={18} /><span><strong>12 portas</strong> disponíveis</span></div>
            <div><Trophy size={18} /><span><strong>Experimentos</strong> sem limite</span></div>
          </div>
          <div className="challenge-grid">
            {challenges.map((challenge, index) => (
              <article className={`challenge-card challenge-card--${challenge.accent}`} key={challenge.id}>
                <div className="challenge-card-top"><span>0{index + 1}</span><b>{challenge.level}</b></div>
                <h2>{challenge.title}</h2>
                <p>{challenge.description}</p>
                <div className="challenge-gates">
                  {challenge.gates.map((gate, gateIndex) => <span key={`${gate}-${gateIndex}`}>{gate}</span>)}
                </div>
                <div className="challenge-goal"><small>Objetivo</small><strong>{challenge.goal}</strong></div>
                <Link href="/laboratorio">Abrir missão <ArrowRight size={16} /></Link>
              </article>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
