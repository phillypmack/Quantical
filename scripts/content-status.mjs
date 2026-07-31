// Mostra o que já foi escrito e qual é o próximo módulo da fila.
//
// Existe para que retomar a autoria não dependa de lembrar onde parou: o
// estado vive no repositório. Lê o currículo e os arquivos de aula direto do
// disco, sem precisar compilar o projeto.
import { existsSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";

const raiz = resolve(process.cwd());
const curriculo = readFileSync(join(raiz, "src/data/curriculum.ts"), "utf8");
const dirAulas = join(raiz, "src/data/lessons");
const dirRoteiros = join(raiz, "audio/roteiros");
const dirAudio = join(raiz, "media/audio");

// Módulos que dependem de capacidades que o simulador ainda não tem.
const BLOQUEADOS = {
  "programador/teleportacao": "medição no meio do circuito + condicionais",
  "programador/ruido": "modelo de ruído",
  "universitario/variacionais": "valores esperados de observáveis",
  "universitario/correcao-erros": "medição no meio do circuito + condicionais",
};

const trilhas = [];
{
  let atual = null;
  for (const linha of curriculo.split("\n")) {
    const trilha = /^\s*id:\s*"(iniciante|programador|universitario)",\s*$/.exec(linha);
    if (trilha) {
      atual = { id: trilha[1], modulos: [] };
      trilhas.push(atual);
      continue;
    }
    const modulo = /\{\s*id:\s*"([a-z-]+)",\s*number:\s*(\d+),\s*title:\s*"([^"]+)"/.exec(linha);
    if (modulo && atual) {
      atual.modulos.push({ id: modulo[1], numero: Number(modulo[2]), titulo: modulo[3] });
    }
  }
}

// Uma aula está escrita quando o arquivo do módulo existe e exporta os três estágios.
function estagiosEscritos(trilha, modulo) {
  const arquivo = join(dirAulas, trilha, `${modulo}.ts`);
  if (!existsSync(arquivo)) return 0;
  const fonte = readFileSync(arquivo, "utf8");
  return ["teoria", "experimento", "desafio"].filter((estagio) =>
    fonte.includes(`stage: "${estagio}"`),
  ).length;
}

const temRoteiro = (trilha, modulo) =>
  existsSync(join(dirRoteiros, `${trilha}-${modulo}.json`));
const temAudio = (trilha, modulo) =>
  existsSync(join(dirAudio, `${trilha}-${modulo}.mp3`));

let prontos = 0;
let total = 0;
let comAudio = 0;
let proximo = null;

const ICONE = { pronto: "✔", parcial: "◐", vazio: "·" };

for (const trilha of trilhas) {
  console.log(`\n${trilha.id}`);
  for (const modulo of trilha.modulos) {
    total += 1;
    const chave = `${trilha.id}/${modulo.id}`;
    const estagios = estagiosEscritos(trilha.id, modulo.id);
    const completo = estagios === 3;
    if (completo) prontos += 1;

    const audio = temAudio(trilha.id, modulo.id);
    if (audio) comAudio += 1;

    const icone = completo ? ICONE.pronto : estagios > 0 ? ICONE.parcial : ICONE.vazio;
    const bloqueio = BLOQUEADOS[chave];
    const marcas = [
      `${estagios}/3 aulas`,
      temRoteiro(trilha.id, modulo.id) ? "roteiro" : "",
      audio ? "áudio" : "",
      !completo && bloqueio ? `bloqueado: ${bloqueio}` : "",
    ].filter(Boolean);

    console.log(`  ${icone} ${modulo.id.padEnd(20)} ${marcas.join(" · ")}`);

    if (!completo && !bloqueio && !proximo) proximo = chave;
  }
}

console.log(`\n${prontos}/${total} módulos escritos · ${comAudio}/${total} com áudio`);

if (proximo) {
  console.log(`\npróximo: ${proximo}`);
  console.log("  leia docs/AUTORIA.md e src/data/lessons/iniciante/bits-e-qubits.ts");
} else if (prontos < total) {
  console.log("\nSó restam módulos bloqueados: falta trabalho de motor (Fase 2 do plano).");
} else {
  console.log("\nTodos os módulos escritos.");
}
