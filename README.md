# The Small Web

A tiny web and the browser you read it in. Sites live in MongoDB; the browser (address bar, links, back/forward, history, search, publish) is a Next.js app talking to a NestJS API.

**Stack:** Next.js · NestJS · MongoDB (Mongoose) · TypeScript

```
backend/    NestJS API        http://localhost:4000/api
frontend/   Next.js browser   http://localhost:3000
```

## Requirements

- Node.js 20 or newer
- A MongoDB database: local (`mongodb://127.0.0.1:27017/small-web`) or a MongoDB Atlas connection string

## 1. Install

```bash
npm run install:all
```

## 2. Configure

Create `backend/.env`:

```bash
MONGODB_URI=mongodb://127.0.0.1:27017/small-web
PORT=4000
WEB_ORIGIN=http://localhost:3000
```

Create `frontend/.env.local`:

```bash
NEXT_PUBLIC_API_URL=http://localhost:4000/api
```

(`.env.example` at the root lists the same variables. PowerShell: `Copy-Item .env.example backend/.env`; macOS/Linux: `cp .env.example backend/.env`.)

## 3. Seed

```bash
npm --prefix backend run seed
```

Creates 6 people, 11 sites and about an hour of browsing history. It is deterministic and idempotent: running it again changes nothing.

## 4. Run

Two terminals, from the repository root:

```bash
npm run dev:api     # API on :4000
npm run dev:web     # browser on :3000
```

Open <http://localhost:3000>, pick a name, and type `start.zz` in the address bar.

## Tests

```bash
npm --prefix backend test     # API: sanitizer, seed plan, services
npm --prefix frontend test    # browser: back / forward / scroll-restore / per-person history
```

## Production build

```bash
npm --prefix backend run build && npm --prefix backend run start:prod
npm --prefix frontend run build && npm --prefix frontend run start
```

## Seed data at a glance

- Front door: `start.zz`
- People: Wren Alder, Marlow Quinn, Ines Duarte, Tobias Reyes, Priya Nair, Oskar Lindqvist
- Several authors have more than one site (for example Marlow: `tidepool.zz`, `saltmarsh.zz`)
- Links that lead nowhere: `nowhere.zz`, `lost-harbour.zz`, `the-last-payphone.zz`, `wind-tables.zz`
- Wren has been to nearly every page; the seeded history ends at 2026-11-04 12:00 UTC
- A four-deep trail to walk: `tidepool.zz` → `saltmarsh.zz` → `heron-hours.zz` → `night-bus.zz` → `the-last-payphone.zz` (dead end)

## Architecture (short)

- **Model.** A `Site` is identified by its address (unique; an edit replaces the page). A `Visit` is an append-only fact: person, address, how they arrived (`typed`, `link`, `back`, `forward`, `history`, `search`, `publish`). History is derived from visits, and the server, not the client, decides whether a visit was `shown` or `nowhere`.
- **Back and forward.** Each person has a client-side stack of entries (Zustand, kept in `sessionStorage`). Navigating anywhere new drops everything ahead of the current entry, so forward is lost exactly as in a real browser. Back and forward only move an index. The scroll position is stamped onto an entry the moment it is left, and restored once its content has rendered. Search results are an entry too, so Back from a result returns to the results.
- **Untrusted HTML.** Allowlist sanitising twice: on the server before anything is stored (`backend/src/sanitize/sanitize.policy.ts`) and again with DOMPurify immediately before render (`frontend/src/lib/sanitize.ts`). No scripts, frames, forms, images, `class` or `id`; inline style is limited to colour, alignment and weight; a link survives only if it is a bare address like `tidepool.zz`, and every click on one is intercepted by the browser shell. The page is rendered inside a CSS-contained box. Cost to authors: plain, readable pages only.
- **Search.** MongoDB text index over title (weighted 10x) and the page's plain text.
- **Left out on purpose:** accounts, tabs, bookmarks, images and assets, caching (going back re-fetches, so you see the current page).

## API

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/api/users` | People for the name picker |
| GET | `/api/sites/:address` | The page at an address (404 "Nowhere" if none) |
| POST | `/api/sites` | Publish `{ address, title, html, authorId }` |
| GET | `/api/search?q=` | Full-text search across titles and page text |
| POST | `/api/visits` | Record `{ userId, address, via }` |
| GET | `/api/visits/:userId` | That person's history, newest first |