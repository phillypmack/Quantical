"use client";

import { useState } from "react";

import type { Challenge } from "@/data/challenges";
import { ExerciseWorkbench } from "./quantum/exercise-workbench";
import { useProgress } from "./progress-provider";

/**
 * Casca cliente do desafio. Marca a conclusão no progresso — antes não havia
 * nenhum estado de conclusão para desafios em lugar nenhum do app.
 */
export function ChallengeWorkbench({ challenge }: { challenge: Challenge }) {
  const { completed, completeLesson } = useProgress();
  const progressId = `desafio/${challenge.id}`;
  const [justSolved, setJustSolved] = useState(false);
  const solved = completed.includes(progressId) || justSolved;

  return (
    <ExerciseWorkbench
      exercise={challenge.exercise}
      // Sem `conceitos`: o desafio não declara termos do glossário, então ele
      // alimenta o histórico e o agregado, mas não agenda revisão.
      licaoId={progressId}
      onSolved={() => {
        setJustSolved(true);
        completeLesson(progressId, 100);
      }}
      solved={solved}
    />
  );
}
