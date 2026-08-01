import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight } from "lucide-react";

import { EpisodePlayer } from "@/components/audio/episode-player";
import { LOCUTORES, episodios, slugDoEpisodio } from "@/data/audio";
import { getTrack } from "@/data/curriculum";
import { SITE_URL, SOCIAL_IMAGE } from "@/lib/site";

type EpisodePageProps = { params: Promise<{ id: string }> };

const porSlug = new Map(episodios.map((episodio) => [slugDoEpisodio(episodio.id), episodio]));

export function generateStaticParams() {
  return episodios.map((episodio) => ({ id: slugDoEpisodio(episodio.id) }));
}

export async function generateMetadata({ params }: EpisodePageProps): Promise<Metadata> {
  const episodio = porSlug.get((await params).id);
  if (!episodio) return { title: "Episódio" };

  const url = `${SITE_URL}/audio/${slugDoEpisodio(episodio.id)}`;
  return {
    title: `${episodio.titulo} — Quantical em Áudio`,
    description: episodio.resumo,
    alternates: { canonical: `/audio/${slugDoEpisodio(episodio.id)}` },
    openGraph: {
      type: "article",
      url,
      title: episodio.titulo,
      description: episodio.resumo,
      images: [SOCIAL_IMAGE],
      audio: [{ url: `${SITE_URL}${episodio.src}`, type: "audio/mpeg" }],
    },
  };
}

export default async function EpisodePage({ params }: EpisodePageProps) {
  const episodio = porSlug.get((await params).id);
  if (!episodio) notFound();

  const track = getTrack(episodio.trackId);
  const aula = `/curso/${episodio.trackId}/${episodio.moduleId}/teoria`;

  // Dados estruturados de episódio: é o que faz o Google entender que a página
  // é um podcast e não um artigo qualquer.
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "PodcastEpisode",
    name: episodio.titulo,
    description: episodio.resumo,
    inLanguage: "pt-BR",
    url: `${SITE_URL}/audio/${slugDoEpisodio(episodio.id)}`,
    timeRequired: `PT${Math.round(episodio.duracao / 60)}M`,
    partOfSeries: {
      "@type": "PodcastSeries",
      name: "Quantical em Áudio",
      url: `${SITE_URL}/audio`,
    },
    associatedMedia: {
      "@type": "MediaObject",
      contentUrl: `${SITE_URL}${episodio.src}`,
      encodingFormat: "audio/mpeg",
    },
  };

  return (
    <div className="narrow-shell episode-page">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />

      <Link className="lesson-back" href="/audio">
        <ArrowLeft size={15} /> Todos os episódios
      </Link>

      <EpisodePlayer episode={episodio} />

      <aside className="episode-rodape">
        <div>
          <span>Quem fala</span>
          <p>
            <strong>{LOCUTORES.nina.nome}</strong> {LOCUTORES.nina.papel} ·{" "}
            <strong>{LOCUTORES.teo.nome}</strong> {LOCUTORES.teo.papel}. As duas vozes são
            sintetizadas localmente — nada deste episódio passou por um serviço externo.
          </p>
        </div>
        <Link className="button button--dark button--small" href={aula}>
          Fazer a aula de {track?.title.toLowerCase()} <ArrowRight size={15} />
        </Link>
      </aside>
    </div>
  );
}
