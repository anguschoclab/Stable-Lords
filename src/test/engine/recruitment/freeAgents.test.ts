/**
 * Free-agent lifecycle (megaplan Phase 3): displaced veterans are priced by
 * `computeFreeAgentCost`, carry a bounded shelf life, and surface to the
 * player's recruit list alongside the orphanage pool.
 */
import { describe, it, expect } from 'vitest';
import {
  computeFreeAgentCost,
  warriorToPoolWarrior,
  partitionAgedFreeAgents,
} from '@/engine/recruitment/recruitment';
import { runRecruitmentPass } from '@/engine/pipeline/passes/RecruitmentPass';
import { SeededRNG } from '@/utils/random';
import {
  makeWarrior,
  makePoolWarrior,
  makeGameState,
  makeRival,
} from '@/test/_fixtures/factories';
import { FREE_AGENT_SHELF_WEEKS } from '@/constants/world';
import { isActive } from '@/engine/warrior/warriorStatus';
import type { StableId } from '@/types/shared.types';

describe('computeFreeAgentCost', () => {
  it('prices veterans by fame within the 50–500 band', () => {
    const nobody = makeWarrior({ fame: 0 });
    const veteran = makeWarrior({ fame: 30 });
    const legend = makeWarrior({ fame: 200 });

    expect(computeFreeAgentCost(nobody)).toBe(50); // floor
    expect(computeFreeAgentCost(veteran)).toBeGreaterThan(50);
    expect(computeFreeAgentCost(legend)).toBe(500); // ceiling
  });

  it('flaw-loaded veterans cost less than clean ones at equal fame', () => {
    const clean = makeWarrior({ fame: 40, traits: [] });
    const flawed = makeWarrior({ fame: 40, traits: ['glass_jaw', 'brittle', 'frail'] });
    expect(computeFreeAgentCost(flawed)).toBeLessThan(computeFreeAgentCost(clean));
  });
});

describe('warriorToPoolWarrior', () => {
  it('uses computeFreeAgentCost and stamps a bounded shelf life', () => {
    const w = makeWarrior({ fame: 35, career: { wins: 12, losses: 5, kills: 0 } });
    const pool = warriorToPoolWarrior(w, 10, new SeededRNG(1));

    expect(pool.cost).toBe(computeFreeAgentCost(w));
    expect(pool.shelfWeeksRemaining).toBe(FREE_AGENT_SHELF_WEEKS);
    expect(pool.source).toBe('freeAgent');
    expect(pool.id).toBe(w.id); // veterans keep their identity
  });

  it('stamps source=released when asked (player-initiated release)', () => {
    const w = makeWarrior({ fame: 35 });
    const pool = warriorToPoolWarrior(w, 10, new SeededRNG(1), 'released');
    expect(pool.source).toBe('released');
    expect(pool.id).toBe(w.id);
  });
});

describe('partitionAgedFreeAgents', () => {
  it('ticks the countdown and splits survivors from expired entries', () => {
    const fresh = makePoolWarrior({ id: 'fresh-fa', shelfWeeksRemaining: 3 });
    const expiring = makePoolWarrior({ id: 'expiring-fa', shelfWeeksRemaining: 1 });
    const { surviving, expired } = partitionAgedFreeAgents([fresh, expiring], new Set());

    expect(surviving.map((w) => w.id)).toEqual(['fresh-fa']);
    expect(surviving[0]!.shelfWeeksRemaining).toBe(2);
    expect(expired.map((w) => w.id)).toEqual(['expiring-fa']);
  });

  it('drops dead ids from both buckets', () => {
    const fresh = makePoolWarrior({ id: 'fresh-fa', shelfWeeksRemaining: 3 });
    const expiring = makePoolWarrior({ id: 'expiring-fa', shelfWeeksRemaining: 1 });
    const { surviving, expired } = partitionAgedFreeAgents(
      [fresh, expiring],
      new Set(['fresh-fa', 'expiring-fa'])
    );
    expect(surviving).toHaveLength(0);
    expect(expired).toHaveLength(0);
  });

  it('treats entries with no countdown as already expired', () => {
    const noCountdown = makePoolWarrior({ id: 'stale-fa', shelfWeeksRemaining: undefined });
    const { surviving, expired } = partitionAgedFreeAgents([noCountdown], new Set());
    expect(surviving).toHaveLength(0);
    expect(expired.map((w) => w.id)).toEqual(['stale-fa']);
  });
});

describe('free-agent shelf expiry', () => {
  it('expired entries leave the shelf through an honored retirement when nobody signs them', () => {
    const fresh = makePoolWarrior({
      id: 'fresh-fa',
      source: 'freeAgent',
      shelfWeeksRemaining: 3,
    });
    const expiring = makePoolWarrior({
      id: 'expiring-fa',
      source: 'freeAgent',
      shelfWeeksRemaining: 1,
    });
    const state = makeGameState({ freeAgents: [fresh, expiring], rivals: [] });

    const impact = runRecruitmentPass(state, new SeededRNG(7));
    const next = impact.freeAgents ?? [];

    expect(next.find((w) => w.id === 'fresh-fa')?.shelfWeeksRemaining).toBe(2);
    expect(next.some((w) => w.id === 'expiring-fa')).toBe(false);
    // Non-veteran fixtures re-mint their id on conversion, so assert the
    // honored exit by shape rather than by identity.
    expect(impact.retired).toHaveLength(1);
    expect((impact.retired ?? []).every((w) => !isActive(w))).toBe(true);
  });

  it('runs clearance before retirement: a needy affordable rival signs the expiring veteran', () => {
    const expiringVet = makePoolWarrior({
      id: 'vet-1',
      source: 'freeAgent',
      cost: 200,
      shelfWeeksRemaining: 1,
      veteran: {
        fame: 60,
        popularity: 20,
        career: { wins: 5, losses: 2, kills: 0 },
        titles: [],
      },
    });
    const needyRival = makeRival({
      id: 'r-needy' as StableId,
      roster: [],
      treasury: 5000,
      needsRecruit: true,
    });
    const state = makeGameState({ freeAgents: [expiringVet], rivals: [needyRival] });

    const impact = runRecruitmentPass(state, new SeededRNG(7));

    // Clearance price: max(25, floor(200 * 0.5)) = 100.
    const upd = impact.rivalsUpdates?.get('r-needy' as StableId);
    expect(upd?.roster?.some((w) => w.id === 'vet-1')).toBe(true);
    expect(upd?.treasury).toBe(5000 - 100);
    expect(upd?.needsRecruit).toBe(false);
    expect(impact.freeAgents?.some((w) => w.id === 'vet-1')).toBe(false);
    expect(impact.newsletterItems?.some((n) => n.items.some((i) => i.includes('CLEARANCE')))).toBe(
      true
    );
    expect(impact.retired ?? []).toHaveLength(0);
  });

  it('retires expired veterans when no needy rival can afford the clearance fee', () => {
    const expiringVet = makePoolWarrior({
      id: 'vet-broke',
      source: 'freeAgent',
      cost: 500,
      shelfWeeksRemaining: 1,
      veteran: {
        fame: 60,
        popularity: 20,
        career: { wins: 5, losses: 2, kills: 0 },
        titles: [],
      },
    });
    const brokeRival = makeRival({ id: 'r-broke' as StableId, roster: [], treasury: 10, needsRecruit: true });
    const state = makeGameState({ freeAgents: [expiringVet], rivals: [brokeRival] });

    const impact = runRecruitmentPass(state, new SeededRNG(7));

    expect(
      impact.rivalsUpdates?.get('r-broke' as StableId)?.roster?.some(
        (w) => w.id === 'vet-broke'
      ) ?? false
    ).toBe(false);
    expect(impact.retired?.some((w) => w.id === 'vet-broke')).toBe(true);
    expect(impact.freeAgents?.some((w) => w.id === 'vet-broke')).toBe(false);
  });

  it('drops expired entries whose ids are registered dead — no clearance, no retirement', () => {
    const expiringVet = makePoolWarrior({
      id: 'dead-fa',
      source: 'freeAgent',
      shelfWeeksRemaining: 1,
      veteran: {
        fame: 60,
        popularity: 20,
        career: { wins: 5, losses: 2, kills: 0 },
        titles: [],
      },
    });
    const needyRival = makeRival({ id: 'r-needy' as StableId, roster: [], treasury: 5000, needsRecruit: true });
    const state = makeGameState({
      freeAgents: [expiringVet],
      rivals: [needyRival],
      deadWarriorIds: ['dead-fa' as never],
    });

    const impact = runRecruitmentPass(state, new SeededRNG(7));

    expect(impact.rivalsUpdates?.get('r-needy' as StableId)?.roster ?? []).toHaveLength(0);
    expect(impact.retired ?? []).toHaveLength(0);
    expect(impact.freeAgents?.some((w) => w.id === 'dead-fa')).toBe(false);
  });
});
