import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { recordVisit, type Via } from "@/lib/api";

export interface Entry {
  key: string; // unique per entry; changing it forces the viewer to reload
  kind: "page" | "search";
  value: string; // an address, or a search query
  scrollY: number; // where the reader was when they left this entry
}

interface Session {
  entries: Entry[];
  index: number; // -1 = nothing opened yet
}

const EMPTY: Session = { entries: [], index: -1 };

/* ── scroll: the viewport registers a reader; the store calls it on every exit ── */
let readScroll: () => number = () => 0;
export function registerScrollReader(fn: () => number) {
  readScroll = fn;
  return () => {
    if (readScroll === fn) readScroll = () => 0;
  };
}

const newKey = () =>
  `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

/** Stamp the current scroll onto the entry being left. */
function leave(s: Session): Entry[] {
  return s.entries.map((e, i) => (i === s.index ? { ...e, scrollY: readScroll() } : e));
}

/** A fresh navigation: everything ahead of the current entry is dropped. */
function push(s: Session, entry: Entry): Session {
  const kept = leave(s).slice(0, s.index + 1);
  return { entries: [...kept, entry], index: kept.length };
}

interface BrowserState {
  userId: string | null;
  sessions: Record<string, Session>; // one stack per person
  historyVersion: number; // bumped after each recorded visit so the sidebar refetches

  selectUser: (id: string | null) => void;
  navigate: (address: string, via?: Via) => void;
  search: (query: string) => void;
  back: () => void;
  forward: () => void;
}

export const useBrowser = create<BrowserState>()(
  persist(
    (set, get) => {
      const write = (userId: string, session: Session) =>
        set((s) => ({ sessions: { ...s.sessions, [userId]: session } }));

      const record = (userId: string, address: string, via: Via) => {
        recordVisit(userId, address, via)
          .then(() => set((s) => ({ historyVersion: s.historyVersion + 1 })))
          .catch(() => {
            /* history is a record, not a gate: failing to log never blocks reading */
          });
      };

      const move = (delta: -1 | 1, via: "back" | "forward") => {
        const { userId, sessions } = get();
        if (!userId) return;
        const s = sessions[userId] ?? EMPTY;
        const target = s.index + delta;
        if (target < 0 || target >= s.entries.length) return;

        write(userId, { entries: leave(s), index: target }); // no truncation: forward survives a Back
        const to = s.entries[target];
        if (to.kind === "page") record(userId, to.value, via);
      };

      return {
        userId: null,
        sessions: {},
        historyVersion: 0,

        selectUser(id) {
          const { userId, sessions } = get();
          const next = { ...sessions };
          if (userId && sessions[userId]) {
            next[userId] = { ...sessions[userId], entries: leave(sessions[userId]) };
          }
          set({ userId: id, sessions: next });
        },

        navigate(address, via = "typed") {
          const value = address.trim().toLowerCase();
          const { userId, sessions } = get();
          if (!value || !userId) return;

          const s = sessions[userId] ?? EMPTY;
          const cur = s.entries[s.index];
          const samePage = cur?.kind === "page" && cur.value === value;
          if (samePage && via !== "publish") return; // already here: not a new visit

          const entry: Entry = { key: newKey(), kind: "page", value, scrollY: 0 };
          if (samePage) {
            // re-publishing the page you are looking at: replace it in place
            write(userId, {
              index: s.index,
              entries: s.entries.map((e, i) => (i === s.index ? entry : e)),
            });
          } else {
            write(userId, push(s, entry));
          }
          record(userId, value, via);
        },

        search(query) {
          const value = query.trim();
          const { userId, sessions } = get();
          if (!value || !userId) return;

          const s = sessions[userId] ?? EMPTY;
          const cur = s.entries[s.index];
          if (cur?.kind === "search" && cur.value === value) return;

          // A search is a place in the stack (so Back can return to it), but not a visit.
          write(userId, push(s, { key: newKey(), kind: "search", value, scrollY: 0 }));
        },

        back: () => move(-1, "back"),
        forward: () => move(1, "forward"),
      };
    },
    {
      name: "small-web-browser",
      version: 1,
      storage: createJSONStorage(() => sessionStorage), // each tab is its own browsing session
      skipHydration: true, // rehydrated manually after mount: avoids SSR hydration mismatch
      partialize: (s) => ({ userId: s.userId, sessions: s.sessions }),
    },
  ),
);

/* ── selectors ── */
const session = (s: BrowserState) => (s.userId ? s.sessions[s.userId] : undefined);

export const useCurrent = () =>
  useBrowser((s) => {
    const ses = session(s);
    return ses ? (ses.entries[ses.index] ?? null) : null;
  });

export const useCanBack = () => useBrowser((s) => (session(s)?.index ?? -1) > 0);

export const useCanForward = () =>
  useBrowser((s) => {
    const ses = session(s);
    return ses ? ses.index < ses.entries.length - 1 : false;
  });

export const displayAddress = (e: Entry | null) =>
  !e ? "" : e.kind === "search" ? `search: ${e.value}` : e.value;