import type { Metadata } from "next";

import { ProjectsList } from "@/components/projects-list";

export const metadata: Metadata = { title: "Meus projetos" };

export default function ProjectsPage() {
  return (
    <>
      <section className="page-hero">
        <div className="shell">
          <p className="eyebrow">Sua bancada</p>
          <h1 className="page-title">Projetos quânticos.</h1>
          <p className="lead">Circuitos salvos no laboratório, prontos para continuar.</p>
        </div>
      </section>
      <section className="projects-section"><div className="shell"><ProjectsList /></div></section>
    </>
  );
}
