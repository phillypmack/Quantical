/**
 * Revisão espaçada e registro de tentativas.
 *
 * Até aqui a plataforma ensinava e não lembrava de nada: o `retry()` do quiz
 * apagava as respostas, a previsão errada era mostrada uma vez e descartada, e
 * as asserções que falhavam num exercício sumiam com o componente. Tudo isso
 * já era CALCULADO — só não era guardado.
 *
 * A lógica de agendamento vive no cliente de propósito. É o que mantém a
 * revisão funcionando offline e independente da API: o servidor guarda e
 * agrega, mas não decide o que você revisa hoje.
 */

export type TipoTentativa = "quiz" | "previsao" | "exercicio";

export type Tentativa = {
  id: string;
  tipo: TipoTentativa;
  /** "iniciante/superposicao/teoria" */
  licaoId: string;
  /** questionId, id do passo guiado, ou rótulo da asserção. */
  itemId: string;
  acertou: boolean;
  /** Conceitos que este item exercita — é por eles que a revisão agenda. */
  conceitos: string[];
  /** Equívoco que a resposta errada revela, quando identificável. */
  equivocoId?: string;
  detalhe?: Record<string, unknown>;
  em: string;
  /** Enviada para a API. Falha de rede não pode travar o aprendizado. */
  sincronizada?: boolean;
};

export type Revisao = {
  conceitoId: string;
  /** 0 a 5. Cada acerto sobe um degrau, cada erro volta a zero. */
  forca: number;
  /** Data local (YYYY-MM-DD) em que o conceito volta a aparecer. */
  proximaEm: string;
  ultimaEm?: string;
  /** Quantas vezes o aluno errou algo deste conceito, ao todo. */
  errosTotais: number;
};
