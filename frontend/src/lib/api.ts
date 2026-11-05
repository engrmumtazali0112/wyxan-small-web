export const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";

export type Via =
  | "typed" | "link" | "back" | "forward" | "history" | "search" | "publish";

export interface User {
  id: string;
  handle: string;
  displayName: string;
}

export interface Site {
  address: string;
  title: string;
  html: string;
  author: User;
  updatedAt?: string;
}

export interface PublishResult extends Site {
  replaced: boolean;
}

export interface SearchHit {
  address: string;
  title: string;
  snippet: string;
  score: number;
}

export interface Visit {
  id: string;
  address: string;
  title: string | null; // null = nowhere
  via: Via;
  outcome: "shown" | "nowhere";
  visitedAt: string;
}

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

/** "Nowhere": a normal outcome of browsing, not a failure. */
export class NowhereError extends Error {
  address: string;
  constructor(address: string) {
    super("No such address");
    this.address = address;
  }
}

async function failure(res: Response): Promise<ApiError> {
  let message = res.statusText || `HTTP ${res.status}`;
  try {
    const body = await res.json();
    const m = body?.message;
    message = Array.isArray(m) ? m.join("; ") : (m ?? message);
  } catch {
    /* body was not JSON */
  }
  return new ApiError(res.status, message);
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  // Only send Content-Type when there is a body: keeps GETs "simple" (no CORS preflight).
  const headers = init.body ? { "Content-Type": "application/json" } : undefined;
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: { ...headers, ...init.headers },
    cache: "no-store",
  });
  if (!res.ok) throw await failure(res);
  return (await res.json()) as T;
}

export const getUsers = () => request<User[]>("/users");

export async function getSite(address: string, signal?: AbortSignal): Promise<Site> {
  const res = await fetch(`${API_URL}/sites/${encodeURIComponent(address)}`, {
    signal,
    cache: "no-store",
  });
  if (res.status === 404) throw new NowhereError(address);
  if (!res.ok) throw await failure(res);
  return (await res.json()) as Site;
}

export const searchSites = (q: string, signal?: AbortSignal) =>
  request<SearchHit[]>(`/search?q=${encodeURIComponent(q)}`, { signal });

export const publishSite = (input: {
  address: string;
  title: string;
  html: string;
  authorId: string;
}) => request<PublishResult>("/sites", { method: "POST", body: JSON.stringify(input) });

export const getHistory = (userId: string, signal?: AbortSignal) =>
  request<Visit[]>(`/visits/${encodeURIComponent(userId)}?limit=200`, { signal });

export const recordVisit = (userId: string, address: string, via: Via) =>
  request<Visit>("/visits", {
    method: "POST",
    body: JSON.stringify({ userId, address, via }),
  });