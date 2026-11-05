"use client";

import { useCallback, useEffect, useRef } from "react";
import { registerScrollReader, useCurrent } from "@/store/browser";
import PageView from "./PageView";
import SearchResults from "./SearchResults";

interface Props {
  ready: boolean;
  hasUser: boolean;
  error: string | null;
}

export default function Viewport({ ready, hasUser, error }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const settled = useRef<string | null>(null); // key of the entry whose content is on screen
  const entry = useCurrent();

  const onSettled = useCallback((key: string) => {
    settled.current = key;
  }, []);

  // The store asks "where were you?" at the instant any navigation leaves an entry.
  // We answer only for an entry that actually finished rendering.
  useEffect(
    () =>
      registerScrollReader((key) =>
        settled.current === key ? (ref.current?.scrollTop ?? null) : null,
      ),
    [],
  );

  let body;
  if (error) body = <div className="page"><p>{error}</p></div>;
  else if (!ready) body = <div className="page"><p className="muted">Opening…</p></div>;
  else if (!hasUser)
    body = (
      <div className="page">
        <h1>Who is browsing?</h1>
        <p>Pick a name in the top right. Your history belongs to whoever you are.</p>
      </div>
    );
  else if (!entry)
    body = (
      <div className="page">
        <h1>A blank page</h1>
        <p>
          Type an address above and press Go. <code>start.zz</code> is a good front door.
        </p>
      </div>
    );
  else if (entry.kind === "search")
    body = <SearchResults key={entry.key} entry={entry} scroller={ref} onSettled={onSettled} />;
  else body = <PageView key={entry.key} entry={entry} scroller={ref} onSettled={onSettled} />;

  return (
    <main className="viewport" ref={ref}>
      {body}
    </main>
  );
}