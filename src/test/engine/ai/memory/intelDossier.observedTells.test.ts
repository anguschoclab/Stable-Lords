/**
 * Plan D.2 (deferred) — persisted observed tells.
 * A stable that witnesses a fight reads the participants' committed plans;
 * those tells persist on the opponent dossier as a running mean and feed
 * downstream consumers (crown targeting, offer eval, intelWorker blending).
 */
import { describe, it, expect } from 'vitest';
import { updateDossiers } from '@/engine/ai/memory/intelDossier';
import {
  makeRival,
  makeWarrior,
  makeFightSummary,
  makeGameState,
} from '@/test/_fixtures/factories';
import type { StableId, WarriorId } from '@/types/shared.types';

describe('updateDossiers — observedTells', () => {
  it('records observed OE/AL from witnessed fight participants', () => {
    const self = makeRival({ id: 'self-1' as StableId });
    const oppWarrior = makeWarrior({
      id: 'ow1' as WarriorId,
      plan: { OE: 9, AL: 2 } as never,
      lastBoutWeek: 5,
    });
    const opp = makeRival({ id: 'opp-1' as StableId, roster: [oppWarrior] });
    const state = makeGameState({
      rivals: [self, opp],
      absoluteWeek: 5,
      arenaHistory: [
        makeFightSummary({
          warriorIdA: 'ow1' as WarriorId,
          warriorIdD: 'x1' as WarriorId,
          stableIdA: 'opp-1' as StableId,
          stableIdD: 'other' as StableId,
          absoluteWeek: 5,
        }),
      ],
    });

    const out = updateDossiers(self, state);
    const tells = out['opp-1']?.observedTells;
    expect(tells).toBeDefined();
    expect(tells!.samples).toBe(1);
    expect(tells!.lastSeenWeek).toBe(5);
    // Committed plans are 1–10; stored tells are normalized 0–1.
    expect(tells!.oe).toBeCloseTo(0.9, 2);
    expect(tells!.al).toBeCloseTo(0.2, 2);
  });

  it('blends repeated sightings as a running mean capped by samples', () => {
    const self = makeRival({ id: 'self-1' as StableId });
    const w1 = makeWarrior({
      id: 'ow1' as WarriorId,
      plan: { OE: 8, AL: 8 } as never,
      lastBoutWeek: 5,
    });
    const w2 = makeWarrior({
      id: 'ow2' as WarriorId,
      plan: { OE: 2, AL: 2 } as never,
      lastBoutWeek: 5,
    });
    const opp = makeRival({ id: 'opp-1' as StableId, roster: [w1, w2] });
    const state = makeGameState({
      rivals: [self, opp],
      absoluteWeek: 5,
      arenaHistory: [
        makeFightSummary({
          warriorIdA: 'ow1' as WarriorId,
          warriorIdD: 'x1' as WarriorId,
          stableIdA: 'opp-1' as StableId,
          absoluteWeek: 5,
        }),
        makeFightSummary({
          warriorIdA: 'ow2' as WarriorId,
          warriorIdD: 'x2' as WarriorId,
          stableIdA: 'opp-1' as StableId,
          absoluteWeek: 5,
        }),
      ],
    });

    const out = updateDossiers(self, state);
    const tells = out['opp-1']!.observedTells!;
    expect(tells.samples).toBe(2);
    expect(tells.oe).toBeCloseTo(0.5, 2);
    expect(tells.al).toBeCloseTo(0.5, 2);
  });

  it('does not write tells for the observing stable itself', () => {
    const mine = makeWarrior({
      id: 'rw1' as WarriorId,
      plan: { OE: 10, AL: 10 } as never,
      lastBoutWeek: 5,
    });
    const self = makeRival({ id: 'self-1' as StableId, roster: [mine] });
    const opp = makeRival({
      id: 'opp-1' as StableId,
      roster: [makeWarrior({ id: 'ow1' as WarriorId })],
    });
    const state = makeGameState({
      rivals: [self, opp],
      absoluteWeek: 5,
      arenaHistory: [
        makeFightSummary({
          warriorIdA: 'rw1' as WarriorId,
          warriorIdD: 'ow1' as WarriorId,
          stableIdA: 'self-1' as StableId,
          stableIdD: 'opp-1' as StableId,
          absoluteWeek: 5,
        }),
      ],
    });

    const out = updateDossiers(self, state);
    expect(out['self-1']).toBeUndefined();
    expect(out['opp-1']!.observedTells).toBeUndefined();
  });
});
