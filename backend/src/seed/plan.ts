import { isValidAddress, normalizeAddress } from '../common/address.js';
import { SanitizeService } from '../sanitize/sanitize.service.js';
import type { VisitVia } from '../visits/visit.schema.js';
import {
  SEED_ANCHOR_ISO,
  SEED_SITES,
  SEED_TRAILS,
  SEED_USERS,
  type SeedUser,
  type Step,
} from './data.js';

export interface PlannedSite {
  address: string;
  title: string;
  /** sanitized, exactly what a real publish would have stored */
  html: string;
  text: string;
  authorHandle: string;
}

export interface PlannedVisit {
  /** stable identity so re-seeding upserts instead of duplicating */
  seedKey: string;
  userHandle: string;
  address: string;
  via: VisitVia;
  outcome: 'shown' | 'nowhere';
  visitedAt: Date;
}

export interface SeedPlan {
  users: SeedUser[];
  sites: PlannedSite[];
  visits: PlannedVisit[];
  /** every address that is linked to but not published */
  deadAddresses: string[];
}

const HREF = /href="([^"]+)"/g;

function hrefsOf(html: string): string[] {
  return [...html.matchAll(HREF)].map((m) => normalizeAddress(m[1]));
}

// Small deterministic PRNG (mulberry32), seeded per user, so timing jitter never changes.
function hashString(s: string): number {
  let h = 2166136261;
  for (const ch of s) {
    h ^= ch.charCodeAt(0);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mulberry32(seed: number): () => number {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function parseStep(step: Step): { address: string; via?: VisitVia } {
  return typeof step === 'string'
    ? { address: normalizeAddress(step) }
    : { address: normalizeAddress(step[0]), via: step[1] };
}

export function buildPlan(): SeedPlan {
  const sanitizer = new SanitizeService();
  const handles = new Set(SEED_USERS.map((u) => u.handle));

  // 1. Sites go through the real containment policy, same as POST /api/sites.
  const sites: PlannedSite[] = SEED_SITES.map((s) => {
    const address = normalizeAddress(s.address);
    if (!isValidAddress(address)) throw new Error(`Seed site has an invalid address: ${address}`);
    if (!handles.has(s.author)) throw new Error(`Seed site ${address} has unknown author ${s.author}`);

    const title = sanitizer.title(s.title);
    const { html, text } = sanitizer.process(s.html);
    if (!title || !text) throw new Error(`Seed site ${address} is empty after sanitizing`);

    // If the policy ever drops a link we meant to ship, fail loudly instead of seeding a broken web.
    const before = hrefsOf(s.html);
    const after = hrefsOf(html);
    if (before.length !== after.length) {
      throw new Error(`Sanitizer changed the links on ${address}: ${before.length} -> ${after.length}`);
    }

    return { address, title, html, text, authorHandle: s.author };
  });

  const published = new Set(sites.map((s) => s.address));
  if (published.size !== sites.length) throw new Error('Duplicate address in seed sites');

  // 2. The link graph, taken from the sanitized pages: what a reader can actually click.
  const links = new Map<string, Set<string>>(sites.map((s) => [s.address, new Set(hrefsOf(s.html))]));
  const deadAddresses = [...new Set([...links.values()].flatMap((set) => [...set]))]
    .filter((a) => !published.has(a))
    .sort();

  // 3. Visits: deterministic times inside the hour before the anchor.
  const anchor = Date.parse(SEED_ANCHOR_ISO);
  const visits: PlannedVisit[] = [];

  for (const trail of SEED_TRAILS) {
    if (!handles.has(trail.user)) throw new Error(`Trail for unknown user ${trail.user}`);

    const start = anchor - trail.fromMinutesAgo * 60_000;
    const end = anchor - trail.toMinutesAgo * 60_000;
    const n = trail.steps.length;
    const gap = n > 1 ? (end - start) / (n - 1) : 0;
    const rand = mulberry32(hashString(trail.user));

    trail.steps.forEach((raw, i) => {
      const { address, via: explicit } = parseStep(raw);
      if (!isValidAddress(address)) throw new Error(`Trail ${trail.user} step ${i}: bad address ${address}`);

      const prev = i > 0 ? parseStep(trail.steps[i - 1]).address : undefined;
      const via: VisitVia = explicit ?? (prev && links.get(prev)?.has(address) ? 'link' : 'typed');

      // +/- 30% of the gap, never enough to reorder two steps; ends stay put.
      const jitter = i === 0 || i === n - 1 ? 0 : (rand() - 0.5) * gap * 0.6;
      const at = Math.round((start + i * gap + jitter) / 1000) * 1000;

      visits.push({
        seedKey: `${trail.user}:${String(i).padStart(3, '0')}`,
        userHandle: trail.user,
        address,
        via,
        outcome: published.has(address) ? 'shown' : 'nowhere',
        visitedAt: new Date(at),
      });
    });
  }

  return { users: SEED_USERS, sites, visits, deadAddresses };
}
