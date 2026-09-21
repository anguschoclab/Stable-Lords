import { describe, it, expect } from 'vitest';
import { runRivalStrategyPass } from '@/engine/pipeline/passes/RivalStrategyPass';
import { makeRival, makeWarrior, makeGameState } from '@/test/_fixtures/factories';
import type { WarriorId, StableId } from '@/types/shared.types';
import type { OwnerGrudge } from '@/types/state.types';
import { SeededRNGService } from '@/utils/random';

function playerGrudgeFor(rivalOwnerId: string, playerId: string): OwnerGrudge {
  return {
    id: 'grudge-1',
    ownerIdA: rivalOwnerId,
    ownerIdB: playerId,
    intensity: 4,
    reason: 'Blood feud',
    startWeek: 1,
    lastEscalation: 2,
  } as OwnerGrudge;
}

function bookableRoster(prefix: string, stableId: string, n: number) {
  return Array.from({ length: n }, (_, i) =>
    makeWarrior({ id: `${prefix}-${i}` as WarriorId, stableId: stableId as StableId, fame: 80 })
  );
}

describe('G.1 — vendetta → player end-to-end (full RivalStrategyPass)', () => {
  it('a VENDETTA strategy targeting the player produces a proposed offer on a player warrior', () => {
    const playerWarrior = makeWarrior({ id: 'pw-1' as WarriorId, fame: 120 });
    const playerId = makeGameState({}).player.id;
    const rival = makeRival({
      roster: bookableRoster('rw', 'rival-1', 4),
      strategy: {
        intent: 'VENDETTA',
        planWeeksRemaining: 5,
        targetStableId: playerId,
      },
    });
    const state = makeGameState({
      roster: [playerWarrior],
      rivals: [rival],
      ownerGrudges: [playerGrudgeFor(rival.owner.id as string, playerId as string)],
    });

    const impact = runRivalStrategyPass(state, 6, new SeededRNGService(42), true);
    const offers = Object.values(impact.boutOffers ?? {});
    const playerOffer = offers.find((o) => o.warriorIds.includes(playerWarrior.id as WarriorId));
    expect(playerOffer).toBeDefined();
    expect(playerOffer!.status).toBe('Proposed');
  });

  it('an expired plan + live player grudge can re-derive VENDETTA → targetStableId = player.id', () => {
    const playerWarrior = makeWarrior({ id: 'pw-2' as WarriorId, fame: 120 });
    const playerId = makeGameState({}).player.id;
    const rival = makeRival({
      roster: bookableRoster('rw2', 'rival-1', 4),
      strategy: { intent: 'CONSOLIDATION', planWeeksRemaining: 0 },
      owner: { ...makeRival().owner, personality: 'Aggressive' },
    });

    // Seed sweep: with vendettaChance=0.4 (Aggressive) some strategy seeds land
    // VENDETTA; when they do, the grudge resolves targetStableId → player.id and
    // a player-bound bid converts into a Proposed offer.
    let sawVendetta = false;
    let sawOffer = false;
    for (let s = 1; s <= 40; s++) {
      const st = makeGameState({
        roster: [playerWarrior],
        rivals: [rival],
        ownerGrudges: [playerGrudgeFor(rival.owner.id as string, playerId as string)],
        absoluteWeek: s,
      });
      const impact = runRivalStrategyPass(st, 6, new SeededRNGService(7), true);
      const rivals = [...(impact.rivalsUpdates?.values() ?? [])] as {
        strategy?: { intent?: string; targetStableId?: unknown };
      }[];
      if (
        rivals.some(
          (r) => r.strategy?.intent === 'VENDETTA' && r.strategy?.targetStableId === playerId
        )
      ) {
        sawVendetta = true;
      }
      const offers = Object.values(impact.boutOffers ?? {});
      if (offers.some((o) => o.warriorIds.includes(playerWarrior.id as WarriorId))) {
        sawOffer = true;
      }
    }
    expect(sawVendetta).toBe(true);
    expect(sawOffer).toBe(true);
  });

  it('a vendetta targeting the player never auto-signs — the player retains agency', () => {
    const playerWarrior = makeWarrior({ id: 'pw-3' as WarriorId, fame: 120 });
    const playerId = makeGameState({}).player.id;
    const rival = makeRival({
      roster: bookableRoster('rw3', 'rival-1', 4),
      strategy: {
        intent: 'VENDETTA',
        planWeeksRemaining: 5,
        targetStableId: playerId,
      },
    });
    const state = makeGameState({
      roster: [playerWarrior],
      rivals: [rival],
      ownerGrudges: [playerGrudgeFor(rival.owner.id as string, playerId as string)],
    });

    const impact = runRivalStrategyPass(state, 6, new SeededRNGService(11), true);
    const offers = Object.values(impact.boutOffers ?? {}) as {
      status: string;
      warriorIds: WarriorId[];
    }[];
    for (const o of offers) {
      if (o.warriorIds.includes(playerWarrior.id as WarriorId)) {
        expect(o.status).not.toBe('Signed');
      }
    }
  });
});
