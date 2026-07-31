"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";

import { glossary, glossaryById } from "@/data/glossary";

export function Glossary() {
  const [query, setQuery] = useState("");

  const items = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return glossary;
    return glossary.filter((entry) =>
      [entry.term, entry.definition, ...(entry.aliases ?? [])]
        .join(" ")
        .toLowerCase()
        .includes(needle),
    );
  }, [query]);

  return (
    <>
      <label className="glossary-search">
        <Search size={18} />
        <input
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Buscar termo ou conceito…"
          value={query}
        />
        <span>{items.length} termos</span>
      </label>

      <div className="glossary-list">
        {items.map((entry) => (
          <article id={entry.id} key={entry.id}>
            <span>{entry.term.slice(0, 1)}</span>
            <h2>{entry.term}</h2>
            <p>{entry.definition}</p>
            {entry.seeAlso?.length ? (
              <footer className="glossary-related">
                <span>Ver também</span>
                {entry.seeAlso.map((reference) => {
                  const related = glossaryById.get(reference);
                  if (!related) return null;
                  return (
                    <a href={`#${related.id}`} key={reference}>
                      {related.term}
                    </a>
                  );
                })}
              </footer>
            ) : null}
          </article>
        ))}
      </div>

      {items.length === 0 && (
        <p className="glossary-empty">Nenhum termo encontrado para “{query}”.</p>
      )}
    </>
  );
}
