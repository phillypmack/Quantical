import type { AudioEpisode } from "./types";

/**
 * Episódios de "Quantical em Áudio".
 *
 * ARQUIVO GERADO — não edite à mão. A fonte é o roteiro em `audio/roteiros/`,
 * sintetizado pela Dubla (`python -m dubla narrar`) e importado por
 * `npm run audio:import`.
 *
 * Os mp3 ficam fora do repositório do build: `media/audio/` é enviado ao
 * servidor por `scripts/deploy-audio.sh` e servido em `/audio/`. Empacotá-los
 * junto do site somaria dezenas de MB a cada deploy sem necessidade.
 */
export const episodios: AudioEpisode[] = [];
