import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import pg from "pg";

/**
 * API do Quantical.
 *
 * Node puro sobre `pg`, sem framework. São três rotas; um Express aqui seria
 * mais dependência para auditar do que código para ler.
 *
 * A regra que governa tudo neste arquivo: o site é estático e funciona
 * inteiro sem esta API. Ela é durabilidade e agregação, nunca caminho crítico.
 * Se ela cair, o aluno continua estudando — o localStorage segue sendo a
 * fonte da verdade da sessão.
 */

const PORTA = Number(process.env.PORT ?? 6002);
const MAX_CORPO = 256 * 1024;
const MAX_TENTATIVAS_POR_LOTE = 200;

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  max: 8,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 5_000,
});

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const TIPOS = new Set(["quiz", "previsao", "exercicio"]);

/**
 * Limitador por IP, em memória.
 *
 * Não substitui um WAF; existe para um laço com bug no cliente não encher o
 * banco. Em memória basta: é um processo só, e perder a contagem num restart
 * é aceitável.
 */
const janelas = new Map();
const LIMITE_JANELA_MS = 60_000;
const LIMITE_REQUISICOES = 60;

function excedeuLimite(ip) {
  const agora = Date.now();
  const janela = janelas.get(ip);
  if (!janela || agora - janela.inicio > LIMITE_JANELA_MS) {
    janelas.set(ip, { inicio: agora, contagem: 1 });
    return false;
  }
  janela.contagem += 1;
  return janela.contagem > LIMITE_REQUISICOES;
}

// Sem isto o Map cresce para sempre com IPs que nunca voltam.
setInterval(() => {
  const corte = Date.now() - LIMITE_JANELA_MS;
  for (const [ip, janela] of janelas) if (janela.inicio < corte) janelas.delete(ip);
}, LIMITE_JANELA_MS).unref();

function responder(res, status, corpo) {
  const texto = JSON.stringify(corpo);
  res.writeHead(status, {
    "content-type": "application/json; charset=utf-8",
    "content-length": Buffer.byteLength(texto),
    // Mesma origem via nginx: não há CORS a liberar, e é melhor assim.
    "cache-control": "no-store",
    "x-content-type-options": "nosniff",
  });
  res.end(texto);
}

async function lerCorpo(req) {
  const pedacos = [];
  let tamanho = 0;
  for await (const pedaco of req) {
    tamanho += pedaco.length;
    if (tamanho > MAX_CORPO) throw new Error("corpo grande demais");
    pedacos.push(pedaco);
  }
  if (tamanho === 0) return {};
  return JSON.parse(Buffer.concat(pedacos).toString("utf8"));
}

/** Aceita só o que o esquema comporta; o resto é descartado sem drama. */
function validarTentativa(bruta) {
  if (!bruta || typeof bruta !== "object") return null;
  const { id, tipo, licaoId, itemId, acertou, equivocoId, detalhe, em } = bruta;
  if (typeof id !== "string" || !UUID.test(id)) return null;
  if (!TIPOS.has(tipo)) return null;
  if (typeof licaoId !== "string" || licaoId.length === 0 || licaoId.length > 200) return null;
  if (typeof itemId !== "string" || itemId.length === 0 || itemId.length > 200) return null;
  if (typeof acertou !== "boolean") return null;
  if (typeof em !== "string" || Number.isNaN(Date.parse(em))) return null;

  return {
    id,
    tipo,
    licaoId,
    itemId,
    acertou,
    equivocoId: typeof equivocoId === "string" && equivocoId.length <= 80 ? equivocoId : null,
    detalhe:
      detalhe && typeof detalhe === "object" && !Array.isArray(detalhe)
        ? JSON.stringify(detalhe).slice(0, 4000)
        : "{}",
    em,
  };
}

async function gravarTentativas(alunoId, tentativas) {
  const cliente = await pool.connect();
  try {
    await cliente.query("begin");
    await cliente.query(
      `insert into aluno (id) values ($1)
       on conflict (id) do update set visto_em = now()`,
      [alunoId],
    );

    // Um único INSERT com unnest: 200 tentativas numa ida ao banco, não 200.
    const resultado = await cliente.query(
      `insert into tentativa (id, aluno_id, tipo, licao_id, item_id, acertou, equivoco_id, detalhe, em)
       select
         u.id::uuid, $1::uuid, u.tipo, u.licao_id, u.item_id, u.acertou, u.equivoco_id,
         u.detalhe::jsonb, u.em::timestamptz
       from unnest(
         $2::text[], $3::text[], $4::text[], $5::text[], $6::bool[], $7::text[], $8::text[], $9::text[]
       ) as u(id, tipo, licao_id, item_id, acertou, equivoco_id, detalhe, em)
       -- Reenvio depois de uma falha de rede não pode duplicar nada.
       on conflict (id) do nothing`,
      [
        alunoId,
        tentativas.map((item) => item.id),
        tentativas.map((item) => item.tipo),
        tentativas.map((item) => item.licaoId),
        tentativas.map((item) => item.itemId),
        tentativas.map((item) => item.acertou),
        tentativas.map((item) => item.equivocoId),
        tentativas.map((item) => item.detalhe),
        tentativas.map((item) => item.em),
      ],
    );

    await cliente.query("commit");
    return resultado.rowCount;
  } catch (erro) {
    await cliente.query("rollback").catch(() => {});
    throw erro;
  } finally {
    cliente.release();
  }
}

/**
 * O agregado: com que frequência cada item derruba os alunos, e qual resposta
 * errada é a mais escolhida.
 *
 * É o laço que faz o material melhorar sozinho — "70% erram esta" vira
 * conteúdo dirigido. Sai só em números: nenhum id de aluno atravessa daqui.
 */
async function agregado(licaoId) {
  const { rows } = await pool.query(
    `select
       item_id,
       count(*)                                as respostas,
       count(*) filter (where not acertou)     as erros,
       mode() within group (order by detalhe->>'escolha')
         filter (where not acertou and detalhe ? 'escolha')  as escolha_errada_comum,
       mode() within group (order by equivoco_id)
         filter (where not acertou and equivoco_id is not null) as equivoco_comum
     from tentativa
     where licao_id = $1
     group by item_id
     -- Abaixo disso o número não diz nada e ainda arrisca identificar alguém.
     having count(*) >= 5
     order by (count(*) filter (where not acertou))::float / count(*) desc`,
    [licaoId],
  );

  return rows.map((linha) => ({
    itemId: linha.item_id,
    respostas: Number(linha.respostas),
    erros: Number(linha.erros),
    taxaDeErro: Number(linha.erros) / Number(linha.respostas),
    escolhaErradaComum: linha.escolha_errada_comum,
    equivocoComum: linha.equivoco_comum,
  }));
}

const servidor = createServer(async (req, res) => {
  const ip = req.socket.remoteAddress ?? "desconhecido";
  const url = new URL(req.url ?? "/", "http://localhost");
  const rota = url.pathname.replace(/^\/api/, "") || "/";

  try {
    if (excedeuLimite(ip)) return responder(res, 429, { erro: "muitas requisições" });

    if (req.method === "GET" && rota === "/saude") {
      const { rows } = await pool.query("select now() as agora");
      return responder(res, 200, { ok: true, banco: rows[0].agora });
    }

    if (req.method === "POST" && rota === "/tentativas") {
      const corpo = await lerCorpo(req);
      const alunoId = corpo?.alunoId;
      if (typeof alunoId !== "string" || !UUID.test(alunoId)) {
        return responder(res, 400, { erro: "alunoId inválido" });
      }

      const brutas = Array.isArray(corpo.tentativas) ? corpo.tentativas : [];
      if (brutas.length > MAX_TENTATIVAS_POR_LOTE) {
        return responder(res, 413, { erro: "lote grande demais" });
      }

      const validas = brutas.map(validarTentativa).filter(Boolean);
      if (validas.length === 0) return responder(res, 200, { gravadas: 0, recebidas: brutas.length });

      // Um lote com id repetido faria o INSERT falhar inteiro por conflito
      // consigo mesmo — `on conflict` não protege de duplicata na mesma linha.
      const unicas = [...new Map(validas.map((item) => [item.id, item])).values()];

      const gravadas = await gravarTentativas(alunoId, unicas);
      return responder(res, 200, { gravadas, recebidas: brutas.length });
    }

    if (req.method === "GET" && rota === "/agregado") {
      const licaoId = url.searchParams.get("licao");
      if (!licaoId || licaoId.length > 200) return responder(res, 400, { erro: "licao ausente" });
      return responder(res, 200, { licaoId, itens: await agregado(licaoId) });
    }

    return responder(res, 404, { erro: "rota inexistente" });
  } catch (erro) {
    // Nunca vaza a mensagem do Postgres para fora: ela descreve o esquema.
    console.error(`[${req.method} ${rota}]`, erro);
    const cliente = erro instanceof SyntaxError || /corpo grande/.test(String(erro?.message));
    return responder(res, cliente ? 400 : 500, { erro: cliente ? "corpo inválido" : "falha interna" });
  }
});

async function migrar() {
  const sql = await readFile(new URL("./schema.sql", import.meta.url), "utf8");
  await pool.query(sql);
  console.log("esquema aplicado");
}

migrar()
  .then(() => {
    servidor.listen(PORTA, "0.0.0.0", () => console.log(`API do Quantical na porta ${PORTA}`));
  })
  .catch((erro) => {
    console.error("não consegui aplicar o esquema:", erro);
    process.exit(1);
  });

// O Docker manda SIGTERM; sem isto as conexões morrem no meio de um insert.
for (const sinal of ["SIGTERM", "SIGINT"]) {
  process.on(sinal, () => {
    servidor.close(() => pool.end().then(() => process.exit(0)));
    setTimeout(() => process.exit(1), 10_000).unref();
  });
}
