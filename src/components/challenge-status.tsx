"use client";

import { Check } from "lucide-react";

import { useProgress } from "./progress-provider";

/** Marca visual de desafio resolvido. Antes não existia estado de conclusão. */
export function ChallengeStatus({ challengeId }: { challengeId: string }) {
  const { completed, hydrated } = useProgress();
  if (!hydrated || !completed.includes(`desafio/${challengeId}`)) return null;

  return (
    <span className="challenge-solved" title="Você já resolveu este desafio">
      <Check size={13} /> Resolvido
    </span>
  );
}
