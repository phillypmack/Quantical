import { getEquivoco, type Equivoco } from "@/data/equivocos";
import { FORCA_FIRME } from "./agenda";
import type { Revisao, Tentativa } from "./types";

/**
 * Perfil de equívocos: o que a plataforma consegue dizer e quase nenhuma
 * outra diz.
 *
 * "Você acertou 60%" é uma nota. "Você tende a tratar o histograma como se
 * fosse o estado, isso apareceu 3 vezes, e o experimento que derruba isso
 * leva 4 minutos" é um diagnóstico — e ele só é possível porque cada módulo
 * foi escrito em torno de uma intuição específica que quebra.
 */
export type EquivocoDoAluno = {
  equivoco: Equivoco;
  /** Quantas vezes uma resposta revelou este pensamento. */
  vezes: number;
  /** ISO da última vez. */
  ultimaEm: string;
  /**
   * Superado quando todos os conceitos que ele atinge já estão firmes na
   * agenda. Não basta acertar uma vez logo depois de ler a explicação: acertar
   * na mesma sessão mede memória curta, não mudança de intuição.
   */
  superado: boolean;
};

export function perfilDeEquivocos(
  tentativas: Tentativa[],
  agenda: Record<string, Revisao>,
): EquivocoDoAluno[] {
  const contagem = new Map<string, { vezes: number; ultimaEm: string }>();

  for (const tentativa of tentativas) {
    // Um equívoco só é marcado em alternativa errada — a trava de conteúdo
    // garante isso —, mas conferir aqui evita que um dado antigo corrompido
    // acuse o aluno de pensar algo que ele acertou.
    if (tentativa.acertou || !tentativa.equivocoId) continue;
    if (!getEquivoco(tentativa.equivocoId)) continue;

    const atual = contagem.get(tentativa.equivocoId);
    contagem.set(tentativa.equivocoId, {
      vezes: (atual?.vezes ?? 0) + 1,
      ultimaEm: !atual || tentativa.em > atual.ultimaEm ? tentativa.em : atual.ultimaEm,
    });
  }

  return [...contagem.entries()]
    .map(([id, { vezes, ultimaEm }]) => {
      const equivoco = getEquivoco(id)!;
      const superado = equivoco.conceitos.every(
        (conceitoId) => (agenda[conceitoId]?.forca ?? 0) >= FORCA_FIRME,
      );
      return { equivoco, vezes, ultimaEm, superado };
    })
    .sort((a, b) => {
      // Os ainda vivos primeiro: é o que o aluno precisa ver.
      if (a.superado !== b.superado) return a.superado ? 1 : -1;
      if (a.vezes !== b.vezes) return b.vezes - a.vezes;
      return b.ultimaEm.localeCompare(a.ultimaEm);
    });
}

/** Rota do experimento que derruba o equívoco, com âncora no passo quando há. */
export function hrefDaDemolicao(equivoco: Equivoco): string {
  const base = `/curso/${equivoco.demolicao.licaoId}`;
  return equivoco.demolicao.passoId ? `${base}#experimento` : base;
}

/**
 * Quanto do caminho já foi andado, para o painel não virar só uma lista de
 * defeitos. Vai de 0 a 1.
 */
export function fracaoSuperada(perfil: EquivocoDoAluno[]): number {
  if (perfil.length === 0) return 0;
  return perfil.filter((item) => item.superado).length / perfil.length;
}
