"use client";

import Link from "next/link";
import {
  ArrowRight,
  Award,
  BookMarked,
  BrainCircuit,
  Flame,
  Medal,
  Sparkles,
  Target,
  Trophy,
} from "lucide-react";

import { getAllLessons, getModuleLessons, totalLessons, tracks } from "@/data/curriculum";
import { consolidados } from "@/lib/revisao/agenda";
import { AvisoDeRevisao } from "./revisao-sessao";
import { useProgress } from "./progress-provider";

const achievementList = [
  { id: "first", title: "Primeiro colapso", description: "Conclua sua primeira aula.", threshold: 1, icon: Sparkles },
  { id: "five", title: "Observador atento", description: "Conclua cinco aulas.", threshold: 5, icon: Target },
  { id: "module", title: "Módulo fechado", description: "Complete três aulas.", threshold: 3, icon: Medal },
  { id: "ten", title: "Em superposição", description: "Conclua dez aulas.", threshold: 10, icon: Trophy },
];

export function ProgressDashboard() {
  const { completed, streak, lastLesson, hydrated, quizScores, revisao } = useProgress();
  const allLessons = getAllLessons();
  const last = allLessons.find((lesson) => lesson.id === lastLesson);
  const average = Object.values(quizScores).length
    ? Math.round(Object.values(quizScores).reduce((sum, value) => sum + value, 0) / Object.values(quizScores).length)
    : 0;
  // Conceitos firmes valem mais que aulas concluídas: concluir é passar por
  // cima, firmar é acertar de novo depois de dias sem ver o assunto.
  const firmes = hydrated ? consolidados(revisao).length : 0;

  return (
    <div className="dashboard">
      <section className="dashboard-welcome">
        <div>
          <p className="eyebrow">Seu observatório</p>
          <h1>Continue de onde<br />sua curiosidade parou.</h1>
          <p>Seu progresso é salvo automaticamente neste dispositivo.</p>
        </div>
        <div className="streak-orbit">
          <Flame size={24} />
          <strong>{hydrated ? streak : 0}</strong>
          <span>dias de sequência</span>
        </div>
      </section>

      <section className="dashboard-stats">
        <article><BookMarked size={18} /><strong>{completed.length}</strong><span>de {totalLessons} aulas</span></article>
        <article><Target size={18} /><strong>{Math.round((completed.length / totalLessons) * 100)}%</strong><span>do currículo</span></article>
        <article><Award size={18} /><strong>{average}%</strong><span>média nos quizzes</span></article>
        <article><BrainCircuit size={18} /><strong>{firmes}</strong><span>conceitos firmes</span></article>
      </section>

      <AvisoDeRevisao />

      {last ? (
        <section className="continue-card">
          <div>
            <span>Continue aprendendo</span>
            <h2>{last.module.title}</h2>
            <p>{last.label} · {last.track.title}</p>
          </div>
          <Link className="button button--dark" href={last.href}>Retomar aula <ArrowRight size={16} /></Link>
        </section>
      ) : (
        <section className="continue-card">
          <div>
            <span>Seu primeiro passo</span>
            <h2>Do bit ao qubit</h2>
            <p>Conceito · Fundamentos quânticos</p>
          </div>
          <Link className="button button--dark" href="/curso/iniciante/bits-e-qubits/teoria">Começar <ArrowRight size={16} /></Link>
        </section>
      )}

      <section className="dashboard-section">
        <div className="dashboard-section-heading">
          <div><span>Trilhas</span><h2>Visão geral</h2></div>
          <Link href="/aprender">Ver currículo <ArrowRight size={14} /></Link>
        </div>
        <div className="progress-track-grid">
          {tracks.map((track) => {
            const lessons = track.modules.flatMap((module) => getModuleLessons(track.id, module.id));
            const done = lessons.filter((lesson) => completed.includes(lesson.id)).length;
            const percent = Math.round((done / lessons.length) * 100);
            return (
              <article key={track.id} style={{ "--accent": track.accent } as React.CSSProperties}>
                <span>{track.audience}</span>
                <h3>{track.title}</h3>
                <div><i style={{ width: `${percent}%` }} /></div>
                <p><strong>{percent}%</strong><span>{done}/{lessons.length} aulas</span></p>
              </article>
            );
          })}
        </div>
      </section>

      <section className="dashboard-section">
        <div className="dashboard-section-heading">
          <div><span>Marcos</span><h2>Conquistas</h2></div>
        </div>
        <div className="achievement-grid">
          {achievementList.map((achievement) => {
            const unlocked = completed.length >= achievement.threshold;
            const Icon = achievement.icon;
            return (
              <article className={unlocked ? "is-unlocked" : ""} key={achievement.id}>
                <div><Icon size={20} /></div>
                <h3>{achievement.title}</h3>
                <p>{achievement.description}</p>
                <span>{unlocked ? "Conquistado" : `${Math.min(completed.length, achievement.threshold)}/${achievement.threshold}`}</span>
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
}
