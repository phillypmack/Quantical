import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Headphones, Mic } from "lucide-react";

import { LOCUTORES, episodios, formatarTempo, slugDoEpisodio } from "@/data/audio";
import { getTrack } from "@/data/curriculum";
import { SITE_URL } from "@/lib/site";

export const metadata: Metadata = {
  title: "Quantical em Áudio — podcast de computação quântica em português",
  description:
    "Episódios em que uma explica e o outro duvida: computação quântica em português, com transcrição completa de cada conversa.",
  alternates: { canonical: "/audio" },
  openGraph: {
    type: "website",
    url: `${SITE_URL}/audio`,
    title: "Quantical em Áudio",
    description:
      "Podcast de computação quântica em português, com transcrição completa de cada episódio.",
  },
};

export default function AudioIndexPage() {
  const minutos = Math.round(episodios.reduce((total, item) => total + item.duracao, 0) / 60);

  return (
    <>
      <section className="page-hero">
        <div className="shell">
          <p className="eyebrow">
            <Headphones size={15} /> Quantical em Áudio
          </p>
          <h1 className="page-title">
            Uma explica.
            <br />
            O outro duvida.
          </h1>
          <p className="lead">
            {LOCUTORES.nina.nome} conta o conceito e {LOCUTORES.teo.nome} faz as perguntas que
            você faria — inclusive as erradas, que são as mais úteis. Cada episódio tem transcrição
            completa, para ler quando não der para ouvir.
          </p>
        </div>
      </section>

      <section className="audio-section">
        <div className="shell">
          {episodios.length === 0 ? (
            <p className="audio-vazio">
              Os primeiros episódios estão sendo gravados. Enquanto isso, o{" "}
              <Link href="/laboratorio">laboratório</Link> está aberto.
            </p>
          ) : (
            <>
              <div className="audio-resumo">
                <div>
                  <Mic size={18} />
                  <span>
                    <strong>{episodios.length} episódios</strong> publicados
                  </span>
                </div>
                <div>
                  <Headphones size={18} />
                  <span>
                    <strong>{minutos} minutos</strong> de conversa
                  </span>
                </div>
              </div>

              <ul className="audio-grid">
                {episodios.map((episodio) => {
                  const track = getTrack(episodio.trackId);
                  return (
                    <li className="audio-card" key={episodio.id}>
                      <span className="audio-card-numero" style={{ color: track?.accent }}>
                        {String(episodio.numero).padStart(2, "0")}
                      </span>
                      <div>
                        <small>{track?.title}</small>
                        <h2>{episodio.titulo}</h2>
                        <p>{episodio.resumo}</p>
                      </div>
                      <footer>
                        <span>{formatarTempo(episodio.duracao)}</span>
                        <Link href={`/audio/${slugDoEpisodio(episodio.id)}`}>
                          Ouvir <ArrowRight size={15} />
                        </Link>
                      </footer>
                    </li>
                  );
                })}
              </ul>
            </>
          )}
        </div>
      </section>
    </>
  );
}
