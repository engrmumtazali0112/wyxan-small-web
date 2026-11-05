"use client";

import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useState,
  type MouseEvent,
  type RefObject,
} from "react";
import { getSite, NowhereError, type Site } from "@/lib/api";
import { ADDRESS_RE } from "@/lib/address";
import { sanitizeClient } from "@/lib/sanitize";
import { useBrowser, type Entry } from "@/store/browser";

type State =
  | { status: "loading" }
  | { status: "ready"; site: Site }
  | { status: "nowhere" }
  | { status: "error"; message: string };

interface Props {
  entry: Entry;
  scroller: RefObject<HTMLDivElement | null>;
  onSettled: (key: string) => void;
}

// Mounted with key={entry.key}: every history entry gets a fresh instance, so state resets for free.
export default function PageView({ entry, scroller, onSettled }: Props) {
  const navigate = useBrowser((s) => s.navigate);
  const [state, setState] = useState<State>({ status: "loading" });
  const [initialScroll] = useState(entry.scrollY); // where the reader was when they left this entry

  useEffect(() => {
    const ctrl = new AbortController();
    getSite(entry.value, ctrl.signal)
      .then((site) => setState({ status: "ready", site }))
      .catch((e: unknown) => {
        if (e instanceof DOMException && e.name === "AbortError") return;
        setState(
          e instanceof NowhereError
            ? { status: "nowhere" }
            : { status: "error", message: e instanceof Error ? e.message : String(e) },
        );
      });
    return () => ctrl.abort();
  }, [entry.value]);

  const clean = useMemo(
    () => (state.status === "ready" ? sanitizeClient(state.site.html) : ""),
    [state],
  );

  // Restore scroll only once real content is in the DOM; before that there is nothing to scroll.
  const settled = state.status !== "loading";
  useLayoutEffect(() => {
    if (!settled) return;
    if (scroller.current) scroller.current.scrollTop = initialScroll;
    onSettled(entry.key);
  }, [settled, scroller, initialScroll, onSettled, entry.key]);

  function onLinkClick(e: MouseEvent<HTMLDivElement>) {
    const a = (e.target as Element).closest("a");
    if (!a) return;
    // The href is a bare address like "tidepool.zz". Left alone, the browser would resolve it
    // against OUR url and navigate the whole app away. We always take over.
    e.preventDefault();
    const href = a.getAttribute("href");
    if (href && ADDRESS_RE.test(href)) navigate(href, "link");
  }

  if (state.status === "loading") return <div className="page"><p className="muted">Loading…</p></div>;

  if (state.status === "nowhere") {
    return (
      <div className="page page--nowhere">
        <h1>Nowhere</h1>
        <p>
          There is no page at <code>{entry.value}</code>. The link may be old, mistyped, or may
          never have led anywhere at all.
        </p>
        <p className="muted">Back still works, and this visit is in your history.</p>
      </div>
    );
  }

  if (state.status === "error") {
    return (
      <div className="page">
        <h1>Something went wrong</h1>
        <p>{state.message}</p>
      </div>
    );
  }

  return (
    <div className="page">
      {/* our own chrome, kept outside the box that holds the stranger's markup */}
      <p className="byline">
        {state.site.address} · by {state.site.author.displayName}
      </p>
      <div
        className="site"
        onClick={onLinkClick}
        onAuxClick={(e) => {
          if ((e.target as Element).closest("a")) e.preventDefault(); // middle-click
        }}
        dangerouslySetInnerHTML={{ __html: clean }}
      />
    </div>
  );
}