"use client";

import { useEffect, useRef } from "react";
import { registerScrollReader, useCurrent } from "@/store/browser";

interface Props {
  ready: boolean;
  hasUser: boolean;
  error: string | null;
}

export default function Viewport({ ready, hasUser, error }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const entry = useCurrent();

  // Lets the store read the scroll position at the instant any navigation leaves this page.
  useEffect(() => registerScrollReader(() => ref.current?.scrollTop ?? 0), []);

  return (
    <main className="viewport" ref={ref}>
      <div className="page">
        {error ? (
          <p>{error}</p>
        ) : !ready ? (
          <p>Opening…</p>
        ) : !hasUser ? (
          <>
            <h1>Who is browsing?</h1>
            <p>Pick a name in the top right. Your history belongs to whoever you are.</p>
          </>
        ) : !entry ? (
          <>
            <h1>A blank page</h1>
            <p>Type an address above, for example a site you know, and press Go.</p>
          </>
        ) : (
          <p>
            <em>{entry.kind}</em>: {entry.value} (renderer comes next)
          </p>
        )}
      </div>
    </main>
  );
}