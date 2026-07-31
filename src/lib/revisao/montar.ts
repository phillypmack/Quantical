import { getLesson } from "@/data/lessons";
import type { Question } from "@/data/lessons";
import { studyDate } from "@/lib/progress/state";
import type { ProgressState } from "@/lib/progress/types";
import type { Exercise } from "@/lib/quantum/validator";
import type { GuidedStep } from "@/components/quantum/guided-experiment";
import { vencidos } from "./agenda";
import type { Tentativa } from "./types";

/**
 * Um item de revisão é a coisa exata em que o aluno tropeçou — não um resumo
 * dela. A pergunta que ele errou, com as alternativas reembaralhadas; o passo
 * do experimento em que a previsão furou, para apostar de novo no mesmo
 * circuito; o exercício cuja asserção falhou.
 *
 * É o que separa isto de flashcard: o material de revisão não precisou ser
 * escrito, porque é o material da aula.
 */
export type ItemRevisao =
  | { tipo: "quiz"; conceitoId: string; licaoId: string; licaoTitulo: string; questao: Question }
  | {
      tipo: "previsao";
      conceitoId: string;
      licaoId: string;
      licaoTitulo: string;
      passo: GuidedStep;
      roteiro: string;
    }
  | {
      tipo: "exercicio";
      conceitoId: string;
      licaoId: string;
      licaoTitulo: string;
      exercicio: Exercise;
    };

/**
 * Teto da sessão.
 *
 * Uma fila que não acaba é uma fila que ninguém termina. Oito itens cabem em
 * poucos minutos, e o que sobrar continua vencido para amanhã — o agendador
 * não perde nada por não ter sido mostrado hoje.
 */
export const LIMITE_DA_SESSAO = 8;

/** Resolve uma tentativa errada para o conteúdo que a produziu, se ainda existir. */
function resolver(tentativa: Tentativa, conceitoId: string): ItemRevisao | null {
  const licao = getLesson(tentativa.licaoId);
  if (!licao) return null;

  const comum = { conceitoId, licaoId: tentativa.licaoId, licaoTitulo: licao.title };

  if (tentativa.tipo === "quiz") {
    const questao = licao.quiz.find((item) => item.id === tentativa.itemId);
    return questao ? { tipo: "quiz", ...comum, questao } : null;
  }

  if (tentativa.tipo === "previsao") {
    const passo = licao.guided?.steps.find((item) => item.id === tentativa.itemId);
    // Só passos com portão de previsão: sem `predict` não há o que reapostar.
    return passo?.predict ? { tipo: "previsao", ...comum, passo, roteiro: licao.guided!.title } : null;
  }

  return licao.exercise && licao.exercise.id === tentativa.itemId
    ? { tipo: "exercicio", ...comum, exercicio: licao.exercise }
    : null;
}

/**
 * Monta a sessão do dia a partir do que está vencido.
 *
 * Um conceito vencido cujo item não pode mais ser resolvido — a aula foi
 * reescrita, a pergunta mudou de id — simplesmente não entra. Por isso o
 * contador exibido ao aluno tem de sair DAQUI e não de `vencidos()`: prometer
 * "3 para revisar" e abrir uma tela com 2 é pior do que não prometer nada.
 */
export function montarRevisao(
  state: ProgressState,
  hoje: string = studyDate(),
  limite: number = LIMITE_DA_SESSAO,
): ItemRevisao[] {
  const pendentes = vencidos(state.revisao, hoje);
  if (pendentes.length === 0) return [];

  const itens: ItemRevisao[] = [];
  const jaUsados = new Set<string>();

  for (const revisao of pendentes) {
    if (itens.length >= limite) break;

    // As tentativas já vêm da mais recente para a mais antiga: o erro mais
    // fresco é o que melhor representa onde o aluno está agora.
    for (const tentativa of state.tentativas) {
      if (tentativa.acertou) continue;
      if (!tentativa.conceitos.includes(revisao.conceitoId)) continue;

      const chave = `${tentativa.tipo}:${tentativa.licaoId}:${tentativa.itemId}`;
      if (jaUsados.has(chave)) continue;

      const item = resolver(tentativa, revisao.conceitoId);
      if (!item) continue;

      jaUsados.add(chave);
      itens.push(item);
      // Um item por conceito: a sessão fica variada em vez de martelar a
      // mesma aula cinco vezes seguidas.
      break;
    }
  }

  return itens;
}
