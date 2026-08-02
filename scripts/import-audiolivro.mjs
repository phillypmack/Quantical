// Importa os capítulos narrados pela Dubla para a camada de conteúdo do site.
//
// A Dubla escreve, por roteiro, um <slug>.mp3 e um <slug>.json com o tempo de
// cada fala. O roteiro correspondente traz o mapa de página -> índice de fala.
// Cruzar os dois é o que transforma "página 7" em "segundo 412".
//
// Roda enquanto a síntese ainda está em andamento: importa o que já existe e
// diz o que falta. São onze horas de geração; esperar tudo para ver qualquer
// coisa seria trabalhar no escuro.
//
// Uso: node scripts/import-audiolivro.mjs [dir-audio] [dir-roteiros]
import { existsSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { join, resolve } from "node:path";

const dirAudio = resolve(process.argv[2] ?? "../Dubla/work/livro/audio");
const dirRoteiros = resolve(process.argv[3] ?? "../Dubla/work/livro/roteiros");
const destino = resolve(process.cwd(), "src/data/audio/audiolivro.ts");

if (!existsSync(dirRoteiros)) {
  console.error(`Roteiros não encontrados em ${dirRoteiros}`);
  console.error("Gere antes:  npx tsx scripts/gerar-audiolivro.ts");
  process.exit(1);
}

const roteiros = readdirSync(dirRoteiros)
  .filter((f) => /^livro-ch\d+\.json$/.test(f))
  .sort();

// Contador de geração, mantido por tools/gerar_capitulo.py da Dubla. Serve
// para quem ouve conseguir dizer "na 0.06 a pergunta soou certa" — sem ele,
// duas gerações diferentes são indistinguíveis de ouvido.
const arquivoVersoes = join(dirAudio, "versoes.json");
const versoes = existsSync(arquivoVersoes)
  ? JSON.parse(readFileSync(arquivoVersoes, "utf8"))
  : {};

const capitulos = [];
const faltando = [];
const problemas = [];

for (const arquivoRoteiro of roteiros) {
  const roteiro = JSON.parse(readFileSync(join(dirRoteiros, arquivoRoteiro), "utf8"));
  const slug = roteiro.id.replace("/", "-");
  const numero = Number(slug.replace("livro-ch", ""));

  const transcricao = join(dirAudio, `${slug}.json`);
  const mp3 = join(dirAudio, `${slug}.mp3`);

  if (!existsSync(transcricao) || !existsSync(mp3)) {
    faltando.push(slug);
    continue;
  }

  const meta = JSON.parse(readFileSync(transcricao, "utf8"));
  const turnos = meta.turnos ?? [];
  // O nginx mantém MP3s no cache do navegador por 30 dias. Como o nome do
  // arquivo é estável enquanto um capítulo é corrigido, a URL precisa carregar
  // uma versão derivada do conteúdo para nunca reproduzir a geração anterior.
  const versao = createHash("sha256").update(readFileSync(mp3)).digest("hex").slice(0, 12);

  // `narrar()` pula fala que não produz pedaço nenhum. Se isso acontecer, o
  // índice do roteiro deixa de casar com o do turno e a página 7 apontaria
  // para o parágrafo errado — em silêncio, que é o pior tipo de erro.
  if (turnos.length !== roteiro.falas.length) {
    problemas.push(
      `${slug}: ${roteiro.falas.length} falas no roteiro, ${turnos.length} turnos no áudio`,
    );
  }

  const paginas = {};
  for (const [pagina, indice] of Object.entries(roteiro.paginas ?? {})) {
    let turno = turnos[indice];
    const esperado = roteiro.falas[indice]?.texto?.trim();

    // Confere pelo TEXTO, não só pelo índice. Se desalinhou, procura a fala
    // certa em vez de gravar um tempo errado.
    if (!turno || (esperado && turno.texto !== esperado)) {
      const achado = turnos.find((t) => t.texto === esperado);
      if (!achado) {
        problemas.push(`${slug}: página ${pagina} não tem turno correspondente`);
        continue;
      }
      turno = achado;
    }
    paginas[Number(pagina)] = turno.at;
  }

  // Os inícios têm de crescer com o número da página.
  const ordenadas = Object.keys(paginas).map(Number).sort((a, b) => a - b);
  for (let i = 1; i < ordenadas.length; i += 1) {
    if (paginas[ordenadas[i]] < paginas[ordenadas[i - 1]]) {
      problemas.push(`${slug}: página ${ordenadas[i]} começa antes da anterior`);
    }
  }

  // A duração declarada tem de bater com o último turno; se não bater, o mp3
  // foi cortado ou a transcrição é de outra geração.
  const fimDoUltimo = turnos.length ? turnos[turnos.length - 1].fim : 0;
  if (meta.duracao && Math.abs(meta.duracao - fimDoUltimo) > 5) {
    problemas.push(
      `${slug}: duração ${meta.duracao}s não bate com o fim do último turno (${fimDoUltimo}s)`,
    );
  }

  capitulos.push({
    numero,
    titulo: roteiro.titulo,
    resumo: roteiro.resumo,
    src: `/audio/livro/${slug}.mp3?v=${versao}`,
    duracao: meta.duracao,
    geracao: versoes[slug] ? `0.${String(versoes[slug]).padStart(2, "0")}` : undefined,
    turnos: turnos.map((t) => ({ at: t.at, fim: t.fim, voz: t.voz, texto: t.texto })),
    paginas,
  });
}

capitulos.sort((a, b) => a.numero - b.numero);

const cabecalho = `// GERADO por scripts/import-audiolivro.mjs — não edite à mão.
//
// A fonte é a saída da Dubla em work/livro/audio (mp3 + tempos por fala) e os
// roteiros em work/livro/roteiros (mapa de página -> fala). Para atualizar:
//   node scripts/import-audiolivro.mjs
import type { AudiolivroCapitulo } from "./audiolivro-types";

export const audiolivroCapitulos: AudiolivroCapitulo[] = `;

const corpo = JSON.stringify(capitulos, null, 2)
  .replace(/"([a-zA-Z_$][\w$]*)":/g, "$1:")
  .replace(/"/g, '"');

writeFileSync(destino, `${cabecalho}${corpo};\n`, "utf8");

const total = capitulos.reduce((s, c) => s + (c.duracao ?? 0), 0);
console.log(`${capitulos.length} de ${roteiros.length} capítulos importados`);
console.log(`duração acumulada: ${(total / 3600).toFixed(1)} h`);
if (faltando.length) console.log(`ainda sintetizando: ${faltando.join(", ")}`);

if (problemas.length) {
  console.error(`\n${problemas.length} problema(s):`);
  for (const p of problemas) console.error(`  ${p}`);
  process.exit(1);
}
