import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, CircuitBoard, Target, Trophy } from "lucide-react";

import { ChallengeStatus } from "@/components/challenge-status";
import { challenges } from "@/data/challenges";
import { SINGLE_QUBIT_GATES } from "@/lib/quantum/simulator";

export const metadata: Metadata = {
  title: "Desafios quânticos",
  description:
    "Seis desafios de computação quântica com correção automática: escreva o circuito, execute e descubra na hora se o estado está certo.",
};

// Contados a partir dos dados, não cravados no texto: antes dizia "6 missões"
// e "12 portas" em literais que envelheceriam na primeira mudança.
const gateCount = SINGLE_QUBIT_GATES.length + 16;

export default function ChallengesPage() {
  return (
    <>
      <section className="page-hero challenge-hero">
        <div className="shell">
          <p className="eyebrow">Aprenda construindo</p>
          <h1 className="page-title">
            Desafios para
            <br />
            expandir a intuição.
          </h1>
          <p className="lead">
            Cada missão dá um objetivo e poucas pistas. Você escreve o circuito e o corretor confere
            o estado que ele produz — não as portas que você usou.
          </p>
        </div>
      </section>

      <section className="challenge-section">
        <div className="shell">
          <div className="challenge-summary">
            <div>
              <Target size={18} />
              <span>
                <strong>{challenges.length} missões</strong> em três níveis
              </span>
            </div>
            <div>
              <CircuitBoard size={18} />
              <span>
                <strong>{gateCount} portas</strong> disponíveis
              </span>
            </div>
            <div>
              <Trophy size={18} />
              <span>
                <strong>Correção automática</strong> a cada tentativa
              </span>
            </div>
          </div>

          <div className="challenge-grid">
            {challenges.map((challenge, index) => (
              <article
                className={`challenge-card challenge-card--${challenge.accent}`}
                key={challenge.id}
              >
                <div className="challenge-card-top">
                  <span>0{index + 1}</span>
                  <b>{challenge.level}</b>
                  <ChallengeStatus challengeId={challenge.id} />
                </div>
                <h2>{challenge.title}</h2>
                <p>{challenge.description}</p>
                <div className="challenge-gates">
                  {challenge.gates.map((gate, gateIndex) => (
                    <span key={`${gate}-${gateIndex}`}>{gate}</span>
                  ))}
                </div>
                <div className="challenge-goal">
                  <small>Objetivo</small>
                  <strong>{challenge.goal}</strong>
                </div>
                {/* Antes: href="/laboratorio" cru, perdendo todo o contexto. */}
                <Link href={`/desafios/${challenge.id}`}>
                  Abrir missão <ArrowRight size={16} />
                </Link>
              </article>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
