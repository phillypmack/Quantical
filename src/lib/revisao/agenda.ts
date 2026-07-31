import { studyDate } from "@/lib/progress/state";
import type { Revisao, Tentativa } from "./types";

/**
 * Agendamento espaçado, versão enxuta do SM-2.
 *
 * A escolha central é agendar por CONCEITO e não por aula. Errar uma pergunta
 * sobre fase não devolve a aula inteira de superposição para a fila: devolve o
 * conceito `fase`, que pode voltar por qualquer item que o exercite. É o que
 * evita a revisão virar "refaça tudo de novo", que é o modo mais rápido de
 * fazer alguém abandonar.
 *
 * Os intervalos crescem quase triplicando. O primeiro é curto porque o
 * esquecimento é mais veloz logo depois do erro; os últimos são longos porque
 * revisar o que já está firme desperdiça o tempo do aluno.
 */
export const INTERVALOS = [1, 3, 7, 16, 35, 90] as const;
export const FORCA_MAXIMA = INTERVALOS.length - 1;

/**
 * A partir daqui o conceito conta como firme.
 *
 * Força 3 significa três acertos com espaçamento crescente — o último depois
 * de uma semana sem ver o assunto. Acertar na mesma sessão em que se leu a
 * explicação mede memória curta, não mudança de intuição.
 */
export const FORCA_FIRME = 3;

export function somarDias(data: string, dias: number): string {
  const base = Date.parse(`${data}T12:00:00Z`);
  return new Date(base + dias * 86_400_000).toISOString().slice(0, 10);
}

/** Agenda um conceito depois de uma resposta. */
export function agendar(
  atual: Revisao | undefined,
  acertou: boolean,
  hoje: string = studyDate(),
): Revisao {
  const conceitoId = atual?.conceitoId ?? "";
  const errosTotais = (atual?.errosTotais ?? 0) + (acertou ? 0 : 1);

  // Errou: volta ao começo. Não adianta suavizar — se errou, não estava firme.
  const forca = acertou ? Math.min(FORCA_MAXIMA, (atual?.forca ?? -1) + 1) : 0;

  return {
    conceitoId,
    forca,
    proximaEm: somarDias(hoje, INTERVALOS[forca]),
    ultimaEm: hoje,
    errosTotais,
  };
}

/** Aplica uma tentativa sobre a agenda inteira, um conceito por vez. */
export function registrar(
  agenda: Record<string, Revisao>,
  tentativa: Tentativa,
  hoje: string = studyDate(),
): Record<string, Revisao> {
  if (tentativa.conceitos.length === 0) return agenda;

  const proxima = { ...agenda };
  for (const conceitoId of tentativa.conceitos) {
    const anterior = proxima[conceitoId];
    proxima[conceitoId] = {
      ...agendar(anterior ? { ...anterior } : undefined, tentativa.acertou, hoje),
      conceitoId,
    };
  }
  return proxima;
}

/**
 * Conceitos vencidos hoje, do mais atrasado para o menos.
 *
 * Um conceito que nunca foi errado nem respondido não entra: revisão é para
 * consolidar o que passou pela cabeça do aluno, não para apresentar assunto
 * novo.
 */
export function vencidos(
  agenda: Record<string, Revisao>,
  hoje: string = studyDate(),
): Revisao[] {
  return Object.values(agenda)
    .filter((revisao) => revisao.proximaEm <= hoje)
    .sort((a, b) => {
      if (a.proximaEm !== b.proximaEm) return a.proximaEm.localeCompare(b.proximaEm);
      // Empate: primeiro o que o aluno mais errou.
      return b.errosTotais - a.errosTotais;
    });
}

/** Quanto falta para o conceito voltar, em dias. Negativo = atrasado. */
export function diasAte(revisao: Revisao, hoje: string = studyDate()): number {
  return Math.round(
    (Date.parse(`${revisao.proximaEm}T12:00:00Z`) - Date.parse(`${hoje}T12:00:00Z`)) / 86_400_000,
  );
}

/**
 * Conceitos que o aluno domina: força alta e sem erro recente.
 * Serve para o painel mostrar progresso real, e não só aulas concluídas.
 */
export function consolidados(agenda: Record<string, Revisao>): Revisao[] {
  return Object.values(agenda).filter((revisao) => revisao.forca >= FORCA_FIRME);
}
