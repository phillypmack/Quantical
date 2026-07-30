import Link from "next/link";
import {
  ArrowRight,
  Atom,
  BookOpen,
  Braces,
  Check,
  GraduationCap,
  MoveRight,
  Sparkles,
} from "lucide-react";

import { HadamardDemo } from "@/components/hadamard-demo";
import { tracks, totalLessons } from "@/data/curriculum";

export default function HomePage() {
  return (
    <>
      <section className="home-hero">
        <div className="shell hero-grid">
          <div className="hero-copy">
            <p className="eyebrow">A nova linguagem da computação</p>
            <h1 className="display">
              O futuro não é binário.
              <em>Aprenda a programá-lo.</em>
            </h1>
            <p className="lead">
              Da primeira superposição aos algoritmos quânticos — teoria clara,
              circuitos visuais e código que você pode executar agora.
            </p>
            <div className="hero-actions">
              <Link className="button button--dark" href="/aprender">
                Iniciar minha jornada
                <ArrowRight size={17} />
              </Link>
              <Link className="hero-plain-link" href="/laboratorio">
                Explorar laboratório
              </Link>
            </div>
            <div className="hero-proof">
              <span><Check size={14} /> Sem pré-requisitos</span>
              <span><Check size={14} /> Gratuito para começar</span>
            </div>
          </div>
          <div className="hero-visual">
            <div className="hero-orbit hero-orbit--one" />
            <div className="hero-orbit hero-orbit--two" />
            <HadamardDemo />
            <span className="floating-note floating-note--one">|ψ⟩ = α|0⟩ + β|1⟩</span>
            <span className="floating-note floating-note--two">P(0) + P(1) = 1</span>
          </div>
        </div>
        <div className="shell stat-strip">
          <div><strong>{totalLessons}</strong><span>aulas práticas</span></div>
          <div><strong>18</strong><span>módulos progressivos</span></div>
          <div><strong>∞</strong><span>circuitos para explorar</span></div>
          <p>Simulação 100% local.<br />Seus dados ficam com você.</p>
        </div>
      </section>

      <section className="home-section method-section">
        <div className="shell">
          <div className="section-heading">
            <p className="eyebrow">Intuição antes da equação</p>
            <h2>Você não precisa ser um físico para começar.</h2>
            <p>
              A Quantical transforma ideias abstratas em experimentos concretos.
              Veja o estado, altere o circuito e descubra o porquê.
            </p>
          </div>
          <div className="method-grid">
            <article>
              <span className="method-number">01</span>
              <div className="method-icon"><BookOpen size={23} /></div>
              <h3>Entenda</h3>
              <p>Conceitos em linguagem clara, diagramas precisos e contexto histórico.</p>
              <div className="mini-equation">|0⟩ → H → |+⟩</div>
            </article>
            <article>
              <span className="method-number">02</span>
              <div className="method-icon method-icon--cyan"><Atom size={23} /></div>
              <h3>Experimente</h3>
              <p>Mude portas e parâmetros. A simulação responde em tempo real.</p>
              <div className="mini-bars"><i /><i /><i /><i /></div>
            </article>
            <article>
              <span className="method-number">03</span>
              <div className="method-icon method-icon--orange"><Braces size={23} /></div>
              <h3>Programe</h3>
              <p>Escreva circuitos em Python/Qiskit e leve o raciocínio para projetos.</p>
              <pre className="mini-code"><code><b>qc</b>.h(0){"\n"}<b>qc</b>.cx(0, 1)</code></pre>
            </article>
          </div>
        </div>
      </section>

      <section className="home-section tracks-section">
        <div className="shell">
          <div className="section-heading section-heading--row">
            <div>
              <p className="eyebrow">Uma rota para cada mente</p>
              <h2>Escolha onde começar.</h2>
            </div>
            <p>As trilhas se conectam. Comece no seu nível e avance no seu ritmo.</p>
          </div>
          <div className="track-home-grid">
            {tracks.map((track, index) => {
              const Icon = index === 0 ? Sparkles : index === 1 ? Braces : GraduationCap;
              return (
                <article className={`track-home-card track-home-card--${track.id}`} key={track.id}>
                  <div className="track-card-top">
                    <span className="track-icon"><Icon size={21} /></span>
                    <span className="pill">Trilha {String(index + 1).padStart(2, "0")}</span>
                  </div>
                  <p>{track.eyebrow}</p>
                  <h3>{track.title}</h3>
                  <p className="track-description">{track.description}</p>
                  <ul>
                    {track.modules.slice(0, 3).map((module) => (
                      <li key={module.id}><Check size={14} /> {module.shortTitle}</li>
                    ))}
                  </ul>
                  <Link href={`/aprender#${track.id}`}>
                    Ver trilha completa <MoveRight size={17} />
                  </Link>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="home-section lab-callout">
        <div className="shell lab-callout-grid">
          <div>
            <p className="eyebrow">Seu laboratório pessoal</p>
            <h2>Da hipótese ao circuito em segundos.</h2>
            <p className="lead">
              Monte portas visualmente ou programe em Qiskit. Acompanhe amplitudes,
              probabilidades e a esfera de Bloch sem instalar nada.
            </p>
            <Link className="button button--dark" href="/laboratorio">
              Abrir o laboratório <ArrowRight size={17} />
            </Link>
          </div>
          <div className="code-window" aria-label="Exemplo de código Qiskit">
            <div className="code-window-bar"><i /><i /><i /><span>bell_state.py</span></div>
            <pre><code>
              <span className="code-muted"># Crie um par emaranhado</span>{"\n"}
              <span className="code-purple">from</span> qiskit <span className="code-purple">import</span> QuantumCircuit{"\n\n"}
              qc = <span className="code-cyan">QuantumCircuit</span>(<span className="code-orange">2</span>){"\n"}
              qc.<span className="code-cyan">h</span>(<span className="code-orange">0</span>){"\n"}
              qc.<span className="code-cyan">cx</span>(<span className="code-orange">0</span>, <span className="code-orange">1</span>){"\n"}
              qc.<span className="code-cyan">measure_all</span>()
            </code></pre>
            <div className="code-output">
              <span>RESULTADO</span>
              <div><i style={{ width: "48%" }} /><b>|00⟩ 48%</b></div>
              <div><i style={{ width: "52%" }} /><b>|11⟩ 52%</b></div>
            </div>
          </div>
        </div>
      </section>

      <section className="closing-cta">
        <div className="closing-orbit" aria-hidden="true" />
        <div className="narrow-shell">
          <p className="eyebrow">O primeiro qubit é o mais importante</p>
          <h2>Pronto para pensar além de zeros e uns?</h2>
          <p>Escolha uma trilha. Seu progresso é salvo automaticamente.</p>
          <Link className="button button--light" href="/aprender">
            Começar agora <ArrowRight size={17} />
          </Link>
        </div>
      </section>
    </>
  );
}
