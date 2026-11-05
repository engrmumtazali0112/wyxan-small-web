"use client";

import { useEffect, useState } from "react";
import { getUsers, type User } from "@/lib/api";
import {
  displayAddress,
  useBrowser,
  useCanBack,
  useCanForward,
  useCurrent,
} from "@/store/browser";
import HistorySidebar from "./HistorySidebar";
import PublishDialog from "./PublishDialog";
import Viewport from "./Viewport";

export default function BrowserShell() {
  const [ready, setReady] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [publishing, setPublishing] = useState(false);

  const userId = useBrowser((s) => s.userId);
  const selectUser = useBrowser((s) => s.selectUser);
  const back = useBrowser((s) => s.back);
  const forward = useBrowser((s) => s.forward);
  const canBack = useCanBack();
  const canForward = useCanForward();

  useEffect(() => {
    let alive = true;
    (async () => {
      await useBrowser.persist.rehydrate();
      try {
        const list = await getUsers();
        if (!alive) return;
        setUsers(list);
        const saved = useBrowser.getState().userId;
        if (saved && !list.some((u) => u.id === saved)) useBrowser.getState().selectUser(null);
      } catch {
        if (alive) setError("Cannot reach the API. Is `npm run dev:api` running?");
      }
      if (alive) setReady(true);
    })();
    return () => {
      alive = false;
    };
  }, []);

  const who = users.find((u) => u.id === userId);

  return (
    <div className="shell">
      <header className="titlebar">
        <span>◈ The Small Web</span>
        <span className="titlebar__sub">a reader for the .zz</span>
      </header>

      <div className="toolbar">
        <button className="btn" onClick={back} disabled={!canBack} title="Back">
          ◀ Back
        </button>
        <button className="btn" onClick={forward} disabled={!canForward} title="Forward">
          Forward ▶
        </button>

        <AddressBar disabled={!userId} />
        <SearchBar disabled={!userId} />

        <button className="btn" onClick={() => setPublishing(true)} disabled={!userId}>
          Publish
        </button>

        <label className="picker">
          <span>Browsing as</span>
          <select
            value={userId ?? ""}
            onChange={(e) => selectUser(e.target.value || null)}
            disabled={!ready || users.length === 0}
          >
            <option value="">— pick a name —</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.displayName}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="body">
        <Viewport ready={ready} hasUser={!!userId} error={error} />
        <HistorySidebar />
      </div>

      <footer className="statusbar">{who ? `@${who.handle}` : "nobody is browsing"}</footer>

      {publishing && who && (
        <PublishDialog userId={who.id} authorName={who.displayName} onClose={() => setPublishing(false)} />
      )}
    </div>
  );
}

function AddressBar({ disabled }: { disabled: boolean }) {
  const current = useCurrent();
  const navigate = useBrowser((s) => s.navigate);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const shown = displayAddress(current);

  return (
    <form
      className="address"
      onSubmit={(e) => {
        e.preventDefault();
        navigate(draft, "typed");
        setEditing(false);
        (document.activeElement as HTMLElement | null)?.blur();
      }}
    >
      <span className="address__label">Address</span>
      <input
        type="text"
        spellCheck={false}
        autoComplete="off"
        autoCapitalize="off"
        placeholder={disabled ? "pick a name first" : "tidepool.zz"}
        disabled={disabled}
        value={editing ? draft : shown}
        onFocus={(e) => {
          setDraft(shown);
          setEditing(true);
          e.currentTarget.select();
        }}
        onBlur={() => setEditing(false)}
        onChange={(e) => setDraft(e.target.value)}
      />
      <button className="btn" type="submit" disabled={disabled}>
        Go
      </button>
    </form>
  );
}

function SearchBar({ disabled }: { disabled: boolean }) {
  const current = useCurrent();
  const search = useBrowser((s) => s.search);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const shown = current?.kind === "search" ? current.value : "";

  return (
    <form
      className="searchbar"
      role="search"
      onSubmit={(e) => {
        e.preventDefault();
        search(draft);
        setEditing(false);
        (document.activeElement as HTMLElement | null)?.blur();
      }}
    >
      <input
        type="search"
        placeholder="search every page"
        disabled={disabled}
        value={editing ? draft : shown}
        onFocus={() => {
          setDraft(shown);
          setEditing(true);
        }}
        onBlur={() => setEditing(false)}
        onChange={(e) => setDraft(e.target.value)}
      />
      <button className="btn" type="submit" disabled={disabled}>
        Search
      </button>
    </form>
  );
}