import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { ChallengeWorkbench } from "@/components/challenge-workbench";
import { challengeById, challenges } from "@/data/challenges";

type ChallengePageProps = { params: Promise<{ id: string }> };

export function generateStaticParams() {
  return challenges.map((challenge) => ({ id: challenge.id }));
}

export async function generateMetadata({ params }: ChallengePageProps): Promise<Metadata> {
  const challenge = challengeById.get((await params).id);
  if (!challenge) return { title: "Desafio" };
  return {
    title: `${challenge.title} — Desafio`,
    description: challenge.description,
  };
}

export default async function ChallengePage({ params }: ChallengePageProps) {
  const challenge = challengeById.get((await params).id);
  if (!challenge) notFound();

  return (
    <div className="narrow-shell challenge-page">
      <Link className="lesson-back" href="/desafios">
        <ArrowLeft size={15} /> Todos os desafios
      </Link>

      <header className={`challenge-hero is-${challenge.accent}`}>
        <span className="pill">{challenge.level}</span>
        <h1>{challenge.title}</h1>
        <p>{challenge.description}</p>
        <ul className="challenge-meta">
          <li>
            <span>Portas sugeridas</span>
            <strong>{challenge.gates.join(" · ")}</strong>
          </li>
          <li>
            <span>Meta</span>
            <strong>{challenge.goal}</strong>
          </li>
        </ul>
      </header>

      <ChallengeWorkbench challenge={challenge} />
    </div>
  );
}
