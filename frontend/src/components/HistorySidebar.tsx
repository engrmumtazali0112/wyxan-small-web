"use client";

import { useEffect, useState } from "react";
import { getHistory, type Visit } from "@/lib/api";
import { useBrowser, useCurrent } from "@/store/browser";

export default function HistorySidebar() {
  const userId = useBrowser((s) => s.userId);
  const version = useBrowser((s) => s.historyVersion);
  const navigate = useBrowser((s) => s.navigate);
  const current = useCurrent();

  // Keep the owner with the rows, so one person's history is never shown under another's name.
  const [loaded, setLoaded] = useState<{ userId: string; rows: Visit[] } | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!userId) return;
    const ctrl = new AbortController();
    getHistory(userId, ctrl.signal)
      .then((rows) => {
        setLoaded({ userId, rows });
        setFailed(false);
      })
      .catch((e) => {
        if (e?.name !== "AbortError") setFailed(true);
      });
    return () => ctrl.abort();
  }, [userId, version]);

  const rows = loaded && loaded.userId === userId ? loaded.rows : null;
  const here = current?.kind === "page" ? current.value : null;

  return (
    <aside className="history" aria-label="History">
      <h2>History</h2>
      {!userId && <p className="history__note">Pick a name to see where they have been.</p>}
      {userId && failed && <p className="history__note">Could not load history.</p>}
      {userId && !rows && !failed && <p className="history__note">Loading…</p>}
      {rows && rows.length === 0 && <p className="history__note">Nothing yet.</p>}

      <ol className="history__list">
        {rows?.map((v) => (
          <li key={v.id}>
            <button
              className={`history__row${v.address === here ? " is-here" : ""}${
                v.outcome === "nowhere" ? " is-nowhere" : ""
              }`}
              onClick={() => navigate(v.address, "history")}
            >
              <span className="history__title">
                {v.title ?? "Nowhere"}
              </span>
              <span className="history__addr">{v.address}</span>
              <span className="history__meta">
                {new Date(v.visitedAt).toLocaleString([], {
                  month: "short",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}{" "}
                · {v.via}
              </span>
            </button>
          </li>
        ))}
      </ol>
    </aside>
  );
}