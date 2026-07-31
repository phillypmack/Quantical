// Gera o rascunho do roteiro de um episódio.
//
// A cadeia é codex → qwen → mão. O que sai daqui é RASCUNHO: a física de todo
// episódio é revisada antes de virar áudio. Uma afirmação errada em áudio é
// pior que áudio nenhum, porque quem escuta não tem como conferir.
//
// Uso: node scripts/gerar-roteiro.mjs iniciante/superposicao [--motor codex|qwen]
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";

const CODEX =
  "C:\\Users\\felip\\.antigravity-ide\\extensions\\openai.chatgpt-26.721.30844-win32-x64\\bin\\windows-x86_64\\codex.exe";

const alvo = process.argv[2];
if (!alvo || !alvo.includes("/")) {
  console.error("Uso: node scripts/gerar-roteiro.mjs <trilha>/<modulo> [--motor codex|qwen]");
  process.exit(1);
}
const motorPedido = process.argv.includes("--motor")
  ? process.argv[process.argv.indexOf("--motor") + 1]
  : null;

const [trackId, moduleId] = alvo.split("/");
const raiz = resolve(process.cwd());
const curriculo = readFileSync(join(raiz, "src/data/curriculum.ts"), "utf8");

const linha = curriculo
  .split("\n")
  .find((texto) => texto.includes(`id: "${moduleId}"`) && texto.includes("number:"));
if (!linha) {
  console.error(`Módulo '${moduleId}' não existe no currículo.`);
  process.exit(1);
}

const campo = (nome) => new RegExp(`${nome}:\\s*"([^"]+)"`).exec(linha)?.[1] ?? "";
const modulo = {
  titulo: campo("title"),
  descricao: campo("description"),
  conceitos: (/concepts:\s*\[([^\]]+)\]/.exec(linha)?.[1] ?? "")
    .split(",")
    .map((item) => item.trim().replace(/^"|"$/g, ""))
    .filter(Boolean),
};

// O módulo 1 vai inteiro no contexto como padrão-ouro de tom e profundidade.
const exemplar = existsSync(join(raiz, "audio/roteiros/iniciante-bits-e-qubits.json"))
  ? readFileSync(join(raiz, "audio/roteiros/iniciante-bits-e-qubits.json"), "utf8")
  : null;

const PROMPT = `Você escreve roteiros de podcast sobre computação quântica, em português do Brasil.

FORMATO
Diálogo entre duas pessoas:
- "nina" EXPLICA. Clara, concreta, sem enrolação.
- "teo" DUVIDA. Ele faz as perguntas que um iniciante faria — inclusive as
  ERRADAS. O papel dele é verbalizar o engano que o ouvinte cometeria, para a
  Nina desmontar em seguida. Um Téo que só concorda não serve para nada.

REGRAS
1. É para o OUVIDO. Nada de "|0⟩", "√2", "α". Escreva "ket zero", "raiz de
   dois", "alfa". Quem ouve não vê a tela.
2. O episódio precisa ter um momento em que a intuição do ouvinte QUEBRA.
   Construa até ele: primeiro o que parece óbvio, depois o experimento que
   derruba. Sem esse momento o episódio é informação, não aprendizado.
3. Nada de "simplesmente", "basta", "é fácil ver". Se fosse fácil não existiria
   o episódio.
4. Falas de 2 a 5 frases. Alterna as vozes. Nunca três falas seguidas da mesma.
5. Entre 28 e 40 falas no total (8 a 12 minutos falados).
6. Português brasileiro falado: "a gente" em vez de "nós", contrações naturais.
   "porta", nunca "gate". "medição", nunca "medida".
7. Comece com a Nina dando as boas-vindas e dizendo o tema. Termine com um
   gancho para o próximo passo no site.
8. FÍSICA CORRETA. Não invente resultado, não exagere, não diga que computador
   quântico "testa todas as possibilidades ao mesmo tempo" — isso é falso e é o
   erro mais comum sobre o assunto.

MÓDULO DESTE EPISÓDIO
Trilha: ${trackId}
Título: ${modulo.titulo}
Descrição: ${modulo.descricao}
Conceitos: ${modulo.conceitos.join(", ")}

SAÍDA
APENAS JSON válido, sem markdown, sem cercas de código, exatamente neste formato:
{"id":"${trackId}/${moduleId}","titulo":"...","resumo":"uma frase","falas":[{"voz":"nina","texto":"..."},{"voz":"teo","texto":"..."}]}
${exemplar ? `\nEXEMPLO DO TOM E DA PROFUNDIDADE ESPERADOS:\n${exemplar}` : ""}`;

function tentarCodex() {
  if (!existsSync(CODEX)) throw new Error("codex não encontrado");
  return execFileSync(CODEX, ["exec", "--sandbox", "read-only", "--skip-git-repo-check", PROMPT], {
    encoding: "utf8",
    maxBuffer: 40 * 1024 * 1024,
    stdio: ["ignore", "pipe", "pipe"],
    timeout: 15 * 60 * 1000,
  });
}

function tentarQwen() {
  return execFileSync("qwen", ["-p", PROMPT], {
    encoding: "utf8",
    maxBuffer: 40 * 1024 * 1024,
    shell: true,
    timeout: 15 * 60 * 1000,
  });
}

/** O codex imprime cabeçalho e rodapé; o JSON é o maior objeto na saída. */
function extrairJson(saida) {
  const candidatos = [];
  for (let inicio = saida.indexOf("{"); inicio !== -1; inicio = saida.indexOf("{", inicio + 1)) {
    let profundidade = 0;
    for (let fim = inicio; fim < saida.length; fim += 1) {
      if (saida[fim] === "{") profundidade += 1;
      else if (saida[fim] === "}") {
        profundidade -= 1;
        if (profundidade === 0) {
          candidatos.push(saida.slice(inicio, fim + 1));
          break;
        }
      }
    }
  }
  for (const candidato of candidatos.sort((a, b) => b.length - a.length)) {
    try {
      const dados = JSON.parse(candidato);
      if (Array.isArray(dados.falas) && dados.falas.length > 0) return dados;
    } catch {
      /* tenta o próximo */
    }
  }
  return null;
}

const motores = motorPedido
  ? [[motorPedido, motorPedido === "codex" ? tentarCodex : tentarQwen]]
  : [["codex", tentarCodex], ["qwen", tentarQwen]];

let roteiro = null;
for (const [nome, motor] of motores) {
  process.stdout.write(`tentando ${nome}… `);
  try {
    const dados = extrairJson(motor());
    if (!dados) {
      console.log("não devolveu JSON utilizável");
      continue;
    }
    roteiro = dados;
    console.log(`ok (${dados.falas.length} falas)`);
    break;
  } catch (erro) {
    console.log(`falhou: ${erro.message.split("\n")[0]}`);
  }
}

if (!roteiro) {
  console.error("\nNenhum motor produziu roteiro. Escreva o arquivo à mão seguindo docs/AUTORIA.md.");
  process.exit(1);
}

// Guardas do que o modelo costuma errar.
const problemas = [];
roteiro.id = `${trackId}/${moduleId}`;
if (!roteiro.titulo) problemas.push("sem título");
if (roteiro.falas.length < 20) problemas.push(`só ${roteiro.falas.length} falas (mínimo 20)`);
for (const [indice, fala] of roteiro.falas.entries()) {
  if (!["nina", "teo"].includes(fala.voz)) problemas.push(`fala ${indice}: voz '${fala.voz}'`);
  if (!fala.texto?.trim()) problemas.push(`fala ${indice}: vazia`);
  if (/[⟩⟨√⊗αβθψΦ]/.test(fala.texto ?? "")) {
    problemas.push(`fala ${indice}: notação escrita que não se fala — "${fala.texto.slice(0, 50)}…"`);
  }
}
let anterior = null;
let seguidas = 0;
for (const fala of roteiro.falas) {
  seguidas = fala.voz === anterior ? seguidas + 1 : 0;
  if (seguidas >= 2) problemas.push("três ou mais falas seguidas da mesma voz");
  anterior = fala.voz;
}

const destino = join(raiz, "audio/roteiros", `${trackId}-${moduleId}.json`);
mkdirSync(join(raiz, "audio/roteiros"), { recursive: true });
writeFileSync(destino, JSON.stringify(roteiro, null, 2) + "\n", "utf8");

console.log(`\n${destino}`);
console.log(`  ${roteiro.falas.length} falas · ${roteiro.falas.reduce((t, f) => t + f.texto.length, 0)} caracteres`);

if (problemas.length > 0) {
  console.log(`\n${[...new Set(problemas)].length} ponto(s) para revisar:`);
  for (const problema of [...new Set(problemas)]) console.log(`  ${problema}`);
}
console.log("\nRASCUNHO. Revise a física antes de sintetizar.");
