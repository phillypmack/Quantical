import type { GuidedStep } from "@/components/quantum/guided-experiment";
import type { Circuit } from "@/lib/quantum/types";
import type { Exercise } from "@/lib/quantum/validator";
import type { TrackId } from "../curriculum";

export type StageId = "teoria" | "experimento" | "desafio";

export type Block =
  | { kind: "p"; text: string }
  | { kind: "h"; text: string }
  | { kind: "list"; ordered?: boolean; items: string[] }
  | { kind: "callout"; variant: "ideia" | "atencao" | "curiosidade"; title?: string; text: string }
  | { kind: "formula"; latex: string; caption?: string }
  | { kind: "code"; language: "python" | "text"; code: string; caption?: string }
  /**
   * Metáfora seguida da DEMOLIÇÃO dela.
   *
   * Toda metáfora de física quântica é uma mentira útil, e o erro pedagógico
   * comum é entregar a metáfora e parar. A compreensão nasce na quebra — e
   * aqui a quebra é um circuito executável, não uma afirmação: o aluno não lê
   * que a metáfora falha, ele roda e vê falhar.
   */
  | {
      kind: "metaphor";
      image: string;
      /**
       * A ilustração da metáfora. WebP e nada mais.
       *
       * Havia um PNG de fallback por ilustração — 4,2 MB de raster para 180 KB
       * de WebP, o triplo do artefato do site inteiro, servidos a browsers que
       * não existem mais. Sob `output: "export"` não há otimização automática
       * de imagem: o que se põe aqui é literalmente o que o aluno baixa, e boa
       * parte deles está em rede móvel.
       */
      ilustracao: { src: string; alt: string };
      breaks: string;
      circuit: Circuit;
      caption: string;
    }
  | { kind: "figure"; view: "bloch" | "histogram" | "circuit"; circuit: Circuit; caption: string };

export type QuestionOption = {
  text: string;
  correct: boolean;
  /** Por que esta alternativa está certa ou errada. Obrigatória em todas. */
  explanation: string;
  /**
   * O equívoco que escolher esta alternativa revela (id em `data/equivocos`).
   *
   * É o que permite o site dizer "você tende a pensar X" em vez de só "errou".
   * Só faz sentido em alternativa incorreta, e só quando o erro tem uma causa
   * identificável — distrator genérico fica sem marcação.
   */
  equivoco?: string;
};

export type Question = {
  id: string;
  prompt: string;
  options: QuestionOption[];
  /**
   * Conceitos que a pergunta exercita, para a revisão espaçada agendar.
   * Sem isto, valem os `glossaryRefs` da aula inteira.
   */
  conceitos?: string[];
};

export type Lesson = {
  /** "iniciante/bits-e-qubits/teoria" — igual ao que getLessonId() produz. */
  id: string;
  trackId: TrackId;
  moduleId: string;
  stage: StageId;
  title: string;
  summary: string;
  /** Substitui o falso `duration < 50 ? "12 min" : "18 min"` do cabeçalho. */
  minutes: number;
  objectives: string[];
  blocks: Block[];
  quiz: Question[];
  /** Roteiro do estágio "experimento". */
  guided?: { title: string; steps: GuidedStep[] };
  /** Exercício corrigido do estágio "desafio". */
  exercise?: Exercise;
  glossaryRefs: string[];
};
