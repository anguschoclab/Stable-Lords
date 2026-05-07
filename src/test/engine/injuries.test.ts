import { describe, it, expect } from 'vitest';
import { generateInjury } from '@/engine/injuries';
import { FightingStyle } from '@/types/shared.types';
import type { Warrior } from '@/types/warrior.types';
import type { FightOutcome } from '@/types/combat.types';

describe('rollForInjury', () => {
  const mockWarrior: Warrior = {
    id: 'test-warrior',
    name: 'Test Warrior',
    style: FightingStyle.StrikingAttack,
    attributes: { ST: 10, CN: 10, SZ: 10, WT: 10, WL: 10, SP: 10, DF: 10 },
    baseSkills: {} as unknown,
    derivedStats: {} as unknown,
    fame: 0,
    popularity: 0,
    titles: [],
    injuries: [],
    flair: [],
    career: { wins: 0, losses: 0, kills: 0 },
    champion: false,
    status: 'Active',
    age: 20,
  };

  const mockOutcome: FightOutcome = {
    winner: 'D',
    by: 'KO',
    minutes: 5,
    log: [],
    post: {
      hitsA: 10,
      hitsD: 5,
      xpA: 10,
      xpD: 10,
      gotKillA: false,
      gotKillD: false,
    },
  };

  it('should generate an ID for an injury', () => {
    const res = generateInjury(mockWarrior, mockOutcome, 'A', 12345);
    expect(res).toBeDefined();
    if (res) {
      expect(res.id).toBeDefined();
      expect(res.name).toBeDefined();
      expect(res.weeksRemaining).toBeGreaterThan(0);
    }
  });
});
