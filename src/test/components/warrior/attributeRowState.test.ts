import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { WarriorId, TrainingAssignment, Attributes } from '@/types/game';
import { makeWarrior } from '@/test/_fixtures/factories';

vi.mock('@/engine/training', () => ({
  computeGainChance: vi.fn(() => 0),
}));

vi.mock('@/engine/potential', () => ({
  canGrow: vi.fn(() => true),
}));

import { computeGainChance } from '@/engine/training';
import { canGrow } from '@/engine/potential';
import { getAttributeRowState } from '@/components/warrior/attributeRowState';

function baseInput(over: Partial<Parameters<typeof getAttributeRowState>[0]> = {}) {
  return {
    warrior: makeWarrior({ id: 'w1' as WarriorId }),
    key: 'ST' as keyof Attributes,
    assignment: undefined as TrainingAssignment | undefined,
    seasonalGains: {},
    trainers: [],
    atCap: false,
    ...over,
  };
}

describe('getAttributeRowState', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(computeGainChance).mockReturnValue(0);
    vi.mocked(canGrow).mockReturnValue(true);
  });

  it('returns a trainable default row when nothing blocks growth', () => {
    vi.mocked(computeGainChance).mockReturnValue(0.55);
    const s = getAttributeRowState(baseInput());
    expect(s.val).toBe(10);
    expect(s.disabled).toBe(false);
    expect(s.lockReason).toBeNull();
    expect(s.chance).toBe(55);
    expect(s.isSelected).toBe(false);
  });

  it('locks SZ as fixed regardless of other flags', () => {
    const s = getAttributeRowState(baseInput({ key: 'SZ', atCap: true }));
    expect(s.isSZ).toBe(true);
    expect(s.disabled).toBe(true);
    expect(s.lockReason).toBe('Size is fixed');
  });

  it('locks maxed attributes (val >= 25)', () => {
    const warrior = makeWarrior({
      attributes: { ST: 25, CN: 10, SZ: 10, WT: 10, WL: 10, SP: 10, DF: 10 },
    });
    const s = getAttributeRowState(baseInput({ warrior }));
    expect(s.maxed).toBe(true);
    expect(s.disabled).toBe(true);
    expect(s.lockReason).toBe('Attribute max (25)');
    expect(s.chance).toBe(0);
  });

  it('locks when the potential ceiling is hit (canGrow === false)', () => {
    vi.mocked(canGrow).mockReturnValue(false);
    const s = getAttributeRowState(baseInput());
    expect(s.ceilingHit).toBe(true);
    expect(s.disabled).toBe(true);
    expect(s.lockReason).toBe('At potential ceiling');
  });

  it('locks when the total stat cap is reached', () => {
    const s = getAttributeRowState(baseInput({ atCap: true }));
    expect(s.disabled).toBe(true);
    expect(s.lockReason).toBe('Total stat cap (80) reached');
    expect(s.chance).toBe(0);
  });

  it('locks when the seasonal gain cap is reached for that attribute', () => {
    const s = getAttributeRowState(baseInput({ seasonalGains: { ST: 3 } }));
    expect(s.seasonCapped).toBe(true);
    expect(s.disabled).toBe(true);
    expect(s.lockReason).toBe('Seasonal cap (3/3 this season)');
  });

  it('does not season-cap when gains are below the cap or on another attribute', () => {
    const below = getAttributeRowState(baseInput({ seasonalGains: { ST: 2 } }));
    expect(below.seasonCapped).toBe(false);
    const other = getAttributeRowState(baseInput({ seasonalGains: { CN: 3 } }));
    expect(other.seasonCapped).toBe(false);
  });

  it('disables every row when any assignment exists, and marks the selected one', () => {
    const assignment: TrainingAssignment = {
      warriorId: 'w1' as WarriorId,
      type: 'attribute',
      attribute: 'ST',
    };
    const selected = getAttributeRowState(baseInput({ assignment }));
    expect(selected.isSelected).toBe(true);
    expect(selected.disabled).toBe(true);

    const other = getAttributeRowState(baseInput({ assignment, key: 'CN' }));
    expect(other.isSelected).toBe(false);
    expect(other.disabled).toBe(true);
  });

  it('does not mark rows selected for recovery-type assignments', () => {
    const assignment: TrainingAssignment = {
      warriorId: 'w1' as WarriorId,
      type: 'recovery',
    } as TrainingAssignment;
    const s = getAttributeRowState(baseInput({ assignment }));
    expect(s.isSelected).toBe(false);
    expect(s.disabled).toBe(true);
  });

  it('reports lockReason precedence: ceilingHit beats atCap, atCap beats seasonCapped', () => {
    vi.mocked(canGrow).mockReturnValue(false);
    const s = getAttributeRowState(
      baseInput({ atCap: true, seasonalGains: { ST: 3 } })
    );
    expect(s.lockReason).toBe('At potential ceiling');
  });

  it('rounds the gain chance to a whole percentage', () => {
    vi.mocked(computeGainChance).mockReturnValue(0.556);
    const s = getAttributeRowState(baseInput());
    expect(s.chance).toBe(56);
  });

  it('exposes reveal state and potential ceiling value', () => {
    const warrior = makeWarrior({
      potential: { ST: 18, CN: 20, SZ: 10, WT: 20, WL: 20, SP: 20, DF: 20 },
      potentialRevealed: { ST: true },
    });
    const s = getAttributeRowState(baseInput({ warrior }));
    expect(s.isRevealed).toBe(true);
    expect(s.potVal).toBe(18);
    expect(s.nearCeiling).toBe(false);
  });

  it('flags nearCeiling when revealed and within the buffer of the potential', () => {
    const warrior = makeWarrior({
      attributes: { ST: 17, CN: 10, SZ: 10, WT: 10, WL: 10, SP: 10, DF: 10 },
      potential: { ST: 18, CN: 20, SZ: 10, WT: 20, WL: 20, SP: 20, DF: 20 },
      potentialRevealed: { ST: true },
    });
    const s = getAttributeRowState(baseInput({ warrior }));
    expect(s.nearCeiling).toBe(true);
  });

  it('does not flag nearCeiling when the potential is unrevealed', () => {
    const warrior = makeWarrior({
      attributes: { ST: 17, CN: 10, SZ: 10, WT: 10, WL: 10, SP: 10, DF: 10 },
      potential: { ST: 18, CN: 20, SZ: 10, WT: 20, WL: 20, SP: 20, DF: 20 },
      potentialRevealed: {},
    });
    const s = getAttributeRowState(baseInput({ warrior }));
    expect(s.isRevealed).toBe(false);
    expect(s.nearCeiling).toBe(false);
  });

  it('defaults potVal to the attribute max when potential is unknown', () => {
    const warrior = makeWarrior({ potential: undefined });
    const s = getAttributeRowState(baseInput({ warrior }));
    expect(s.potVal).toBe(25);
  });
});
