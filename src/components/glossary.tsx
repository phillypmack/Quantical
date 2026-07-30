"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";

import { glossary } from "@/data/glossary";

export function Glossary() {
  const [query, setQuery] = useState("");
  const items = useMemo(
    () => glossary.filter(([term, definition]) => `${term} ${definition}`.toLowerCase().includes(query.toLowerCase())),
    [query],
  );
  return (
    <>
      <label className="glossary-search">
        <Search size={18} />
        <input onChange={(event) => setQuery(event.target.value)} placeholder="Buscar termo ou conceito…" value={query} />
        <span>{items.length} termos</span>
      </label>
      <div className="glossary-list">
        {items.map(([term, definition]) => (
          <article key={term}>
            <span>{term.slice(0, 1)}</span>
            <h2>{term}</h2>
            <p>{definition}</p>
          </article>
        ))}
      </div>
    </>
  );
}
