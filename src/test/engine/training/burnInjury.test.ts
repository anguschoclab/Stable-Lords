import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { assessBurnRisks, computeTrainability } from '@/engine/training/burnAnalysis';
import { rollForTrainingInjury, TRAINING_INJURIES } from '@/engine/training/trainingGains';
import { FightingStyle, type Warrior, type Trainer } from '@/types/game';
import { computeWarriorStats } from '@/engine/skillCalc';
import { setMockIdGenerator } from '@/utils/idUtils';
import type { IRNGService } from '@/engine/core/rng/IRNGService';
import type { WarriorId, InjuryId, WeatherType } from '@/types/shared.types';

function makeWarrior(attrs: Record<string, number>, overrides?: Partial<Warrior>): Warrior {
  const { baseSkills, derivedStats } = computeWarriorStats(
    attrs as any,
    FightingStyle.StrikingAttack
  );
  return {
    id: 'w1' as WarriorId,
    name: 'Test',
    style: FightingStyle.StrikingAttack,
    attributes: attrs as any,
    baseSkills,
    derivedStats,
    fame: 0,
    popularity: 0,
    titles: [],
    injuries: [],
    flair: [],
    career: { wins: 0, losses: 0, kills: 0 },
    champion: false,
    status: 'Active',
    age: 20,
    potential: { ST: 18, CN: 18, SZ: 15, WT: 18, WL: 18, SP: 18, DF: 18 },
    traits: [],
    ...overrides,
  };
}

function makeTrainer(overrides?: Partial<Trainer>): Trainer {
  return {
    id: 't1',
    name: 'Trainer',
    tier: 'Novice',
    focus: 'Aggression',
    fame: 0,
    age: 40,
    contractWeeksLeft: 10,
    ...overrides,
  };
}

function makeRNG(
  nextVal: number,
  pickIdx?: number,
  rollVal?: number
): IRNGService {
  return {
    next: () => nextVal,
    pick: <T>(arr: T[]): T => {
      if (pickIdx !== undefined) return arr[pickIdx]!;
      return arr[0]!;
    },
    roll: () => rollVal ?? 1,
    uuid: (prefix?: string) => (prefix ? `${prefix}-mock` : 'mock-uuid'),
    shuffle: <T>(arr: T[]): T[] => arr,
    pickWeighted: <T>(items: T[]): T => items[0]!,
    chance: (p: number) => nextVal < p,
  } as any as IRNGService;
}

function makeInjuryRNG(
  nextVal: number,
  pickTemplate: (typeof TRAINING_INJURIES)[number],
  rollVal: number
): IRNGService {
  return {
    next: () => nextVal,
    pick: <T>(_arr: T[]): T => pickTemplate as unknown as T,
    roll: () => rollVal,
    uuid: (prefix?: string) => (prefix ? `${prefix}-mock` : 'mock-uuid'),
    shuffle: <T>(arr: T[]): T[] => arr,
    pickWeighted: <T>(items: T[]): T => items[0]!,
    chance: (p: number) => nextVal < p,
  } as any as IRNGService;
}

const defaultAttrs = { ST: 10, CN: 10, SZ: 10, WT: 10, WL: 10, SP: 10, DF: 10 };
const defaultPot = { ST: 18, CN: 18, SZ: 15, WT: 18, WL: 18, SP: 18, DF: 18 };

describe('assessBurnRisks', () => {
  describe('potential ceiling branch', () => {
    it('at ceiling → high severity', () => {
      const w = makeWarrior({ ...defaultAttrs, ST: 18 }, { potential: defaultPot });
      const warnings = assessBurnRisks(w, []);
      const stWarnings = warnings.filter((x) => x.attribute === 'ST');
      const ceilingWarn = stWarnings.find((x) => x.reason.includes('At potential ceiling'));
      expect(ceilingWarn).toBeDefined();
      expect(ceilingWarn!.severity).toBe('high');
      expect(ceilingWarn!.reason).toMatch(/At potential ceiling \(18\)/);
    });

    it('1 point from ceiling → medium severity', () => {
      const w = makeWarrior({ ...defaultAttrs, ST: 17 }, { potential: defaultPot });
      const warnings = assessBurnRisks(w, []);
      const stWarnings = warnings.filter((x) => x.attribute === 'ST');
      const ceilingWarn = stWarnings.find((x) => x.reason.includes('ceiling'));
      expect(ceilingWarn).toBeDefined();
      expect(ceilingWarn!.severity).toBe('medium');
      expect(ceilingWarn!.reason).toMatch(/1 point from ceiling \(18\)/);
    });

    it('2 points from ceiling → no ceiling warning', () => {
      const w = makeWarrior({ ...defaultAttrs, ST: 16 }, { potential: defaultPot });
      const warnings = assessBurnRisks(w, []);
      const ceilingWarn = warnings.find(
        (x) => x.attribute === 'ST' && x.reason.includes('ceiling')
      );
      expect(ceilingWarn).toBeUndefined();
    });

    it('above ceiling (val > pot) → high severity', () => {
      const w = makeWarrior({ ...defaultAttrs, ST: 20 }, { potential: { ...defaultPot, ST: 18 } });
      const warnings = assessBurnRisks(w, []);
      const stWarnings = warnings.filter((x) => x.attribute === 'ST');
      const ceilingWarn = stWarnings.find((x) => x.reason.includes('ceiling'));
      expect(ceilingWarn).toBeDefined();
      expect(ceilingWarn!.severity).toBe('high');
    });

    it('potential undefined → no ceiling warnings', () => {
      const w = makeWarrior(defaultAttrs, { potential: undefined });
      const warnings = assessBurnRisks(w, []);
      const ceilingWarns = warnings.filter((x) => x.reason.includes('ceiling'));
      expect(ceilingWarns).toHaveLength(0);
    });
  });

  describe('low gain chance branch', () => {
    it('chance < 0.2 at ceiling → low chance warning', () => {
      const w = makeWarrior({ ...defaultAttrs, ST: 18 }, { potential: defaultPot });
      const warnings = assessBurnRisks(w, []);
      const lowChance = warnings.find(
        (x) => x.attribute === 'ST' && x.reason.includes('Very low gain chance')
      );
      expect(lowChance).toBeDefined();
      expect(lowChance!.severity).toBe('medium');
    });

    it('chance < 0.2 near ceiling → low chance warning', () => {
      const w = makeWarrior({ ...defaultAttrs, ST: 17 }, { potential: defaultPot });
      const warnings = assessBurnRisks(w, []);
      const lowChance = warnings.find(
        (x) => x.attribute === 'ST' && x.reason.includes('Very low gain chance')
      );
      expect(lowChance).toBeDefined();
    });

    it('val >= MAX_VALUE (25) → low chance check skipped', () => {
      const w = makeWarrior({ ...defaultAttrs, ST: 25 }, { potential: { ...defaultPot, ST: 25 } });
      const warnings = assessBurnRisks(w, []);
      const lowChance = warnings.find(
        (x) => x.attribute === 'ST' && x.reason.includes('Very low gain chance')
      );
      expect(lowChance).toBeUndefined();
    });

    it('chance >= 0.2 → no low chance warning', () => {
      const w = makeWarrior({ ...defaultAttrs, ST: 10 }, { potential: defaultPot });
      const warnings = assessBurnRisks(w, []);
      const lowChance = warnings.find(
        (x) => x.attribute === 'ST' && x.reason.includes('Very low gain chance')
      );
      expect(lowChance).toBeUndefined();
    });

    it('low chance warning includes rounded percentage', () => {
      const w = makeWarrior({ ...defaultAttrs, ST: 18 }, { potential: defaultPot });
      const warnings = assessBurnRisks(w, []);
      const lowChance = warnings.find(
        (x) => x.attribute === 'ST' && x.reason.includes('Very low gain chance')
      );
      expect(lowChance).toBeDefined();
      expect(lowChance!.reason).toMatch(/15%/);
    });
  });

  describe('age penalty branch', () => {
    it('age > 30 → age warning per non-SZ attr', () => {
      const w = makeWarrior(defaultAttrs, { potential: defaultPot, age: 35 });
      const warnings = assessBurnRisks(w, []);
      const ageWarns = warnings.filter((x) => x.reason.includes('Age penalty active'));
      expect(ageWarns).toHaveLength(6);
      for (const aw of ageWarns) {
        expect(aw.severity).toBe('low');
        expect(aw.reason).toMatch(/Age penalty active \(age 35\)/);
      }
      expect(ageWarns.every((x) => x.attribute !== 'SZ')).toBe(true);
    });

    it('age = 30 → no age warning', () => {
      const w = makeWarrior(defaultAttrs, { potential: defaultPot, age: 30 });
      const warnings = assessBurnRisks(w, []);
      const ageWarns = warnings.filter((x) => x.reason.includes('Age penalty'));
      expect(ageWarns).toHaveLength(0);
    });

    it('age undefined → defaults to 18, no age warning', () => {
      const w = makeWarrior(defaultAttrs, { potential: defaultPot, age: undefined });
      const warnings = assessBurnRisks(w, []);
      const ageWarns = warnings.filter((x) => x.reason.includes('Age penalty'));
      expect(ageWarns).toHaveLength(0);
    });
  });

  describe('SZ skip', () => {
    it('SZ at ceiling → no SZ warnings', () => {
      const w = makeWarrior({ ...defaultAttrs, SZ: 15 }, { potential: { ...defaultPot, SZ: 15 } });
      const warnings = assessBurnRisks(w, []);
      const szWarns = warnings.filter((x) => x.attribute === 'SZ');
      expect(szWarns).toHaveLength(0);
    });

    it('SZ at ceiling + age > 30 → no SZ warnings', () => {
      const w = makeWarrior(
        { ...defaultAttrs, SZ: 15 },
        { potential: { ...defaultPot, SZ: 15 }, age: 35 }
      );
      const warnings = assessBurnRisks(w, []);
      const szWarns = warnings.filter((x) => x.attribute === 'SZ');
      expect(szWarns).toHaveLength(0);
    });
  });

  describe('warning stacking', () => {
    it('at ceiling + age > 30 → 2 warnings for same attr', () => {
      const w = makeWarrior(
        { ...defaultAttrs, ST: 18 },
        { potential: defaultPot, age: 35 }
      );
      const warnings = assessBurnRisks(w, []);
      const stWarnings = warnings.filter((x) => x.attribute === 'ST');
      const ceiling = stWarnings.find((x) => x.reason.includes('At potential ceiling'));
      const age = stWarnings.find((x) => x.reason.includes('Age penalty'));
      expect(ceiling).toBeDefined();
      expect(ceiling!.severity).toBe('high');
      expect(age).toBeDefined();
      expect(age!.severity).toBe('low');
    });

    it('near ceiling + age > 30 → 3 warnings for same attr', () => {
      const w = makeWarrior(
        { ...defaultAttrs, ST: 17 },
        { potential: defaultPot, age: 35 }
      );
      const warnings = assessBurnRisks(w, []);
      const stWarnings = warnings.filter((x) => x.attribute === 'ST');
      const ceiling = stWarnings.find((x) => x.reason.includes('1 point from ceiling'));
      const lowChance = stWarnings.find((x) => x.reason.includes('Very low gain chance'));
      const age = stWarnings.find((x) => x.reason.includes('Age penalty'));
      expect(ceiling).toBeDefined();
      expect(lowChance).toBeDefined();
      expect(age).toBeDefined();
    });

    it('at ceiling + low chance + age > 30 → 3 warnings for same attr', () => {
      const w = makeWarrior(
        { ...defaultAttrs, ST: 18 },
        { potential: defaultPot, age: 35 }
      );
      const warnings = assessBurnRisks(w, []);
      const stWarnings = warnings.filter((x) => x.attribute === 'ST');
      const ceiling = stWarnings.find((x) => x.reason.includes('At potential ceiling'));
      const lowChance = stWarnings.find((x) => x.reason.includes('Very low gain chance'));
      const age = stWarnings.find((x) => x.reason.includes('Age penalty'));
      expect(ceiling).toBeDefined();
      expect(lowChance).toBeDefined();
      expect(age).toBeDefined();
      expect(stWarnings.length).toBeGreaterThanOrEqual(3);
    });
  });

  describe('trainer influence', () => {
    it('matching trainer raises chance above 0.2 → no low chance warning', () => {
      const w = makeWarrior({ ...defaultAttrs, ST: 16 }, { potential: defaultPot });
      const trainer = makeTrainer({ tier: 'Seasoned', focus: 'Aggression' });
      const warnings = assessBurnRisks(w, [trainer]);
      const lowChance = warnings.find(
        (x) => x.attribute === 'ST' && x.reason.includes('Very low gain chance')
      );
      expect(lowChance).toBeUndefined();
    });

    it('expired trainer (contractWeeksLeft=0) → no bonus', () => {
      const w = makeWarrior({ ...defaultAttrs, ST: 16 }, { potential: defaultPot });
      const trainer = makeTrainer({ tier: 'Master', focus: 'Aggression', contractWeeksLeft: 0 });
      const warnings = assessBurnRisks(w, [trainer]);
      const lowChance = warnings.find(
        (x) => x.attribute === 'ST' && x.reason.includes('Very low gain chance')
      );
      expect(lowChance).toBeUndefined();
    });
  });
});

describe('computeTrainability', () => {
  it('all attrs trainable → positive score', () => {
    const w = makeWarrior(defaultAttrs, { potential: defaultPot });
    const score = computeTrainability(w, []);
    expect(score).toBeGreaterThan(0);
  });

  it('all attrs at ceiling → 0', () => {
    const w = makeWarrior(
      { ST: 18, CN: 18, SZ: 15, WT: 18, WL: 18, SP: 18, DF: 18 },
      { potential: defaultPot }
    );
    const score = computeTrainability(w, []);
    expect(score).toBe(0);
  });

  it('all attrs at 25 (no pot) → 0', () => {
    const w = makeWarrior(
      { ST: 25, CN: 25, SZ: 25, WT: 25, WL: 25, SP: 25, DF: 25 },
      { potential: undefined }
    );
    const score = computeTrainability(w, []);
    expect(score).toBe(0);
  });

  it('some attrs at ceiling, some trainable → only trainable counted', () => {
    const w = makeWarrior(
      { ST: 18, CN: 10, SZ: 10, WT: 10, WL: 10, SP: 10, DF: 10 },
      { potential: defaultPot }
    );
    const score = computeTrainability(w, []);
    expect(score).toBeGreaterThan(0);
  });

  it('SZ at ceiling does not affect score (always skipped)', () => {
    const w1 = makeWarrior(defaultAttrs, { potential: defaultPot });
    const w2 = makeWarrior(
      { ...defaultAttrs, SZ: 15 },
      { potential: { ...defaultPot, SZ: 15 } }
    );
    expect(computeTrainability(w1, [])).toBe(computeTrainability(w2, []));
  });

  it('no potential defined → all attrs trainable unless val >= 25', () => {
    const w = makeWarrior(defaultAttrs, { potential: undefined });
    const score = computeTrainability(w, []);
    expect(score).toBeGreaterThan(0);
  });

  it('returns rounded percentage (integer)', () => {
    const w = makeWarrior(defaultAttrs, { potential: defaultPot });
    const score = computeTrainability(w, []);
    expect(Number.isInteger(score)).toBe(true);
  });

  it('trainer bonus increases score', () => {
    const w = makeWarrior(defaultAttrs, { potential: defaultPot });
    const trainer = makeTrainer({ tier: 'Master', focus: 'Aggression' });
    const withoutTrainer = computeTrainability(w, []);
    const withTrainer = computeTrainability(w, [trainer]);
    expect(withTrainer).toBeGreaterThanOrEqual(withoutTrainer);
  });
});

describe('rollForTrainingInjury', () => {
  beforeEach(() => {
    setMockIdGenerator(() => 'test-id');
  });

  afterEach(() => {
    setMockIdGenerator(null);
  });

  describe('no-injury path', () => {
    it('roll >= chance → null injury', () => {
      const w = makeWarrior(defaultAttrs);
      const rng = makeRNG(0.03);
      const res = rollForTrainingInjury(w, 0, rng, 'Clear');
      expect(res.injury).toBeNull();
      expect(res.result).toBeNull();
    });

    it('roll >= chance with high roll → null injury', () => {
      const w = makeWarrior(defaultAttrs);
      const rng = makeRNG(0.99);
      const res = rollForTrainingInjury(w, 0, rng, 'Clear');
      expect(res.injury).toBeNull();
      expect(res.result).toBeNull();
    });

    it('default weather = Clear (no modifier)', () => {
      const w = makeWarrior(defaultAttrs);
      const rng = makeRNG(0.03);
      const res = rollForTrainingInjury(w, 0, rng);
      expect(res.injury).toBeNull();
    });
  });

  describe('injury path basics', () => {
    it('roll < chance → injury object with correct fields', () => {
      const w = makeWarrior(defaultAttrs);
      const rng = makeInjuryRNG(0.0, TRAINING_INJURIES[0]!, 1);
      const res = rollForTrainingInjury(w, 0, rng, 'Clear');
      expect(res.injury).not.toBeNull();
      expect(res.injury!.name).toBe('Pulled Muscle');
      expect(res.injury!.description).toBe('Overextended during drills.');
      expect(res.injury!.severity).toBe('Minor');
      expect(res.injury!.penalties).toEqual({ ST: -1 });
    });

    it('result type and message', () => {
      const w = makeWarrior(defaultAttrs);
      const rng = makeInjuryRNG(0.0, TRAINING_INJURIES[0]!, 1);
      const res = rollForTrainingInjury(w, 0, rng, 'Clear');
      expect(res.result).not.toBeNull();
      expect(res.result!.type).toBe('injury');
      expect(res.result!.warriorId).toBe(w.id);
      expect(res.result!.message).toMatch(/Test suffered a Pulled Muscle.*\(1 week recovery\)/);
    });

    it('injury id from generateId', () => {
      const w = makeWarrior(defaultAttrs);
      const rng = makeInjuryRNG(0.0, TRAINING_INJURIES[0]!, 1);
      const res = rollForTrainingInjury(w, 0, rng, 'Clear');
      expect(res.injury!.id).toBe('test-id' as InjuryId);
    });

    it('injury severity always Minor', () => {
      const w = makeWarrior(defaultAttrs);
      const rng = makeInjuryRNG(0.0, TRAINING_INJURIES[3]!, 2);
      const res = rollForTrainingInjury(w, 0, rng, 'Clear');
      expect(res.injury!.severity).toBe('Minor');
    });
  });

  describe('age penalty modifier', () => {
    it('age=35 → agePenalty=0.025, chance=0.055', () => {
      const w = makeWarrior(defaultAttrs, { age: 35 });
      const rng = makeInjuryRNG(0.05, TRAINING_INJURIES[0]!, 1);
      const res = rollForTrainingInjury(w, 0, rng, 'Clear');
      expect(res.injury).not.toBeNull();
    });

    it('age=20 → no agePenalty, chance=0.03, same roll 0.05 → no injury', () => {
      const w = makeWarrior(defaultAttrs, { age: 20 });
      const rng = makeRNG(0.05);
      const res = rollForTrainingInjury(w, 0, rng, 'Clear');
      expect(res.injury).toBeNull();
    });

    it('age=31 → agePenalty=0.005, chance=0.035', () => {
      const w = makeWarrior(defaultAttrs, { age: 31 });
      const rng = makeInjuryRNG(0.034, TRAINING_INJURIES[0]!, 1);
      const res = rollForTrainingInjury(w, 0, rng, 'Clear');
      expect(res.injury).not.toBeNull();
    });
  });

  describe('healing bonus modifier', () => {
    it('healingBonus=2 → healReduce=0.02, chance=0.01', () => {
      const w = makeWarrior(defaultAttrs);
      const rng = makeRNG(0.015);
      const res = rollForTrainingInjury(w, 2, rng, 'Clear');
      expect(res.injury).toBeNull();
    });

    it('healingBonus=0 → no reduction, chance=0.03', () => {
      const w = makeWarrior(defaultAttrs);
      const rng = makeInjuryRNG(0.015, TRAINING_INJURIES[0]!, 1);
      const res = rollForTrainingInjury(w, 0, rng, 'Clear');
      expect(res.injury).not.toBeNull();
    });

    it('healingBonus=100 → healReduce=1.0, chance clamped to 0.01', () => {
      const w = makeWarrior(defaultAttrs);
      const rng = makeInjuryRNG(0.009, TRAINING_INJURIES[0]!, 1);
      const res = rollForTrainingInjury(w, 100, rng, 'Clear');
      expect(res.injury).not.toBeNull();
    });
  });

  describe('weather modifiers', () => {
    it('Rainy: +0.02, chance=0.05', () => {
      const w = makeWarrior(defaultAttrs);
      const rng = makeInjuryRNG(0.04, TRAINING_INJURIES[0]!, 1);
      const res = rollForTrainingInjury(w, 0, rng, 'Rainy' as WeatherType);
      expect(res.injury).not.toBeNull();
    });

    it('Gale: +0.03, chance=0.06', () => {
      const w = makeWarrior(defaultAttrs);
      const rng = makeInjuryRNG(0.05, TRAINING_INJURIES[0]!, 1);
      const res = rollForTrainingInjury(w, 0, rng, 'Gale' as WeatherType);
      expect(res.injury).not.toBeNull();
    });

    it('Sandstorm: +0.01, chance=0.04', () => {
      const w = makeWarrior(defaultAttrs);
      const rng = makeInjuryRNG(0.035, TRAINING_INJURIES[0]!, 1);
      const res = rollForTrainingInjury(w, 0, rng, 'Sandstorm' as WeatherType);
      expect(res.injury).not.toBeNull();
    });

    it('Breezy: -0.01, chance=0.02', () => {
      const w = makeWarrior(defaultAttrs);
      const rng = makeRNG(0.025);
      const res = rollForTrainingInjury(w, 0, rng, 'Breezy' as WeatherType);
      expect(res.injury).toBeNull();
    });

    it('other weather (Sweltering) → 0 mod', () => {
      const w = makeWarrior(defaultAttrs);
      const rng = makeRNG(0.03);
      const res = rollForTrainingInjury(w, 0, rng, 'Sweltering' as WeatherType);
      expect(res.injury).toBeNull();
    });
  });

  describe('weeks remaining calculation', () => {
    it('healingBonus=1, roll returns 3 → weeksRemaining=2', () => {
      const w = makeWarrior(defaultAttrs);
      const rng = makeInjuryRNG(0.0, TRAINING_INJURIES[0]!, 3);
      const res = rollForTrainingInjury(w, 1, rng, 'Clear');
      expect(res.injury!.weeksRemaining).toBe(2);
    });

    it('healingBonus=5, roll returns 1 → weeksRemaining=1 (floor)', () => {
      const w = makeWarrior(defaultAttrs);
      const rng = makeInjuryRNG(0.0, TRAINING_INJURIES[0]!, 1);
      const res = rollForTrainingInjury(w, 5, rng, 'Clear');
      expect(res.injury!.weeksRemaining).toBe(1);
    });

    it('healingBonus=0, roll returns 2 → weeksRemaining=2', () => {
      const w = makeWarrior(defaultAttrs);
      const rng = makeInjuryRNG(0.0, TRAINING_INJURIES[0]!, 2);
      const res = rollForTrainingInjury(w, 0, rng, 'Clear');
      expect(res.injury!.weeksRemaining).toBe(2);
    });
  });

  describe('chance clamping', () => {
    it('upper clamp: age=100, Gale → raw=0.41 → clamped to 0.1', () => {
      const w = makeWarrior(defaultAttrs, { age: 100 });
      const rng = makeInjuryRNG(0.099, TRAINING_INJURIES[0]!, 1);
      const res = rollForTrainingInjury(w, 0, rng, 'Gale' as WeatherType);
      expect(res.injury).not.toBeNull();
    });

    it('lower clamp: healingBonus=100 → raw=-0.97 → clamped to 0.01', () => {
      const w = makeWarrior(defaultAttrs);
      const rng = makeInjuryRNG(0.009, TRAINING_INJURIES[0]!, 1);
      const res = rollForTrainingInjury(w, 100, rng, 'Clear');
      expect(res.injury).not.toBeNull();
    });
  });

  describe('boundary: roll exactly equals chance', () => {
    it('next() === chance exactly → not < chance → no injury', () => {
      const w = makeWarrior(defaultAttrs, { age: 20 });
      const rng = makeRNG(0.03);
      const res = rollForTrainingInjury(w, 0, rng, 'Clear');
      expect(res.injury).toBeNull();
    });
  });

  describe('each injury template', () => {
    for (let i = 0; i < TRAINING_INJURIES.length; i++) {
      const template = TRAINING_INJURIES[i]!;
      it(`template ${i}: ${template.name} produces correct injury fields`, () => {
        const w = makeWarrior(defaultAttrs);
        const minW = template.weeksRange[0] ?? 1;
        const rng = makeInjuryRNG(0.0, template, minW);
        const res = rollForTrainingInjury(w, 0, rng, 'Clear');
        expect(res.injury).not.toBeNull();
        expect(res.injury!.name).toBe(template.name);
        expect(res.injury!.description).toBe(template.description);
        expect(res.injury!.penalties).toEqual(template.penalties);
        expect(res.injury!.weeksRemaining).toBe(Math.max(1, minW - 0));
      });
    }
  });
});
