import Link from "next/link";
import { ArrowLeft, Orbit } from "lucide-react";

export default function NotFound() {
  return (
    <section className="not-found">
      <Orbit size={42} />
      <span>Erro 404</span>
      <h1>Esse estado não pôde ser observado.</h1>
      <p>A página pode ter mudado de órbita ou nunca ter existido.</p>
      <Link className="button button--dark" href="/"><ArrowLeft size={16} /> Voltar ao início</Link>
    </section>
  );
}
