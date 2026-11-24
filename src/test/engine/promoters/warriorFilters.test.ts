/**
 * Warrior promoter filters — pins the hasInjuryRisk severity matrix and the
 * high-kill / showy classification thresholds that steer promoter matchmaking.
 */
import { describe, it, expect } from 'vitest';
import {
  hasInjuryRisk,
  isHighKillWarrior,
  isShowyWarrior,
} from '@/engine/promoters/warriorFilters';
import { makeWarrior } from '@/test/_fixtures/factories';
import { FightingStyle } from '@/types/shared.types';
import type { InjuryData } from '@/types/warrior.types';

const injury = (severity: InjuryData['severity']): InjuryData =>
  ({
    id: 'inj1',
    name: 'Test Injury',
    severity,
    location: 'Arm',
    description: 'test',
    weeksRemaining: 2,
    penalties: {},
  }) as unknown as InjuryData;

describe('hasInjuryRisk — severity matrix', () => {
  it('returns false with no injuries', () => {
    expect(hasInjuryRisk(makeWarrior({ injuries: [] } as never))).toBe(false);
  });

  it('returns false when injuries is undefined', () => {
    expect(hasInjuryRisk(makeWarrior({ injuries: undefined } as never))).toBe(false);
  });

  it.each(['Moderate', 'Severe', 'Critical'] as const)(
    'returns true for a single %s injury',
    (severity) => {
      expect(hasInjuryRisk(makeWarrior({ injuries: [injury(severity)] } as never))).toBe(true);
    }
  );

  it('returns false for Minor-only injuries', () => {
    const w = makeWarrior({ injuries: [injury('Minor'), injury('Minor')] } as never);
    expect(hasInjuryRisk(w)).toBe(false);
  });

  it('returns true when a risk severity hides among Minor injuries', () => {
    const w = makeWarrior({
      injuries: [injury('Minor'), injury('Critical'), injury('Minor')],
    } as never);
    expect(hasInjuryRisk(w)).toBe(true);
  });
});

describe('isHighKillWarrior', () => {
  it('is true above 3 career kills', () => {
    const w = makeWarrior({ career: { wins: 0, losses: 0, kills: 4 } } as never);
    expect(isHighKillWarrior(w)).toBe(true);
  });

  it('is false at exactly 3 kills for a non-BashingAttack style', () => {
    const w = makeWarrior({
      career: { wins: 0, losses: 0, kills: 3 },
      style: FightingStyle.StrikingAttack,
    } as never);
    expect(isHighKillWarrior(w)).toBe(false);
  });

  it('is true for BashingAttack regardless of kills', () => {
    const w = makeWarrior({
      career: { wins: 0, losses: 0, kills: 0 },
      style: FightingStyle.BashingAttack,
    } as never);
    expect(isHighKillWarrior(w)).toBe(true);
  });
});

describe('isShowyWarrior', () => {
  it.each([FightingStyle.LungingAttack, FightingStyle.AimedBlow, FightingStyle.ParryLunge])(
    'is true for showy style %s',
    (style) => {
      expect(isShowyWarrior(makeWarrior({ style, fame: 0 } as never))).toBe(true);
    }
  );

  it('is true for fame > 75 regardless of style', () => {
    const w = makeWarrior({ style: FightingStyle.WallOfSteel, fame: 76 } as never);
    expect(isShowyWarrior(w)).toBe(true);
  });

  it('is false at fame 75 with a non-showy style', () => {
    const w = makeWarrior({ style: FightingStyle.WallOfSteel, fame: 75 } as never);
    expect(isShowyWarrior(w)).toBe(false);
  });
});
