/**
 * Rival post-bout state — characterization of the impact pipeline.
 *
 * Weekly (non-tournament) bouts once dropped ALL rival-side post-bout state:
 * every handler wrote whole-roster `rivalsUpdates` arrays that were clobbered
 * by a later full-roster rebuild, and `rivalStableId` only covered the D-side
 * stable. These tests pin the repaired contract: per-warrior patches and
 * append-only removals routed by warrior ownership, composable across bouts.
 */
import { describe, it, expect } from 'vitest';
import { handleDeath } from '@/engine/bout/mortalityHandler';
import { applyRecords } from '@/engine/bout/recordHandler';
import { handleInjuries } from '@/engine/bout/injuryHandler';
import { handleProgressions } from '@/engine/bout/progressionHandler';
import { mergeImpacts, resolveImpacts } from '@/engine/impacts';
import { makeGameState, makeKillOutcome, makeRival, makeWarrior } from '@/test/_fixtures/factories';
import type { GameState, RivalStableData } from '@/types/state.types';
import type { Warrior } from '@/types/warrior.types';
import type { FightOutcome } from '@/types/combat.types';
import type { WarriorId, StableId } from '@/types/shared.types';
import { SeededRNGService } from '@/utils/random';

const warrior = (id: string, stableId: string, extra: Partial<Warrior> = {}): Warrior =>
  makeWarrior({
    id: id as WarriorId,
    stableId: stableId as StableId,
    fame: 0,
    xp: 0,
    seasonPoints: 0,
    ...extra,
  });

const rival = (id: string, roster: Warrior[]): RivalStableData =>
  makeRival({ id: id as StableId, roster, treasury: 0 });

const makeState = (rivals: RivalStableData[], roster: Warrior[] = []): GameState =>
  makeGameState({
    week: 7,
    absoluteWeek: 7,
    roster,
    rivals,
    graveyard: [],
    boutOffers: {},
  });

const killOutcome = (winner: 'A' | 'D'): FightOutcome => makeKillOutcome({ winner, minutes: 5 });

const winOutcome = (winner: 'A' | 'D'): FightOutcome =>
  makeKillOutcome({ winner, by: 'Decision', minutes: 15, exchangeLog: [], post: undefined });

describe('rival post-bout state — impact composition', () => {
  it('rival-vs-rival Kill removes a D-side victim from its own roster', () => {
    const victim = warrior('rd', 's2');
    const killer = warrior('ra', 's1');
    const s = makeState([rival('s1', [killer]), rival('s2', [victim])]);

    const res = handleDeath(s, killer, victim, killOutcome('A'), 7, [], 's2');
    expect(res.death).toBe(true);
    expect(res.impact.rivalRosterRemovals).toEqual(['rd']);

    const out = resolveImpacts(s, [res.impact]);
    expect(out.rivals[1]!.roster.map((w) => w.id)).toEqual([]);
    expect(out.graveyard.map((w) => w.id)).toContain('rd');
  });

  it('rival-vs-rival Kill removes an A-side victim from its own roster', () => {
    const victim = warrior('ra', 's1');
    const killer = warrior('rd', 's2');
    const s = makeState([rival('s1', [victim]), rival('s2', [killer])]);

    const res = handleDeath(s, victim, killer, killOutcome('D'), 7, [], 's2');
    expect(res.death).toBe(true);
    expect(res.impact.rivalRosterRemovals).toEqual(['ra']);

    const out = resolveImpacts(s, [res.impact]);
    expect(out.rivals[0]!.roster).toHaveLength(0);
    expect(out.rivals[1]!.roster).toHaveLength(1);
    expect(out.graveyard.map((w) => w.id)).toContain('ra');
  });

  it('an AI-vs-AI death grants the player no fame or "Fame Gained" newsletter', () => {
    const victim = warrior('ra', 's1');
    const killer = warrior('rd', 's2');
    const s = makeState([rival('s1', [victim]), rival('s2', [killer])]);

    const res = handleDeath(s, victim, killer, killOutcome('D'), 7, [], 's2');

    expect(res.playerDeath).toBe(false);
    expect(res.impact.fameDelta ?? 0).toBe(0);
    expect(res.impact.newsletterItems?.some((n) => n.title === 'Fame Gained')).toBe(false);
  });

  it('a player warrior dying on the D side still flags playerDeath', () => {
    const playerVictim = warrior('pd', 'player-1');
    const killer = warrior('ra', 's1');
    // D-side challenger is the player; rivalStableId stays undefined because
    // the pairing layer only resolves the opponent's rival stable.
    const s = makeState([rival('s1', [killer])], [playerVictim]);

    const res = handleDeath(s, killer, playerVictim, killOutcome('A'), 7, []);

    expect(res.playerDeath).toBe(true);
    expect(res.impact.fameDelta).toBe(5);
    expect(res.impact.rosterUpdates?.get('pd' as WarriorId)).toMatchObject({
      status: 'Dead',
    });
  });

  it('rival bout records land: career, fame, fatigue, seasonPoints on both sides', () => {
    const wA = warrior('ra', 's1');
    const wD = warrior('rd', 's2');
    const s = makeState([rival('s1', [wA]), rival('s2', [wD])]);

    const impact = applyRecords(s, wA, wD, winOutcome('A'), [], 4, 0, 2, 0, 's2');
    const out = resolveImpacts(s, [impact]);

    const a = out.rivals[0]!.roster.find((w) => w.id === 'ra')!;
    const d = out.rivals[1]!.roster.find((w) => w.id === 'rd')!;
    expect(a.career.wins).toBe(1);
    expect(d.career.losses).toBe(1);
    expect(a.fame).toBe(4);
    expect(a.fatigue).toBe(25);
    expect(d.fatigue).toBe(25);
    expect(a.seasonPoints).toBeGreaterThan(0);
  });

  it('rival injuries persist through resolveImpacts', () => {
    const wA = warrior('ra', 's1');
    const wD = warrior('rd', 's2', { injuries: [] });
    const s = makeState([rival('s1', [wA]), rival('s2', [wD])]);

    // Scan seeds until the generator produces an injury for side D.
    let applied = false;
    for (let seed = 1; seed < 200 && !applied; seed++) {
      const res = handleInjuries(s, wA, wD, winOutcome('A'), 7, 's2', seed);
      const patch = res.impact.rivalWarriorPatches?.get('rd' as WarriorId);
      if (patch?.injuries?.length) {
        const out = resolveImpacts(s, [res.impact]);
        expect(out.rivals[1]!.roster[0]!.injuries).toHaveLength(1);
        applied = true;
      }
    }
    expect(applied, 'no seed produced a rival injury — check generateInjury').toBe(true);
  });

  it('rival XP progression lands via per-warrior patch', () => {
    const wA = warrior('ra', 's1');
    const wD = warrior('rd', 's2');
    const s = makeState([rival('s1', [wA]), rival('s2', [wD])]);

    const impact = handleProgressions(s, wA, wD, winOutcome('A'), [], 7, new SeededRNGService(11));
    const out = resolveImpacts(s, [impact]);

    const a = out.rivals[0]!.roster.find((w) => w.id === 'ra')!;
    expect((a as Warrior & { xp?: number }).xp ?? 0).toBeGreaterThan(0);
  });

  it('two kills on the same stable in one week both apply under merge', () => {
    const v1 = warrior('r1', 's1');
    const v2 = warrior('r2', 's1');
    const survivor = warrior('r3', 's1');
    const k1 = warrior('ka', 's2');
    const k2 = warrior('kb', 's2');
    const s = makeState([rival('s1', [v1, v2, survivor]), rival('s2', [k1, k2])]);

    // Two independent bouts' impacts merged like processWeekBouts does.
    const d1 = handleDeath(s, v1, k1, killOutcome('D'), 7, [], 's2');
    const d2 = handleDeath(s, v2, k2, killOutcome('D'), 7, [], 's2');
    const merged = mergeImpacts([d1.impact, d2.impact]);
    const out = resolveImpacts(s, [merged]);

    expect(out.rivals[0]!.roster.map((w) => w.id)).toEqual(['r3']);
    expect(out.graveyard.map((w) => w.id)).toEqual(expect.arrayContaining(['r1', 'r2']));
  });

  it('severe-injury house rule lands the Critical injury on a rival victim', () => {
    const victim = warrior('rd', 's2');
    const killer = warrior('ra', 's1');
    const s = makeState([rival('s1', [killer]), rival('s2', [victim])]);
    s.houseRules = { severeInjuryInsteadOfDeath: true } as GameState['houseRules'];

    const res = handleDeath(
      s,
      killer,
      victim,
      killOutcome('A'),
      7,
      [],
      's2',
      new SeededRNGService(3)
    );
    expect(res.death).toBe(false);

    const out = resolveImpacts(s, [res.impact]);
    const spared = out.rivals[1]!.roster.find((w) => w.id === 'rd')!;
    expect(spared.injuries.some((i) => i.severity === 'Critical')).toBe(true);
    expect(out.graveyard).toHaveLength(0);
  });
});
