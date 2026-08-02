import type { AudioTurno } from "./types";

/**
 * Um capítulo de O Arquivo da Luz em áudio.
 *
 * O livro já existe em 216 páginas HTML; isto é a mesma obra pelo ouvido, não
 * um resumo dela. Por isso o corte é por capítulo e não por página: ninguém
 * ouve em blocos de dois minutos, e ninguém aguenta um arquivo único de dez
 * horas.
 */
export type AudiolivroCapitulo = {
  numero: number;
  titulo: string;
  resumo: string;
  /** Servido pelo nginx fora do bundle, como os episódios. */
  src: string;
  duracao: number;
  /**
   * Qual geração deste áudio está no ar, no formato 0.NN.
   *
   * Existe para a escuta ser endereçável: sem ela, "a pergunta melhorou" não
   * diz em relação a quê. O contador é incrementado por quem GERA o áudio, na
   * Dubla — número mantido à mão desatualiza e passa a mentir.
   */
  geracao?: string;
  turnos: AudioTurno[];
  /**
   * Número da página do livro -> segundo em que ela começa no áudio.
   *
   * É o que permite abrir a página 7 e ouvir a partir dali. Sem este mapa, o
   * áudio de capítulo obrigaria o ouvinte a caçar o trecho com a barra de
   * progresso — e a página perderia a serventia de ser endereçável.
   */
  paginas: Record<number, number>;
};

export const slugDoCapitulo = (numero: number) => `livro-ch${String(numero).padStart(2, "0")}`;

/** Onde o áudio deste capítulo começa, para uma página específica. */
export function inicioDaPagina(capitulo: AudiolivroCapitulo, pagina: number): number {
  return capitulo.paginas[pagina] ?? 0;
}

export function formatarDuracaoLonga(segundos: number): string {
  if (!Number.isFinite(segundos) || segundos <= 0) return "0 min";
  const horas = Math.floor(segundos / 3600);
  const minutos = Math.round((segundos % 3600) / 60);
  if (horas === 0) return `${minutos} min`;
  return minutos === 0 ? `${horas} h` : `${horas} h ${minutos} min`;
}
