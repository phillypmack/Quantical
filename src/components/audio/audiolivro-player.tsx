"use client";

import { useEffect, useRef, useState } from "react";
import { AlertTriangle, Gauge, Headphones, Pause, Play, RotateCcw } from "lucide-react";

import { formatarTempo } from "@/data/audio";
import type { AudiolivroCapitulo } from "@/data/audio/audiolivro-types";
import { inicioDaPagina } from "@/data/audio/audiolivro-types";
import { cn } from "@/lib/cn";
import { useReprodutor } from "./use-reprodutor";

/**
 * O capítulo narrado, na página que o leitor está lendo.
 *
 * Deliberadamente sem transcrição: no episódio de podcast ela é o único jeito
 * de saber o que foi dito, mas aqui o texto JÁ está na tela — é o livro. Repetir
 * seria construir duas vezes a mesma coisa e brigar por espaço com ela.
 *
 * O que o player acrescenta é a costura: ele abre no segundo em que a página
 * atual começa, e não no início do capítulo. Sem isso, um arquivo de 25 minutos
 * obrigaria a caçar o trecho na barra de progresso, e a página deixaria de ser
 * endereçável — que é justamente a graça de ela existir.
 */
export function AudiolivroPlayer({
  capitulo,
  pagina,
}: {
  capitulo: AudiolivroCapitulo;
  pagina: number;
}) {
  const { audioRef, tocando, tempo, duracao, velocidade, erro, irPara, alternar, trocarVelocidade } =
    useReprodutor({ duracaoInicial: capitulo.duracao });

  const inicio = inicioDaPagina(capitulo, pagina);
  const [seguindoPagina, setSeguindoPagina] = useState(true);

  // Trocar de página reposiciona o áudio — mas só até o ouvinte assumir o
  // controle. Quem apertou play e seguiu ouvindo não quer ser puxado de volta
  // a cada virada de página; quem está lendo e navegando, quer.
  const paginaAnterior = useRef(pagina);
  useEffect(() => {
    if (paginaAnterior.current === pagina) return;
    paginaAnterior.current = pagina;
    if (seguindoPagina && !tocando) irPara(inicio);
  }, [pagina, inicio, seguindoPagina, tocando, irPara]);

  const progresso = duracao > 0 ? (tempo / duracao) * 100 : 0;

  if (erro) {
    return (
      <div className="audiolivro-player is-erro" role="alert">
        <AlertTriangle size={16} />
        <p>Não consegui carregar a narração deste capítulo. O texto acima continua inteiro.</p>
      </div>
    );
  }

  return (
    <section
      className="audiolivro-player"
      aria-label={`Narração do capítulo ${capitulo.numero}: ${capitulo.titulo}`}
    >
      <audio
        className="audiolivro-audio"
        preload="metadata"
        ref={audioRef}
        src={capitulo.src}
      >
        <track kind="captions" />
      </audio>

      <button
        aria-label={tocando ? "Pausar narração" : "Ouvir esta página"}
        className="audiolivro-play"
        onClick={() => {
          // Primeiro play a partir do repouso começa na página aberta.
          if (!tocando && tempo === 0 && inicio > 0) irPara(inicio);
          setSeguindoPagina(false);
          alternar();
        }}
        type="button"
      >
        {tocando ? <Pause size={18} /> : <Play size={18} />}
      </button>

      <div className="audiolivro-corpo">
        <div className="audiolivro-rotulo">
          <Headphones size={13} />
          <span>
            Capítulo {capitulo.numero} · <strong>{capitulo.titulo}</strong>
          </span>
        </div>

        <label className="audiolivro-barra">
          <span className="sr-only">Posição na narração</span>
          <input
            aria-valuetext={`${formatarTempo(tempo)} de ${formatarTempo(duracao)}`}
            max={Math.max(1, Math.round(duracao))}
            min={0}
            onChange={(evento) => {
              setSeguindoPagina(false);
              irPara(Number(evento.target.value));
            }}
            step={1}
            type="range"
            value={Math.round(tempo)}
          />
          <i style={{ width: `${progresso}%` }} aria-hidden="true" />
        </label>

        <div className="audiolivro-tempos">
          <span>
            {formatarTempo(tempo)} / {formatarTempo(duracao)}
          </span>
          {inicio > 0 && (
            <button
              className={cn("audiolivro-voltar", Math.abs(tempo - inicio) < 2 && "is-aqui")}
              onClick={() => irPara(inicio)}
              type="button"
            >
              <RotateCcw size={12} /> Ir para esta página
            </button>
          )}
          <button className="audiolivro-velocidade" onClick={trocarVelocidade} type="button">
            <Gauge size={12} /> {velocidade}×
          </button>
          {/* Discreto de propósito: serve para quem está avaliando a narração
              dizer "na 0.06 a pergunta soou certa". Não é informação para o
              leitor comum, então não compete com nada na tela. */}
          {capitulo.geracao && (
            <span className="audiolivro-geracao" title="Geração desta narração">
              {capitulo.geracao}
            </span>
          )}
        </div>
      </div>
    </section>
  );
}
