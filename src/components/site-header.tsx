"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowUpRight, Menu } from "lucide-react";

import { cn } from "@/lib/cn";
import { HeaderSessao } from "./header-sessao";
import { QuantumMark } from "./quantum-mark";

const nav = [
  { href: "/aprender", label: "Trilhas" },
  { href: "/laboratorio", label: "Laboratório" },
  { href: "/desafios", label: "Desafios" },
  { href: "/notacao", label: "Notação" },
  { href: "/glossario", label: "Glossário" },
];

export function SiteHeader() {
  const pathname = usePathname();
  return (
    <header className="site-header">
      <div className="shell header-inner">
        <Link href="/" className="brand" aria-label="Quantical, página inicial">
          <QuantumMark />
          <span>Quantical</span>
        </Link>
        <nav className="desktop-nav" aria-label="Navegação principal">
          {nav.map((item) => (
            <Link
              key={item.href}
              className={cn("nav-link", pathname.startsWith(item.href) && "is-active")}
              href={item.href}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="header-actions">
          <HeaderSessao />
          <Link className="button button--dark button--small" href="/aprender">
            Começar
            <ArrowUpRight size={15} />
          </Link>
          <details className="mobile-menu">
            <summary aria-label="Abrir menu">
              <Menu size={21} />
            </summary>
            <nav>
              {nav.map((item) => (
                <Link key={item.href} href={item.href}>
                  {item.label}
                </Link>
              ))}
              <Link href="/progresso">Meu progresso</Link>
              <Link href="/revisar">Revisar</Link>
              <Link href="/projetos">Meus projetos</Link>
            </nav>
          </details>
        </div>
      </div>
    </header>
  );
}
