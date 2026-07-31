import type { TrackId } from "../curriculum";

export type VozId = "nina" | "teo";

export type Locutor = {
  id: VozId;
  nome: string;
  papel: string;
};

/**
 * Os dois apresentadores. A divisão de papéis é pedagógica, não decorativa:
 * quem duvida verbaliza o engano que o ouvinte cometeria — o mesmo laço de
 * prever, errar e revisar que os experimentos guiados usam no site.
 */
export const LOCUTORES: Record<VozId, Locutor> = {
  nina: { id: "nina", nome: "Nina", papel: "explica" },
  teo: { id: "teo", nome: "Téo", papel: "questiona" },
};

export type AudioTurno = {
  /** Segundo em que a fala começa. */
  at: number;
  fim: number;
  voz: VozId;
  /** O texto ORIGINAL, com notação — a transcrição é lida por gente. */
  texto: string;
};

export type AudioEpisode = {
  /** "iniciante/bits-e-qubits" — mesmo id do módulo. */
  id: string;
  trackId: TrackId;
  moduleId: string;
  numero: number;
  titulo: string;
  resumo: string;
  /** Caminho servido pelo nginx, fora do bundle. */
  src: string;
  duracao: number;
  turnos: AudioTurno[];
};

export const slugDoEpisodio = (id: string) => id.replace("/", "-");

export function formatarTempo(segundos: number) {
  if (!Number.isFinite(segundos) || segundos < 0) return "0:00";
  const minutos = Math.floor(segundos / 60);
  const resto = Math.floor(segundos % 60);
  return `${minutos}:${resto.toString().padStart(2, "0")}`;
}
