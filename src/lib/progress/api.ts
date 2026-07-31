import type { Tentativa } from "@/lib/revisao/types";

/**
 * Cliente da API de tentativas.
 *
 * A regra que governa este arquivo inteiro: **falhar aqui não pode custar
 * nada ao aluno**. O localStorage é a fonte da verdade da sessão; isto é
 * durabilidade e agregação. API fora do ar, offline, CSP bloqueando, DNS
 * quebrado — em todos os casos o site continua ensinando, e a revisão
 * continua funcionando, porque o agendamento é decidido no cliente.
 *
 * Por isso nada aqui lança: os erros viram `false` e a tentativa segue
 * marcada como não sincronizada, para tentar de novo depois.
 */

/** Mesma origem: o nginx faz proxy para o container. Sem CORS, sem CSP novo. */
const BASE = "/api";

/** Acima disso o navegador desiste. Uma API lenta não pode segurar a página. */
const TEMPO_LIMITE_MS = 8_000;

/**
 * Teto por requisição. O servidor recusa lotes maiores; enviar em fatias faz
 * um histórico acumulado offline subir aos poucos em vez de tudo ou nada.
 */
export const TAMANHO_DO_LOTE = 100;

export type ResultadoDoEnvio = { ok: boolean; gravadas: number };

function paraOServidor(tentativa: Tentativa) {
  return {
    id: tentativa.id,
    tipo: tentativa.tipo,
    licaoId: tentativa.licaoId,
    itemId: tentativa.itemId,
    acertou: tentativa.acertou,
    equivocoId: tentativa.equivocoId,
    detalhe: tentativa.detalhe ?? {},
    em: tentativa.em,
  };
}

export async function enviarTentativas(
  alunoId: string,
  tentativas: Tentativa[],
): Promise<ResultadoDoEnvio> {
  if (tentativas.length === 0) return { ok: true, gravadas: 0 };

  const controle = new AbortController();
  const relogio = setTimeout(() => controle.abort(), TEMPO_LIMITE_MS);

  try {
    const resposta = await fetch(`${BASE}/tentativas`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ alunoId, tentativas: tentativas.map(paraOServidor) }),
      signal: controle.signal,
      // Sem cookies: não há sessão a carregar, e o id de aluno já vai no corpo.
      credentials: "omit",
      keepalive: false,
    });

    if (!resposta.ok) return { ok: false, gravadas: 0 };

    const corpo = (await resposta.json()) as { gravadas?: number };
    return { ok: true, gravadas: typeof corpo.gravadas === "number" ? corpo.gravadas : 0 };
  } catch {
    // Rede caída, timeout, CSP, JSON malformado: tudo termina igual aqui —
    // não sincronizou, tenta na próxima. Nenhum ruído para o aluno.
    return { ok: false, gravadas: 0 };
  } finally {
    clearTimeout(relogio);
  }
}

export type ItemAgregado = {
  itemId: string;
  respostas: number;
  erros: number;
  taxaDeErro: number;
  escolhaErradaComum: string | null;
  equivocoComum: string | null;
};

/** Como os outros alunos se saem numa aula. Devolve [] se a API não responder. */
export async function buscarAgregado(licaoId: string): Promise<ItemAgregado[]> {
  const controle = new AbortController();
  const relogio = setTimeout(() => controle.abort(), TEMPO_LIMITE_MS);

  try {
    const resposta = await fetch(`${BASE}/agregado?licao=${encodeURIComponent(licaoId)}`, {
      signal: controle.signal,
      credentials: "omit",
    });
    if (!resposta.ok) return [];
    const corpo = (await resposta.json()) as { itens?: ItemAgregado[] };
    return Array.isArray(corpo.itens) ? corpo.itens : [];
  } catch {
    return [];
  } finally {
    clearTimeout(relogio);
  }
}
