/**
 * Gerador pseudoaleatório semeável (mulberry32).
 *
 * O amostrador anterior tinha a semente cravada em `0x51f15e`, então o mesmo
 * circuito produzia contagens idênticas para sempre — e o seletor de "shots"
 * não tinha nenhum efeito observável. Ruído amostral é justamente o que a
 * aula sobre medição precisa mostrar: ver 497/1024 em vez de exatamente
 * 512/1024 É a lição.
 */
export type Rng = () => number;

export function mulberry32(seed: number): Rng {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Semente imprevisível, com queda para Math.random fora do navegador. */
export function randomSeed(): number {
  if (typeof crypto !== "undefined" && typeof crypto.getRandomValues === "function") {
    return crypto.getRandomValues(new Uint32Array(1))[0];
  }
  return Math.floor(Math.random() * 0xffffffff);
}
