"use client";

import Link from "next/link";
import { ArrowRight, Braces, Clock3, FolderOpen, Trash2 } from "lucide-react";

import { useProgress } from "./progress-provider";

export function ProjectsList() {
  const { projects, removeProject } = useProgress();
  if (!projects.length) {
    return (
      <div className="empty-state">
        <FolderOpen size={28} />
        <h3>Seu primeiro circuito começa vazio.</h3>
        <p>Crie algo no laboratório e use “Salvar projeto”. Ele aparecerá aqui, neste dispositivo.</p>
        <Link className="button button--dark" href="/laboratorio">Criar circuito <ArrowRight size={16} /></Link>
      </div>
    );
  }
  return (
    <div className="project-grid">
      {projects.map((project) => (
        <article key={project.id}>
          <div className="project-icon"><Braces size={21} /></div>
          <button aria-label={`Excluir ${project.title}`} onClick={() => removeProject(project.id)} type="button"><Trash2 size={15} /></button>
          <h2>{project.title}</h2>
          <p><Clock3 size={12} /> Atualizado em {new Date(project.updatedAt).toLocaleDateString("pt-BR")}</p>
          <pre>{project.code.split("\n").slice(0, 4).join("\n")}</pre>
          <Link href="/laboratorio">Abrir no laboratório <ArrowRight size={15} /></Link>
        </article>
      ))}
    </div>
  );
}
