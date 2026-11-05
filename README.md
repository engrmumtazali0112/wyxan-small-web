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
npm --prefix backend test
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

## API

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/api/users` | People for the name picker |
| GET | `/api/sites/:address` | The page at an address (404 "Nowhere" if none) |
| POST | `/api/sites` | Publish `{ address, title, html, authorId }` |
| GET | `/api/search?q=` | Full-text search across titles and page text |
| POST | `/api/visits` | Record `{ userId, address, via }` |
| GET | `/api/visits/:userId` | That person's history, newest first |