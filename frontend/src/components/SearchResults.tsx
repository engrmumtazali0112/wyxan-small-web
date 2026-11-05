"use client";

import { useEffect, useLayoutEffect, useState, type RefObject } from "react";
import { searchSites, type SearchHit } from "@/lib/api";
import { useBrowser, type Entry } from "@/store/browser";

type State =
  | { status: "loading" }
  | { status: "ready"; hits: SearchHit[] }
  | { status: "error"; message: string };

interface Props {
  entry: Entry;
  scroller: RefObject<HTMLDivElement | null>;
  onSettled: (key: string) => void;
}

export default function SearchResults({ entry, scroller, onSettled }: Props) {
  const navigate = useBrowser((s) => s.navigate);
  const [state, setState] = useState<State>({ status: "loading" });
  const [initialScroll] = useState(entry.scrollY);

  useEffect(() => {
    const ctrl = new AbortController();
    searchSites(entry.value, ctrl.signal)
      .then((hits) => setState({ status: "ready", hits }))
      .catch((e: unknown) => {
        if (e instanceof DOMException && e.name === "AbortError") return;
        setState({ status: "error", message: e instanceof Error ? e.message : String(e) });
      });
    return () => ctrl.abort();
  }, [entry.value]);

  const settled = state.status !== "loading";
  useLayoutEffect(() => {
    if (!settled) return;
    if (scroller.current) scroller.current.scrollTop = initialScroll;
    onSettled(entry.key);
  }, [settled, scroller, initialScroll, onSettled, entry.key]);

  return (
    <div className="page">
      <h1>Search: {entry.value}</h1>
      {state.status === "loading" && <p className="muted">Searching…</p>}
      {state.status === "error" && <p>{state.message}</p>}
      {state.status === "ready" && state.hits.length === 0 && (
        <p>Nothing on the small web mentions that.</p>
      )}
      {state.status === "ready" && state.hits.length > 0 && (
        <>
          <p className="muted">
            {state.hits.length} {state.hits.length === 1 ? "page" : "pages"}, best match first
          </p>
          <ol className="hits">
            {state.hits.map((h) => (
              <li key={h.address}>
                <button className="hit" onClick={() => navigate(h.address, "search")}>
                  <span className="hit__title">{h.title}</span>
                  <span className="hit__addr">{h.address}</span>
                  <span className="hit__snippet">{h.snippet}</span>
                </button>
              </li>
            ))}
          </ol>
        </>
      )}
    </div>
  );
}