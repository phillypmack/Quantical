import { episodios } from "./episodes";

export * from "./types";
export { episodios } from "./episodes";

export const episodiosPorModulo = new Map(episodios.map((episodio) => [episodio.id, episodio]));

export function getEpisodio(id: string) {
  return episodiosPorModulo.get(id);
}

/** Episódio de um módulo, a partir de trilha e módulo separados. */
export function getEpisodioDoModulo(trackId: string, moduleId: string) {
  return episodiosPorModulo.get(`${trackId}/${moduleId}`);
}

export const duracaoTotal = episodios.reduce((total, episodio) => total + episodio.duracao, 0);
