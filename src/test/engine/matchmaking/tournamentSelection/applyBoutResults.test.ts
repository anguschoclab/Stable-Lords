import { describe, it, expect } from 'vitest';
import { applyBoutResults } from '@/engine/matchmaking/tournamentSelection/resolution/results';
import { SeededRNG } from '@/utils/random';
import { makeGameState, makeWarrior, makeRival, makeOwner } from '@/test/_fixtures/factories';
import type { StableId, TournamentId, WarriorId } from '@/types/shared.types';

/**
 * Characterization pins for the applyTournamentKill rivals.map+filter
 * refactor — victim purge must be exact (owning stable only) and unaffected
 * stables keep referential identity.
 */
describe('applyBoutResults — kill path', () => {
  const victim = makeWarrior({ id: 'victim-1' as WarriorId, stableId: 'r1' as any });
  const killer = makeWarrior({ id: 'killer-1' as WarriorId });
  const bystander = makeWarrior({ id: 'bystander-1' as WarriorId, stableId: 'r2' as any });

  function stateWith() {
    const r1 = makeRival({ id: 'r1' as StableId, owner: makeOwner({ id: 'r1' as StableId }), roster: [victim] });
    const r2 = makeRival({ id: 'r2' as StableId, owner: makeOwner({ id: 'r2' as StableId }), roster: [bystander] });
    return {
      r1,
      r2,
      state: makeGameState({
        roster: [killer],
        rivals: [r1, r2],
        tournaments: [
          {
            id: 't1' as TournamentId,
            season: 'Spring',
            week: 1,
            tierId: 'tier',
            name: 'Cup',
            bracket: [],
            participants: [victim],
            completed: false,
          },
        ],
        week: 1,
        absoluteWeek: 1,
      }),
    };
  }

  const killOutcome = { winner: 'D', by: 'Kill', minutes: 3, log: [] } as any;

  it('purges the victim from its owning stable only, stamping participants Dead', () => {
    const { state } = stateWith();
    const next = applyBoutResults({
      state,
      wA: victim,
      wD: killer,
      outcome: killOutcome,
      tId: 't1',
      tName: 'Cup',
      rng: new SeededRNG(42),
    });

    const nextR1 = next.rivals.find((r) => r.id === 'r1')!;
    const nextR2 = next.rivals.find((r) => r.id === 'r2')!;
    expect(nextR1.roster.some((w) => w.id === 'victim-1')).toBe(false);
    // Unaffected stable: same warrior, untouched.
    expect(nextR2.roster.some((w) => w.id === 'bystander-1')).toBe(true);

    expect(next.graveyard?.some((w) => w.id === 'victim-1')).toBe(true);
    expect(next.deadWarriorIds).toContain('victim-1');
    expect(next.killEvents?.some((e) => e.victimId === 'victim-1')).toBe(true);

    const stamped = next.tournaments![0]!.participants.find((p) => p.id === 'victim-1')!;
    expect(stamped.status).toBe('Dead');
    expect(stamped.isDead).toBe(true);
  });

  it('a repeat kill does not duplicate graveyard/registry entries', () => {
    const { state } = stateWith();
    const once = applyBoutResults({
      state,
      wA: victim,
      wD: killer,
      outcome: killOutcome,
      tId: 't1',
      tName: 'Cup',
      rng: new SeededRNG(42),
    });
    const twice = applyBoutResults({
      state: once,
      wA: victim,
      wD: killer,
      outcome: killOutcome,
      tId: 't1',
      tName: 'Cup',
      rng: new SeededRNG(43),
    });
    expect(twice.graveyard?.filter((w) => w.id === 'victim-1')).toHaveLength(1);
    expect(twice.deadWarriorIds?.filter((id) => id === 'victim-1')).toHaveLength(1);
    expect(twice.killEvents?.filter((e) => e.victimId === 'victim-1')).toHaveLength(1);
  });

  it('records the bout in arenaHistory for non-kill outcomes too', () => {
    const { state } = stateWith();
    const next = applyBoutResults({
      state,
      wA: victim,
      wD: killer,
      outcome: { winner: 'A', by: 'Dec', minutes: 10, log: [] } as any,
      tId: 't1',
      tName: 'Cup',
      rng: new SeededRNG(7),
    });
    expect(next.arenaHistory).toHaveLength(1);
    expect(next.graveyard ?? []).toHaveLength(0);
  });
});
