"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export const VELOCIDADES = [1, 1.25, 1.5, 0.75] as const;

type Opcoes = {
  /** Duração conhecida de antemão, antes de o navegador ler o arquivo. */
  duracaoInicial: number;
  /** Chamado uma vez, quando a escuta passa de 90%. */
  aoConcluir?: () => void;
};

/**
 * A mecânica de reprodução, compartilhada pelo player de episódio e pelo de
 * audiolivro.
 *
 * Existe como hook porque os dois precisam exatamente das mesmas três coisas
 * difíceis — e a terceira é um defeito que já custou caro:
 *
 * 1. Buscar uma posição enquanto o áudio ainda não tem metadados é **ignorado
 *    em silêncio** pelo navegador. Atribuir `currentTime` com `readyState 0`
 *    não faz nada e não avisa. Clicar numa fala assim que a página abre — ou
 *    abrir o livro já na página 7 — é exatamente quando isso acontece.
 * 2. `duration` só existe depois do `loadedmetadata`; antes disso vale NaN.
 * 3. A conclusão precisa disparar uma vez só, mesmo com o `timeupdate`
 *    disparando quatro vezes por segundo.
 */
export function useReprodutor({ duracaoInicial, aoConcluir }: Opcoes) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [tocando, setTocando] = useState(false);
  const [tempo, setTempo] = useState(0);
  const [duracao, setDuracao] = useState(duracaoInicial);
  const [velocidade, setVelocidade] = useState<number>(1);
  const [erro, setErro] = useState(false);

  const buscaPendente = useRef<number | null>(null);
  const concluido = useRef(false);
  // Guardado num ref e atualizado num efeito: o callback muda a cada render
  // do consumidor, e colocá-lo na dependência do efeito abaixo recriaria os
  // listeners de áudio quatro vezes por segundo enquanto toca.
  const aoConcluirRef = useRef(aoConcluir);
  useEffect(() => {
    aoConcluirRef.current = aoConcluir;
  }, [aoConcluir]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const aoAtualizar = () => {
      setTempo(audio.currentTime);
      if (!concluido.current && audio.duration > 0 && audio.currentTime / audio.duration >= 0.9) {
        concluido.current = true;
        aoConcluirRef.current?.();
      }
    };
    const aoCarregar = () => {
      setDuracao(Number.isFinite(audio.duration) ? audio.duration : duracaoInicial);
      if (buscaPendente.current !== null) {
        audio.currentTime = buscaPendente.current;
        buscaPendente.current = null;
      }
    };
    const aoTocar = () => setTocando(true);
    const aoPausar = () => setTocando(false);
    const aoErrar = () => setErro(true);

    audio.addEventListener("timeupdate", aoAtualizar);
    audio.addEventListener("loadedmetadata", aoCarregar);
    audio.addEventListener("play", aoTocar);
    audio.addEventListener("pause", aoPausar);
    audio.addEventListener("ended", aoPausar);
    audio.addEventListener("error", aoErrar);

    return () => {
      audio.removeEventListener("timeupdate", aoAtualizar);
      audio.removeEventListener("loadedmetadata", aoCarregar);
      audio.removeEventListener("play", aoTocar);
      audio.removeEventListener("pause", aoPausar);
      audio.removeEventListener("ended", aoPausar);
      audio.removeEventListener("error", aoErrar);
    };
  }, [duracaoInicial]);

  const irPara = useCallback(
    (segundos: number) => {
      const audio = audioRef.current;
      if (!audio) return;

      const limite = Number.isFinite(audio.duration) ? audio.duration : duracaoInicial;
      const alvo = Math.max(0, Math.min(limite, segundos));

      if (audio.readyState === 0) {
        buscaPendente.current = alvo;
        audio.load();
      } else {
        audio.currentTime = alvo;
      }
      setTempo(alvo);
    },
    [duracaoInicial],
  );

  const alternar = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused) void audio.play();
    else audio.pause();
  }, []);

  const trocarVelocidade = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const proxima = VELOCIDADES[(VELOCIDADES.indexOf(velocidade as 1) + 1) % VELOCIDADES.length];
    audio.playbackRate = proxima;
    setVelocidade(proxima);
  }, [velocidade]);

  return { audioRef, tocando, tempo, duracao, velocidade, erro, irPara, alternar, trocarVelocidade };
}
