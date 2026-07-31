"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Download, Gauge, Pause, Play, RotateCcw, RotateCw } from "lucide-react";

import { LOCUTORES, formatarTempo, type AudioEpisode } from "@/data/audio";
import { cn } from "@/lib/cn";
import { useProgress } from "@/components/progress-provider";

const VELOCIDADES = [1, 1.25, 1.5, 1.75];
const PULO = 15;

/**
 * Tocador do episódio com transcrição sincronizada.
 *
 * O `<audio>` é real e continua sendo a fonte da verdade — os controles são
 * próprios só para caber no desenho do site. A transcrição não é enfeite: é a
 * alternativa acessível ao áudio, e é o que torna o episódio indexável em
 * português, que é justamente onde falta conteúdo.
 */
export function EpisodePlayer({ episode }: { episode: AudioEpisode }) {
  const { completeLesson, completed } = useProgress();
  const audioRef = useRef<HTMLAudioElement>(null);
  const [tocando, setTocando] = useState(false);
  const [tempo, setTempo] = useState(0);
  const [duracao, setDuracao] = useState(episode.duracao);
  const [velocidade, setVelocidade] = useState(1);
  const [erro, setErro] = useState(false);

  const progressoId = `audio/${episode.id}`;
  const ouvido = completed.includes(progressoId);
  const marcado = useRef(ouvido);

  const turnoAtual = episode.turnos.findLastIndex((turno) => tempo >= turno.at);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const aoAtualizar = () => {
      setTempo(audio.currentTime);
      // Marca como ouvido a 90%: exigir o fim penaliza quem para nos créditos.
      if (!marcado.current && audio.duration > 0 && audio.currentTime / audio.duration >= 0.9) {
        marcado.current = true;
        completeLesson(progressoId, 100);
      }
    };
    const aoCarregar = () => setDuracao(audio.duration || episode.duracao);

    audio.addEventListener("timeupdate", aoAtualizar);
    audio.addEventListener("loadedmetadata", aoCarregar);
    audio.addEventListener("play", () => setTocando(true));
    audio.addEventListener("pause", () => setTocando(false));
    audio.addEventListener("ended", () => setTocando(false));
    audio.addEventListener("error", () => setErro(true));

    return () => {
      audio.removeEventListener("timeupdate", aoAtualizar);
      audio.removeEventListener("loadedmetadata", aoCarregar);
    };
  }, [completeLesson, progressoId, episode.duracao]);

  const irPara = useCallback((segundos: number) => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = Math.max(0, Math.min(audio.duration || episode.duracao, segundos));
    setTempo(audio.currentTime);
  }, [episode.duracao]);

  const alternar = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused) void audio.play();
    else audio.pause();
  }, []);

  const trocarVelocidade = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const proxima = VELOCIDADES[(VELOCIDADES.indexOf(velocidade) + 1) % VELOCIDADES.length];
    audio.playbackRate = proxima;
    setVelocidade(proxima);
  }, [velocidade]);

  return (
    <section className="episode-player" aria-label={`Episódio: ${episode.titulo}`}>
      <audio className="episode-audio" preload="metadata" ref={audioRef} src={episode.src}>
        <track kind="captions" />
      </audio>

      <header className="episode-head">
        <div>
          <span className="episode-eyebrow">Quantical em Áudio · episódio {episode.numero}</span>
          <h2>{episode.titulo}</h2>
          <p>{episode.resumo}</p>
        </div>
        {ouvido && <span className="episode-ouvido">Ouvido</span>}
      </header>

      {erro ? (
        <p className="episode-erro" role="alert">
          Não foi possível carregar o áudio deste episódio. A transcrição completa está abaixo.
        </p>
      ) : (
        <div className="episode-controles">
          <button
            aria-label={tocando ? "Pausar" : "Tocar episódio"}
            className="episode-play"
            onClick={alternar}
            type="button"
          >
            {tocando ? <Pause size={20} /> : <Play size={20} />}
          </button>

          <button aria-label={`Voltar ${PULO} segundos`} onClick={() => irPara(tempo - PULO)} type="button">
            <RotateCcw size={16} />
          </button>
          <button aria-label={`Avançar ${PULO} segundos`} onClick={() => irPara(tempo + PULO)} type="button">
            <RotateCw size={16} />
          </button>

          <span className="episode-tempo">{formatarTempo(tempo)}</span>

          <input
            aria-label="Posição no episódio"
            aria-valuetext={`${formatarTempo(tempo)} de ${formatarTempo(duracao)}`}
            className="episode-barra"
            max={Math.round(duracao)}
            min={0}
            onChange={(evento) => irPara(Number(evento.target.value))}
            step={1}
            type="range"
            value={Math.round(tempo)}
          />

          <span className="episode-tempo">{formatarTempo(duracao)}</span>

          <button
            aria-label={`Velocidade ${velocidade}x. Clique para mudar.`}
            className="episode-velocidade"
            onClick={trocarVelocidade}
            type="button"
          >
            <Gauge size={15} /> {velocidade}×
          </button>

          <a
            aria-label="Baixar o episódio em MP3"
            className="episode-baixar"
            download
            href={episode.src}
          >
            <Download size={15} />
          </a>
        </div>
      )}

      <ol className="episode-transcricao">
        {episode.turnos.map((turno, indice) => {
          const locutor = LOCUTORES[turno.voz];
          return (
            <li
              className={cn("episode-turno", indice === turnoAtual && !erro && "is-atual")}
              key={`${turno.at}-${indice}`}
            >
              <button onClick={() => irPara(turno.at)} type="button">
                <span className={cn("episode-locutor", `is-${turno.voz}`)}>
                  {locutor.nome}
                  <small>{formatarTempo(turno.at)}</small>
                </span>
                <p>{turno.texto}</p>
              </button>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
