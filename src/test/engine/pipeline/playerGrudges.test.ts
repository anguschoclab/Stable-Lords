/**
 * Stage C.0 — G5b: rival-vs-player bloodshed must produce player×rival
 * OwnerGrudges. Today processOwnerGrudges only pairs rival×rival, so the
 * player can be killed with zero social consequence.
 */
import { describe, it, expect } from 'vitest';
import { processOwnerGrudges } from '@/engine/owner/grudges';
import {
  makeGameState,
  makeRival,
  makeOwner,
  makeWarrior,
  makeFightSummary,
} from '@/test/_fixtures/factories';
import type { StableId, WarriorId } from '@/types/shared.types';

describe('player×rival grudges', () => {
  it('a rival killing a player warrior creates a grudge against the player', () => {
    const playerWarrior = makeWarrior({ id: 'pw1' as WarriorId });
    const killer = makeWarrior({ id: 'kw1' as WarriorId });
    const rival = makeRival({
      id: 'rA' as StableId,
      owner: makeOwner({ id: 'ownA' as never, personality: 'Aggressive' }),
      roster: [killer],
    });
    const state = makeGameState({
      roster: [playerWarrior],
      rivals: [rival],
      week: 6,
      absoluteWeek: 6,
      arenaHistory: [
        makeFightSummary({
          warriorIdA: 'kw1' as WarriorId,
          warriorIdD: 'pw1' as WarriorId,
          stableIdA: 'rA' as StableId,
          stableIdD: 'player-1' as StableId,
          winner: 'A',
          by: 'Kill',
          week: 5,
          absoluteWeek: 5,
        }),
      ],
    });

    const { grudges } = processOwnerGrudges(state, []);
    const g = grudges.find(
      (x) =>
        (x.ownerIdA === state.player.id || x.ownerIdB === state.player.id) &&
        (x.ownerIdA === 'ownA' || x.ownerIdB === 'ownA')
    );
    expect(g).toBeDefined();
    expect(g!.intensity).toBeGreaterThanOrEqual(2);
  });

  it('repeat kills escalate the player grudge', () => {
    const playerWarrior = makeWarrior({ id: 'pw1' as WarriorId });
    const killer = makeWarrior({ id: 'kw1' as WarriorId });
    const rival = makeRival({
      id: 'rA' as StableId,
      owner: makeOwner({ id: 'ownA' as never, personality: 'Aggressive' }),
      roster: [killer],
    });
    const existing = {
      id: 'grudge_p' as never,
      ownerIdA: 'ownA' as never,
      ownerIdB: 'player-1' as never,
      intensity: 2,
      reason: 'bloodshed',
      startWeek: 1,
      lastEscalation: 1,
    };
    const state = makeGameState({
      roster: [playerWarrior],
      rivals: [rival],
      week: 6,
      absoluteWeek: 6,
      arenaHistory: [
        makeFightSummary({
          warriorIdA: 'kw1' as WarriorId,
          warriorIdD: 'pw1' as WarriorId,
          winner: 'A',
          by: 'Kill',
          week: 5,
          absoluteWeek: 5,
        }),
      ],
    });
    // The player owner id must match the grudge's ownerIdB
    state.player = { ...state.player, id: 'player-1' as never };

    const { grudges } = processOwnerGrudges(state, [existing]);
    const g = grudges.find((x) => x.id === 'grudge_p');
    expect(g!.intensity).toBeGreaterThan(2);
  });

  it('an upset loss creates a SLIGHTED grudge at intensity 1 (no kill needed)', () => {
    const starPlayer = makeWarrior({ id: 'star1' as WarriorId, fame: 300 });
    const underdog = makeWarrior({ id: 'ud1' as WarriorId, fame: 50 });
    const rival = makeRival({
      id: 'rA' as StableId,
      owner: makeOwner({ id: 'ownA' as never, personality: 'Pragmatic' }),
      roster: [underdog],
    });
    const state = makeGameState({
      roster: [starPlayer],
      rivals: [rival],
      week: 6,
      absoluteWeek: 6,
      arenaHistory: [
        makeFightSummary({
          warriorIdA: 'ud1' as WarriorId,
          warriorIdD: 'star1' as WarriorId,
          winner: 'A', // underdog (rival) won
          by: 'KO',
          week: 5,
          absoluteWeek: 5,
        }),
      ],
    });

    const { grudges, gazetteItems } = processOwnerGrudges(state, []);
    const g = grudges.find(
      (x) => x.ownerIdA === 'ownA' || x.ownerIdB === 'ownA'
    );
    expect(g).toBeDefined();
    expect(g!.intensity).toBe(1);
    expect(gazetteItems.some((i) => i.includes('SLIGHTED'))).toBe(true);
  });

  it('a kill dominates an upset — BLOOD FEUD at intensity 2, not SLIGHTED', () => {
    const starPlayer = makeWarrior({ id: 'star1' as WarriorId, fame: 300 });
    const killer = makeWarrior({ id: 'kw1' as WarriorId, fame: 50 });
    const rival = makeRival({
      id: 'rA' as StableId,
      owner: makeOwner({ id: 'ownA' as never, personality: 'Pragmatic' }),
      roster: [killer],
    });
    const state = makeGameState({
      roster: [starPlayer],
      rivals: [rival],
      week: 6,
      absoluteWeek: 6,
      arenaHistory: [
        makeFightSummary({
          warriorIdA: 'kw1' as WarriorId,
          warriorIdD: 'star1' as WarriorId,
          winner: 'A',
          by: 'Kill',
          week: 5,
          absoluteWeek: 5,
        }),
      ],
    });

    const { grudges, gazetteItems } = processOwnerGrudges(state, []);
    const g = grudges.find((x) => x.ownerIdA === 'ownA' || x.ownerIdB === 'ownA');
    expect(g!.intensity).toBe(2);
    expect(gazetteItems.some((i) => i.includes('BLOOD FEUD'))).toBe(true);
    expect(gazetteItems.some((i) => i.includes('SLIGHTED'))).toBe(false);
  });

  it('no grudge forms when the rival only fought other rivals', () => {
    const rival = makeRival({
      id: 'rA' as StableId,
      owner: makeOwner({ id: 'ownA' as never }),
      roster: [makeWarrior({ id: 'kw1' as WarriorId })],
    });
    const state = makeGameState({
      rivals: [rival],
      week: 6,
      absoluteWeek: 6,
      arenaHistory: [
        makeFightSummary({
          warriorIdA: 'kw1' as WarriorId,
          warriorIdD: 'stranger' as WarriorId,
          winner: 'A',
          by: 'Kill',
          week: 5,
          absoluteWeek: 5,
        }),
      ],
    });
    const { grudges } = processOwnerGrudges(state, []);
    expect(grudges.every((g) => g.ownerIdA !== state.player.id && g.ownerIdB !== state.player.id)).toBe(
      true
    );
  });
});
