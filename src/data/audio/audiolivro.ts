// GERADO por scripts/import-audiolivro.mjs — não edite à mão.
//
// A fonte é a saída da Dubla em work/livro/audio (mp3 + tempos por fala) e os
// roteiros em work/livro/roteiros (mapa de página -> fala). Para atualizar:
//   node scripts/import-audiolivro.mjs
import type { AudiolivroCapitulo } from "./audiolivro-types";

export const audiolivroCapitulos: AudiolivroCapitulo[] = [];
