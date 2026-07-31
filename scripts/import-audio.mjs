// Importa os episódios gerados pela Dubla para a camada de conteúdo do site.
//
// A Dubla escreve, para cada roteiro, um <slug>.mp3 e um <slug>.json com os
// tempos de cada fala. Este script lê os JSON, confere que o mp3 correspondente
// existe e que os tempos são coerentes, e regenera src/data/audio/episodes.ts.
//
// Uso: node scripts/import-audio.mjs [diretorio-de-audio]
import { readFileSync, readdirSync, existsSync, statSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";

const dir = resolve(process.cwd(), process.argv[2] ?? "media/audio");
const destino = resolve(process.cwd(), "src/data/audio/episodes.ts");

if (!existsSync(dir)) {
  console.error(`Diretório de áudio não encontrado: ${dir}`);
  console.error("Gere os episódios antes:  python -m dubla narrar audio/roteiros/*.json");
  process.exit(1);
}

// A ordem dos módulos vem do currículo — é ela que dá o número do episódio.
const curriculo = readFileSync(resolve(process.cwd(), "src/data/curriculum.ts"), "utf8");
const ordem = [];
for (const bloco of curriculo.matchAll(/id:\s*"(iniciante|programador|universitario)"/g)) {
  ordem.push({ track: bloco[1], modules: [] });
}
{
  let atual = -1;
  for (const linha of curriculo.split("\n")) {
    const trilha = /id:\s*"(iniciante|programador|universitario)"/.exec(linha);
    if (trilha) atual += 1;
    const modulo = /\{\s*id:\s*"([a-z-]+)",\s*number:\s*(\d+)/.exec(linha);
    if (modulo && atual >= 0) ordem[atual].modules.push({ id: modulo[1], number: Number(modulo[2]) });
  }
}
const indiceDoModulo = new Map();
ordem.forEach((trilha) => {
  trilha.modules.forEach((modulo) => {
    indiceDoModulo.set(`${trilha.track}/${modulo.id}`, modulo.number);
  });
});

const problemas = [];
const episodios = [];

for (const arquivo of readdirSync(dir).filter((nome) => nome.endsWith(".json")).sort()) {
  const meta = JSON.parse(readFileSync(join(dir, arquivo), "utf8"));
  const slug = meta.id.replace("/", "-");
  const mp3 = join(dir, `${slug}.mp3`);

  if (!existsSync(mp3)) {
    problemas.push(`${meta.id}: falta o mp3 (${slug}.mp3)`);
    continue;
  }
  if (!indiceDoModulo.has(meta.id)) {
    problemas.push(`${meta.id}: não corresponde a nenhum módulo do currículo`);
    continue;
  }
  if (!Array.isArray(meta.turnos) || meta.turnos.length === 0) {
    problemas.push(`${meta.id}: sem turnos na transcrição`);
    continue;
  }

  // Os tempos precisam ser crescentes, senão o destaque da transcrição pula.
  let anterior = -1;
  for (const turno of meta.turnos) {
    if (typeof turno.at !== "number" || turno.at < anterior) {
      problemas.push(`${meta.id}: tempos fora de ordem perto de ${turno.at}`);
      break;
    }
    anterior = turno.at;
  }
  // E não podem ultrapassar a duração real do arquivo.
  const ultimo = meta.turnos.at(-1);
  if (ultimo && ultimo.at > meta.duracao + 1) {
    problemas.push(`${meta.id}: fala começa em ${ultimo.at}s, mas o áudio tem ${meta.duracao}s`);
  }

  const [trackId, moduleId] = meta.id.split("/");
  episodios.push({
    id: meta.id,
    trackId,
    moduleId,
    numero: indiceDoModulo.get(meta.id),
    titulo: meta.titulo,
    resumo: meta.resumo ?? "",
    src: `/audio/${slug}.mp3`,
    duracao: meta.duracao,
    tamanhoMb: (statSync(mp3).size / 1024 / 1024).toFixed(1),
    turnos: meta.turnos.map((turno) => ({
      at: turno.at,
      fim: turno.fim,
      voz: turno.voz,
      texto: turno.texto,
    })),
  });
}

if (problemas.length > 0) {
  console.error(`\n${problemas.length} problema(s):\n`);
  for (const problema of problemas) console.error(`  ${problema}`);
  process.exit(1);
}

episodios.sort((a, b) => a.id.localeCompare(b.id));

const corpo = episodios
  .map((episodio) => {
    const turnos = episodio.turnos
      .map(
        (turno) =>
          `      { at: ${turno.at}, fim: ${turno.fim}, voz: ${JSON.stringify(turno.voz)}, texto: ${JSON.stringify(turno.texto)} },`,
      )
      .join("\n");
    return `  {
    id: ${JSON.stringify(episodio.id)},
    trackId: ${JSON.stringify(episodio.trackId)},
    moduleId: ${JSON.stringify(episodio.moduleId)},
    numero: ${episodio.numero},
    titulo: ${JSON.stringify(episodio.titulo)},
    resumo: ${JSON.stringify(episodio.resumo)},
    src: ${JSON.stringify(episodio.src)},
    duracao: ${episodio.duracao},
    turnos: [
${turnos}
    ],
  },`;
  })
  .join("\n");

writeFileSync(
  destino,
  `import type { AudioEpisode } from "./types";

/**
 * Episódios de "Quantical em Áudio".
 *
 * ARQUIVO GERADO — não edite à mão. A fonte é o roteiro em \`audio/roteiros/\`,
 * sintetizado pela Dubla (\`python -m dubla narrar\`) e importado por
 * \`npm run audio:import\`.
 *
 * Os mp3 ficam fora do build: \`media/audio/\` é enviado ao servidor por
 * \`scripts/deploy-audio.sh\` e servido em \`/audio/\`. Empacotá-los junto do
 * site somaria dezenas de MB a cada deploy sem necessidade.
 */
export const episodios: AudioEpisode[] = [
${corpo}
];
`,
  "utf8",
);

const minutos = episodios.reduce((total, episodio) => total + episodio.duracao, 0) / 60;
const megas = episodios.reduce((total, episodio) => total + Number(episodio.tamanhoMb), 0);
console.log(
  `${episodios.length} episódio(s) · ${minutos.toFixed(0)} min · ${megas.toFixed(1)} MB → ${destino}`,
);
