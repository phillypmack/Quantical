import type { Metadata } from "next";

import { Glossary } from "@/components/glossary";

export const metadata: Metadata = { title: "Glossário quântico" };

export default function GlossaryPage() {
  return (
    <>
      <section className="page-hero">
        <div className="shell">
          <p className="eyebrow">Conceitos essenciais</p>
          <h1 className="page-title">Um vocabulário<br />para o impossível.</h1>
          <p className="lead">Definições diretas para consultar enquanto você aprende e experimenta.</p>
        </div>
      </section>
      <section className="glossary-section"><div className="shell"><Glossary /></div></section>
    </>
  );
}
