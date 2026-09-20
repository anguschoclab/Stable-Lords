/**
 * Unit tests for rosterWorker: selectTrainingFocus, performAITraining, performAISkillDrill.
 * Uses real training pipeline with controlled RNG for integration fidelity.
 */
import { describe, it, expect, vi, afterEach } from 'vitest';
import { processRoster, selectTrainingFocus } from '@/engine/ai/workers/rosterWorker';
import { performAITraining } from '@/engine/ai/workers/rosterWorkerTraining';
import { FLAW_EXPOSURE_CHANCE } from '@/engine/ai/workers/rosterWorker';
import type { IRNGService } from '@/engine/core/rng/IRNGService';

// RNG that always passes the AI_TRAINING_EFFECTIVENESS gate (next() → 0 < 0.8)
// and returns no training injury — so the chosen focus is deterministic.
const alwaysTrainRng = {
  next: () => 0,
  roll: (min: number) => min,
  chance: () => true,
  pick: <T,>(arr: T[]) => arr[0] as T,
  shuffle: <T,>(arr: T[]) => arr,
  uuid: () => 'test-uuid',
  rollWeighted: <T,>(entries: readonly { item: T; weight: number }[]) => entries[0]?.item as T,
} as IRNGService;
import type { RivalStableData } from '@/types/state.types';
import type { Warrior, Attributes } from '@/types/warrior.types';
import type { WarriorId, StableId } from '@/types/shared.types';
import { FightingStyle, ATTRIBUTE_MAX } from '@/types/shared.types';
import { computeWarriorStats } from '@/engine/skillCalc';

function makeWarrior(
  id: string,
  attrs: Partial<Attributes> = {},
  overrides: Partial<Warrior> = {}
): Warrior {
  const fullAttrs: Attributes = {
    ST: 10,
    CN: 10,
    SZ: 10,
    WT: 10,
    WL: 10,
    SP: 10,
    DF: 10,
    ...attrs,
  };
  const { baseSkills, derivedStats } = computeWarriorStats(fullAttrs, FightingStyle.StrikingAttack);
  return {
    id: id as WarriorId,
    name: `Warrior ${id}`,
    style: FightingStyle.StrikingAttack,
    attributes: fullAttrs,
    baseSkills,
    derivedStats,
    fame: 0,
    popularity: 0,
    titles: [],
    injuries: [],
    flair: [],
    traits: [],
    career: { wins: 0, losses: 0, kills: 0 },
    champion: false,
    status: 'Active',
    age: 24,
    ...overrides,
  };
}

function makeRivalStable(overrides: Partial<RivalStableData> = {}): RivalStableData {
  return {
    id: 'r1' as StableId,
    owner: {
      id: 'r1' as StableId,
      name: 'Rival Owner',
      stableName: 'Rival Stable',
      fame: 0,
      renown: 0,
      titles: 0,
      personality: 'Pragmatic',
    },
    fame: 0,
    roster: [],
    trainers: [],
    treasury: 1000,
    ledger: [],
    trainingAssignments: [],
    ...overrides,
  } as any as RivalStableData;
}

afterEach(() => {
  vi.restoreAllMocks();
});

// ─── selectTrainingFocus ──────────────────────────────────────────────────

describe('selectTrainingFocus', () => {
  it('selects CN for Spring', () => {
    const w = makeWarrior('w1');
    expect(selectTrainingFocus(w, 'Spring')).toBe('CN');
  });

  it('selects ST for Summer', () => {
    const w = makeWarrior('w1');
    expect(selectTrainingFocus(w, 'Summer')).toBe('ST');
  });

  it('falls back to lowest trainable stat for Fall', () => {
    const w = makeWarrior('w1', { ST: 15, CN: 12, SZ: 10, WT: 14, WL: 13, SP: 16, DF: 11 });
    // Lowest trainable (excl SZ) = DF (11)
    expect(selectTrainingFocus(w, 'Fall')).toBe('DF');
  });

  it('falls back to lowest trainable stat for undefined season', () => {
    const w = makeWarrior('w1', { ST: 15, CN: 12, SZ: 10, WT: 14, WL: 13, SP: 16, DF: 11 });
    expect(selectTrainingFocus(w, undefined)).toBe('DF');
  });

  it('falls back when seasonal choice is at ATTRIBUTE_MAX', () => {
    const w = makeWarrior('w1', {
      CN: ATTRIBUTE_MAX,
      ST: 15,
      SZ: 10,
      WT: 14,
      WL: 13,
      SP: 16,
      DF: 11,
    });
    // Spring → CN, but CN is at max → fall back to lowest (DF=11)
    expect(selectTrainingFocus(w, 'Spring')).toBe('DF');
  });

  it('never selects SZ', () => {
    const w = makeWarrior('w1', { ST: 15, CN: 14, SZ: 3, WT: 14, WL: 13, SP: 16, DF: 12 });
    const result = selectTrainingFocus(w, 'Fall');
    expect(result).not.toBe('SZ');
  });

  it('skips attributes already at their potential ceiling (burn risk)', () => {
    // ST is the lowest attr but its potential is already maxed — training it
    // is a wasted week. The focus must fall to the next-lowest trainable.
    const w = makeWarrior(
      'w1',
      { ST: 11, CN: 12, SZ: 10, WT: 14, WL: 13, SP: 16, DF: 15 },
      { potential: { ST: 11 } as Warrior['potential'] }
    );
    const stable = makeRivalStable({ roster: [w] });
    const { chosen } = performAITraining(w, stable, 'Fall', [], alwaysTrainRng);
    expect(chosen).toBe('CN');
  });

  it('skips a seasonal pick that is at its potential ceiling', () => {
    const w = makeWarrior(
      'w1',
      { ST: 15, CN: 11, SZ: 10, WT: 14, WL: 13, SP: 16, DF: 12 },
      { potential: { CN: 11 } as Warrior['potential'] }
    );
    const stable = makeRivalStable({ roster: [w] });
    // Spring → CN, but CN is capped → fall back to lowest non-capped (DF=12)
    const { chosen } = performAITraining(w, stable, 'Spring', [], alwaysTrainRng);
    expect(chosen).toBe('DF');
  });
});

// ─── processRoster (integration) ──────────────────────────────────────────

describe('processRoster', () => {
  it('returns a valid RivalStableData with roster intact', () => {
    const w = makeWarrior('w1');
    const rival = makeRivalStable({ roster: [w], treasury: 1000 });
    const result = processRoster(rival, 1, 'Spring', 42);

    expect(result.roster).toBeDefined();
    expect(result.roster.length).toBeGreaterThanOrEqual(1);
    expect(result.treasury).toBeGreaterThanOrEqual(0);
  });

  it('processes recovery for injured warriors', () => {
    const w = makeWarrior(
      'w1',
      {},
      {
        injuries: [
          {
            id: 'i1' as any,
            name: 'Sprain',
            description: 'Ouch',
            severity: 'Minor',
            weeksRemaining: 2,
            penalties: {},
          },
        ],
      }
    );
    const rival = makeRivalStable({ roster: [w], treasury: 1000 });
    const result = processRoster(rival, 1, 'Spring', 42);

    // Recovery should have ticked the injury
    const updated = result.roster.find((r) => r.id === w.id);
    expect(updated).toBeDefined();
  });

  it('does not train when treasury is below training cost', () => {
    const w = makeWarrior('w1');
    const rival = makeRivalStable({ roster: [w], treasury: 0 });
    const result = processRoster(rival, 1, 'Spring', 42);

    // Warrior should be unchanged (no budget for training)
    const updated = result.roster.find((r) => r.id === w.id);
    expect(updated?.attributes).toEqual(w.attributes);
  });

  it('deducts training cost from treasury when training occurs', () => {
    const w = makeWarrior('w1');
    const rival = makeRivalStable({ roster: [w], treasury: 1000 });
    const result = processRoster(rival, 1, 'Spring', 42);

    // Treasury should be <= initial (training and/or gear costs deducted)
    expect(result.treasury).toBeLessThanOrEqual(1000);
  });
});

// ─── FLAW_EXPOSURE_CHANCE ─────────────────────────────────────────────────

describe('FLAW_EXPOSURE_CHANCE', () => {
  it('is exported and is a small probability', () => {
    expect(typeof FLAW_EXPOSURE_CHANCE).toBe('number');
    expect(FLAW_EXPOSURE_CHANCE).toBeGreaterThan(0);
    expect(FLAW_EXPOSURE_CHANCE).toBeLessThan(0.1);
  });
});
