import { describe, expect, it } from 'vitest';
import { buildPlan } from './plan.js';

describe('seed plan', () => {
  const plan = buildPlan();
  const published = new Set(plan.sites.map((s) => s.address));

  it('is deterministic: building twice gives identical output', () => {
    expect(JSON.stringify(buildPlan())).toBe(JSON.stringify(plan));
  });

  it('has roughly ten sites, a handful of users, and no duplicate addresses', () => {
    expect(plan.sites.length).toBeGreaterThanOrEqual(10);
    expect(plan.users.length).toBeGreaterThanOrEqual(5);
    expect(published.size).toBe(plan.sites.length);
  });

  it('has real prose on every page', () => {
    for (const s of plan.sites) expect(s.text.split(' ').length, s.address).toBeGreaterThan(80);
  });

  it('keeps every link through sanitization, as a bare address', () => {
    for (const s of plan.sites) {
      const hrefs = [...s.html.matchAll(/href="([^"]+)"/g)].map((m) => m[1]);
      expect(hrefs.length, s.address).toBeGreaterThan(1);
      for (const h of hrefs) expect(h).toMatch(/^[a-z0-9.-]+\.zz$/);
    }
  });

  it('links to addresses that never existed', () => {
    expect(plan.deadAddresses).toEqual(
      expect.arrayContaining(['nowhere.zz', 'lost-harbour.zz', 'the-last-payphone.zz', 'wind-tables.zz']),
    );
    for (const d of plan.deadAddresses) expect(published.has(d)).toBe(false);
  });

  it('has at least two authors with more than one site', () => {
    const counts = new Map<string, number>();
    for (const s of plan.sites) counts.set(s.authorHandle, (counts.get(s.authorHandle) ?? 0) + 1);
    expect([...counts.values()].filter((n) => n > 1).length).toBeGreaterThanOrEqual(2);
  });

  it('every page can be reached by wandering from start.zz', () => {
    const seen = new Set<string>(['start.zz']);
    const queue = ['start.zz'];
    while (queue.length) {
      const here = plan.sites.find((s) => s.address === queue.shift());
      if (!here) continue;
      for (const m of here.html.matchAll(/href="([^"]+)"/g)) {
        if (!seen.has(m[1])) {
          seen.add(m[1]);
          queue.push(m[1]);
        }
      }
    }
    for (const s of plan.sites) expect(seen.has(s.address), s.address).toBe(true);
  });

  describe('visits', () => {
    const anchor = Date.parse('2026-11-04T12:00:00.000Z');

    it('all fall inside the hour before the anchor', () => {
      for (const v of plan.visits) {
        expect(v.visitedAt.getTime()).toBeGreaterThanOrEqual(anchor - 60 * 60_000);
        expect(v.visitedAt.getTime()).toBeLessThanOrEqual(anchor);
      }
    });

    it('have unique seed keys and strictly increasing times within a trail', () => {
      expect(new Set(plan.visits.map((v) => v.seedKey)).size).toBe(plan.visits.length);
      const byUser = new Map<string, number>();
      for (const v of plan.visits) {
        const last = byUser.get(v.userHandle) ?? -Infinity;
        expect(v.visitedAt.getTime(), v.seedKey).toBeGreaterThan(last);
        byUser.set(v.userHandle, v.visitedAt.getTime());
      }
    });

    it('record nowhere for dead addresses and shown for real ones', () => {
      for (const v of plan.visits) {
        expect(v.outcome, `${v.seedKey} ${v.address}`).toBe(published.has(v.address) ? 'shown' : 'nowhere');
      }
    });

    it('include repeat visits, back/forward/history/search/publish, and a long trail', () => {
      const vias = new Set(plan.visits.map((v) => v.via));
      for (const via of ['typed', 'link', 'back', 'forward', 'history', 'search', 'publish']) {
        expect(vias.has(via as never), via).toBe(true);
      }
      const perUser = new Map<string, string[]>();
      for (const v of plan.visits) perUser.set(v.userHandle, [...(perUser.get(v.userHandle) ?? []), v.address]);
      expect(Math.max(...[...perUser.values()].map((a) => a.length))).toBeGreaterThanOrEqual(20);
      expect([...perUser.values()].some((a) => a.length !== new Set(a).size)).toBe(true);
    });

    it('has one person who has been to every site and every dead address', () => {
      const everywhere = new Set([...published, ...plan.deadAddresses]);
      const perUser = new Map<string, Set<string>>();
      for (const v of plan.visits) {
        perUser.set(v.userHandle, (perUser.get(v.userHandle) ?? new Set()).add(v.address));
      }
      expect([...perUser.values()].some((s) => [...everywhere].every((a) => s.has(a)))).toBe(true);
    });
  });
});
