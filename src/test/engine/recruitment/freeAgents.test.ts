/**
 * Free-agent lifecycle (megaplan Phase 3): displaced veterans are priced by
 * `computeFreeAgentCost`, carry a bounded shelf life, and surface to the
 * player's recruit list alongside the orphanage pool.
 */
import { describe, it, expect } from 'vitest';
import { computeFreeAgentCost, warriorToPoolWarrior } from '@/engine/recruitment/recruitment';
import { runRecruitmentPass } from '@/engine/pipeline/passes/RecruitmentPass';
import { SeededRNGService } from '@/utils/random';
import { makeWarrior, makePoolWarrior, makeGameState } from '@/test/_fixtures/factories';
import { FREE_AGENT_SHELF_WEEKS } from '@/constants/world';

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
    const pool = warriorToPoolWarrior(w, 10, new SeededRNGService(1));

    expect(pool.cost).toBe(computeFreeAgentCost(w));
    expect(pool.shelfWeeksRemaining).toBe(FREE_AGENT_SHELF_WEEKS);
    expect(pool.source).toBe('freeAgent');
    expect(pool.id).toBe(w.id); // veterans keep their identity
  });
});

describe('free-agent shelf expiry', () => {
  it('recruitment pass ticks shelfWeeksRemaining down and drops expired veterans', () => {
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
    const state = makeGameState({ freeAgents: [fresh, expiring] });

    const impact = runRecruitmentPass(state, new SeededRNGService(7));
    const next = impact.freeAgents ?? [];

    expect(next.find((w) => w.id === 'fresh-fa')?.shelfWeeksRemaining).toBe(2);
    expect(next.some((w) => w.id === 'expiring-fa')).toBe(false);
  });
});
