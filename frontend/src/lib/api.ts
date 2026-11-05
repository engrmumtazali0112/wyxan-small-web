export const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";

export type Via =
  | "typed" | "link" | "back" | "forward" | "history" | "search" | "publish";

export interface User {
  id: string;
  handle: string;
  displayName: string;
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
  constructor(public status: number, message: string) {
    super(message);
  }
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  // Only send Content-Type when there is a body: keeps GETs "simple" (no CORS preflight).
  const headers = init.body ? { "Content-Type": "application/json" } : undefined;
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: { ...headers, ...init.headers },
    cache: "no-store",
  });
  if (!res.ok) throw new ApiError(res.status, await res.text());
  return (await res.json()) as T;
}

export const getUsers = () => request<User[]>("/users");

export const getHistory = (userId: string, signal?: AbortSignal) =>
  request<Visit[]>(`/visits/${encodeURIComponent(userId)}?limit=200`, { signal });

export const recordVisit = (userId: string, address: string, via: Via) =>
  request<Visit>("/visits", {
    method: "POST",
    body: JSON.stringify({ userId, address, via }),
  });