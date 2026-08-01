import Link from "next/link";

import { QuantumMark } from "./quantum-mark";

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="shell footer-grid">
        <div>
          <Link href="/" className="brand brand--footer">
            <QuantumMark />
            <span>Quantical</span>
          </Link>
          <p>A computação quântica começa com uma boa pergunta.</p>
        </div>
        <div className="footer-links">
          <div>
            <strong>Aprender</strong>
            <Link href="/aprender">Trilhas</Link>
            <Link href="/livro">Livro</Link>
            <Link href="/desafios">Desafios</Link>
            <Link href="/glossario">Glossário</Link>
          </div>
          <div>
            <strong>Criar</strong>
            <Link href="/laboratorio">Laboratório</Link>
            <Link href="/projetos">Projetos</Link>
            <Link href="/progresso">Progresso</Link>
          </div>
        </div>
      </div>
      <div className="shell footer-bottom">
        <span>© 2026 Quantical</span>
        <span>Simule. Questione. Descubra.</span>
      </div>
    </footer>
  );
}
