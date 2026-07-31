-- Esquema da API do Quantical.
--
-- Guarda o que o navegador já calculava e jogava fora: em que o aluno erra.
-- Duas tabelas, e nenhuma a mais — a plataforma já carregava uma tabela
-- `quiz_attempts` criada e jamais escrita, e o remédio para isso não é criar
-- outras. A agenda de revisão NÃO tem tabela aqui de propósito: ela é
-- derivável das tentativas e é decidida no cliente, para a revisão continuar
-- funcionando com a API fora do ar.

create table if not exists aluno (
  -- Identidade anônima de dispositivo, gerada no navegador. Não há e-mail,
  -- nome nem IP: coerente com o "Continuar sem conta" que o site oferece.
  id         uuid primary key,
  criado_em  timestamptz not null default now(),
  visto_em   timestamptz not null default now(),
  -- Preenchido só se um dia o aluno ligar dispositivos por uma conta.
  conta_id   text
);

create table if not exists tentativa (
  -- O id vem do cliente. É o que torna o reenvio idempotente: uma tentativa
  -- que já subiu não é gravada duas vezes se a rede falhar no meio.
  id         uuid primary key,
  aluno_id   uuid not null references aluno(id) on delete cascade,
  tipo       text not null check (tipo in ('quiz', 'previsao', 'exercicio')),
  licao_id   text not null,
  -- questionId, id do passo guiado, ou id do exercício.
  item_id    text not null,
  acertou    boolean not null,
  -- Equívoco que a resposta revela, quando identificável.
  equivoco_id text,
  -- Alternativa escolhida, erro da previsão, asserções que falharam.
  detalhe    jsonb not null default '{}',
  -- Horário do aluno, não do servidor: é quando o erro aconteceu que importa.
  em         timestamptz not null,
  recebido_em timestamptz not null default now()
);

create index if not exists tentativa_aluno_idx on tentativa (aluno_id, em desc);

-- O índice parcial dos erros: é o que responde "onde os alunos tropeçam".
-- Só erros porque a pergunta agregada é sempre sobre eles.
create index if not exists tentativa_erro_idx on tentativa (licao_id, item_id)
  where not acertou;

create index if not exists tentativa_equivoco_idx on tentativa (equivoco_id)
  where equivoco_id is not null;
