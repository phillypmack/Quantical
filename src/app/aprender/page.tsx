import type { Metadata } from "next";
import { Compass, Gauge, Layers3 } from "lucide-react";

import { TrackCurriculum } from "@/components/track-curriculum";

export const metadata: Metadata = {
  title: "Trilhas de aprendizagem",
  description: "Escolha seu nível e avance do primeiro qubit à teoria quântica.",
};

export default function LearnPage() {
  return (
    <>
      <section className="page-hero learn-hero">
        <div className="shell">
          <p className="eyebrow">Currículo Quantical</p>
          <h1 className="page-title">Uma jornada.<br />Três pontos de partida.</h1>
          <p className="lead">
            Não existe um único caminho para a computação quântica. Escolha a rota que
            conversa com o que você já sabe — e mude quando quiser.
          </p>
          <div className="learn-principles">
            <span><Compass size={17} /> Comece onde faz sentido</span>
            <span><Layers3 size={17} /> 54 aulas conectadas</span>
            <span><Gauge size={17} /> Progresso automático</span>
          </div>
        </div>
      </section>
      <section className="curriculum-section">
        <div className="shell">
          <TrackCurriculum />
        </div>
      </section>
    </>
  );
}
