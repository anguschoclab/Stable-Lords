import { describe, it, expect } from 'vitest';
import { STYLE_PRESETS, getStylePresets, defaultStylePreset } from '@/engine/bout/stylePresets';
import { FightingStyle } from '@/types/shared.types';

const ALL_STYLES = Object.values(FightingStyle);

describe('STYLE_PRESETS', () => {
  it('has at least 2 presets per style', () => {
    for (const style of ALL_STYLES) {
      expect(STYLE_PRESETS[style].length).toBeGreaterThanOrEqual(2);
    }
  });

  it('every preset has a name', () => {
    for (const style of ALL_STYLES) {
      for (const preset of STYLE_PRESETS[style]) {
        expect(preset.name).toBeTruthy();
        expect(typeof preset.name).toBe('string');
      }
    }
  });

  it('every preset has style matching its key', () => {
    for (const style of ALL_STYLES) {
      for (const preset of STYLE_PRESETS[style]) {
        expect(preset.plan.style).toBe(style);
      }
    }
  });

  it('every preset has base OE, AL, killDesire within 1–10', () => {
    for (const style of ALL_STYLES) {
      for (const preset of STYLE_PRESETS[style]) {
        const { OE, AL, killDesire } = preset.plan;
        expect(OE).toBeGreaterThanOrEqual(1);
        expect(OE).toBeLessThanOrEqual(10);
        expect(AL).toBeGreaterThanOrEqual(1);
        expect(AL).toBeLessThanOrEqual(10);
        expect(killDesire ?? 5).toBeGreaterThanOrEqual(1);
        expect(killDesire ?? 5).toBeLessThanOrEqual(10);
      }
    }
  });

  it('every preset has all three phase overrides within 1–10', () => {
    for (const style of ALL_STYLES) {
      for (const preset of STYLE_PRESETS[style]) {
        const phases = preset.plan.phases;
        expect(phases).toBeDefined();
        if (!phases) continue;
        for (const phaseKey of ['opening', 'mid', 'late'] as const) {
          const ps = phases[phaseKey];
          expect(ps).toBeDefined();
          if (!ps) continue;
          expect(ps.OE).toBeGreaterThanOrEqual(1);
          expect(ps.OE).toBeLessThanOrEqual(10);
          expect(ps.AL).toBeGreaterThanOrEqual(1);
          expect(ps.AL).toBeLessThanOrEqual(10);
          expect(ps.killDesire).toBeGreaterThanOrEqual(1);
          expect(ps.killDesire).toBeLessThanOrEqual(10);
        }
      }
    }
  });
});

describe('getStylePresets', () => {
  it('returns the same array as STYLE_PRESETS[style]', () => {
    for (const style of ALL_STYLES) {
      expect(getStylePresets(style)).toBe(STYLE_PRESETS[style]);
    }
  });
});

describe('defaultStylePreset', () => {
  it('returns the first preset for each style', () => {
    for (const style of ALL_STYLES) {
      expect(defaultStylePreset(style)).toBe(STYLE_PRESETS[style][0]);
    }
  });

  it('returns a preset with the correct style', () => {
    for (const style of ALL_STYLES) {
      expect(defaultStylePreset(style).plan.style).toBe(style);
    }
  });
});

describe('Specific preset values (from spec)', () => {
  it('AimedBlow presets match spec', () => {
    const presets = getStylePresets(FightingStyle.AimedBlow);
    expect(presets[0]!.name).toBe('Patient Surgeon');
    expect(presets[1]!.name).toBe('Aggressive Precision');
  });

  it('BashingAttack presets match spec', () => {
    const presets = getStylePresets(FightingStyle.BashingAttack);
    expect(presets[0]!.name).toBe('Steamroller');
    expect(presets[1]!.name).toBe('Measured Brute');
  });

  it('LungingAttack presets match spec', () => {
    const presets = getStylePresets(FightingStyle.LungingAttack);
    expect(presets[0]!.name).toBe('Blitz');
    expect(presets[1]!.name).toBe('Sustained Pressure');
  });

  it('ParryLunge presets match spec', () => {
    const presets = getStylePresets(FightingStyle.ParryLunge);
    expect(presets[0]!.name).toBe('Counter-Strike');
    expect(presets[1]!.name).toBe('Explosive Opener');
  });

  it('ParryRiposte presets match spec', () => {
    const presets = getStylePresets(FightingStyle.ParryRiposte);
    expect(presets.map((p) => p.name)).toEqual([
      'Classic Counter',
      'Aggressive Riposte',
      'Fast Ripper',
      'Third-Minute Surge',
    ]);
  });

  it('ParryStrike presets match spec', () => {
    const presets = getStylePresets(FightingStyle.ParryStrike);
    expect(presets[0]!.name).toBe('Measured Defense');
    expect(presets[1]!.name).toBe('Quick Finish');
  });

  it('PS carries the Arena 93 canon sheets after the spec two', () => {
    const presets = getStylePresets(FightingStyle.ParryStrike);
    expect(presets.map((p) => p.name)).toEqual([
      'Measured Defense',
      'Quick Finish',
      "Assur's Cadence",
      'One Strike, One Kill',
      "Priest's Shell",
    ]);
  });

  it("Assur's Cadence runs the magic 9-10 rhythm flat", () => {
    const plan = getStylePresets(FightingStyle.ParryStrike)[2]!.plan;
    expect(plan.phases?.opening).toMatchObject({ OE: 9, AL: 10, killDesire: 6 });
    expect(plan.phases?.mid).toMatchObject({ OE: 9, AL: 10, killDesire: 6 });
    expect(plan.phases?.late).toMatchObject({ OE: 9, AL: 10, killDesire: 6 });
  });

  it('One Strike, One Kill runs 10-10-10 Decisiveness everywhere — even desperation', () => {
    const plan = getStylePresets(FightingStyle.ParryStrike)[3]!.plan;
    expect(plan.offensiveTactic).toBe('Decisiveness');
    for (const k of ['opening', 'mid', 'late'] as const) {
      expect(plan.phases?.[k]).toMatchObject({ OE: 10, AL: 10, killDesire: 10 });
    }
    expect(plan.desperatePlan).toMatchObject({
      OE: 10,
      AL: 10,
      killDesire: 10,
      offensiveTactic: 'Decisiveness',
    });
  });

  it("Priest's Shell opens Responsiveness, transitions to Decisiveness, shells up when desperate", () => {
    const plan = getStylePresets(FightingStyle.ParryStrike)[4]!.plan;
    expect(plan.phases?.opening).toMatchObject({
      OE: 10,
      AL: 10,
      killDesire: 10,
      defensiveTactic: 'Responsiveness',
    });
    expect(plan.phases?.mid).toMatchObject({
      OE: 10,
      AL: 7,
      killDesire: 10,
      offensiveTactic: 'Decisiveness',
    });
    expect(plan.phases?.late).toMatchObject({ OE: 10, AL: 10, killDesire: 10 });
    expect(plan.desperatePlan).toMatchObject({
      OE: 10,
      AL: 10,
      killDesire: 10,
      defensiveTactic: 'Responsiveness',
    });
  });

  it('PL carries the Arena 93 canon sheets after the spec two', () => {
    const presets = getStylePresets(FightingStyle.ParryLunge);
    expect(presets.map((p) => p.name)).toEqual([
      'Counter-Strike',
      'Explosive Opener',
      'Armor-Piercer',
      'Tripwire Tempo',
    ]);
  });

  it('Armor-Piercer walls up the opening, hunts the head, and goes spastic when desperate', () => {
    const plan = getStylePresets(FightingStyle.ParryLunge)[2]!.plan;
    expect(plan.phases?.opening).toMatchObject({
      OE: 2,
      AL: 6,
      killDesire: 2,
      defensiveTactic: 'Parry',
    });
    expect(plan.phases?.mid).toMatchObject({ OE: 9, AL: 9, killDesire: 7 });
    expect(plan.target).toBe('Head');
    expect(plan.protect).toBe('Head');
    expect(plan.desperatePlan).toMatchObject({ OE: 10, AL: 10, killDesire: 10 });
  });

  it('Tripwire Tempo dodges the opening, bleeds to LO/VL late, and re-dodges when desperate', () => {
    const plan = getStylePresets(FightingStyle.ParryLunge)[3]!.plan;
    expect(plan.defensiveTactic).toBe('Dodge');
    expect(plan.phases?.opening).toMatchObject({
      OE: 5,
      AL: 8,
      defensiveTactic: 'Dodge',
    });
    expect(plan.phases?.late).toMatchObject({ OE: 4, AL: 1, defensiveTactic: 'none' });
    expect(plan.desperatePlan).toMatchObject({ OE: 3, AL: 8, defensiveTactic: 'Dodge' });
  });

  it('SlashingAttack presets match spec', () => {
    const presets = getStylePresets(FightingStyle.SlashingAttack);
    expect(presets[0]!.name).toBe("Reaper's Fade");
    expect(presets[1]!.name).toBe('Fight Another Day');
  });

  it('SL default preset runs the canon collapse — hot opening, fading AL, hot desperation', () => {
    const plan = getStylePresets(FightingStyle.SlashingAttack)[0]!.plan;
    expect(plan.phases?.opening?.OE).toBe(10);
    expect(plan.phases?.late?.AL).toBeLessThanOrEqual(2);
    expect(plan.desperatePlan?.OE).toBeGreaterThanOrEqual(9);
  });

  it('SL second preset drops to low effort when desperate — fight another day', () => {
    const plan = getStylePresets(FightingStyle.SlashingAttack)[1]!.plan;
    expect(plan.desperatePlan?.killDesire).toBeLessThanOrEqual(3);
  });

  it('StrikingAttack presets match spec', () => {
    const presets = getStylePresets(FightingStyle.StrikingAttack);
    expect(presets[0]!.name).toBe('Fast Finish');
    expect(presets[1]!.name).toBe('Technical Striker');
  });

  it('StrikingAttack carries the Arena 93 canon sheets after the spec two', () => {
    const presets = getStylePresets(FightingStyle.StrikingAttack);
    expect(presets.map((p) => p.name)).toEqual([
      'Fast Finish',
      'Technical Striker',
      "Assur's Opener",
      'Scum-Breaker',
      "Talon's Marauder",
      'Crimson Striker',
      "Tex's Marathon",
    ]);
  });

  it("Assur's Opener runs the 10-10-x sheet then throttles down", () => {
    const plan = getStylePresets(FightingStyle.StrikingAttack)[2]!.plan;
    expect(plan.phases?.opening).toMatchObject({ OE: 10, AL: 10, killDesire: 7 });
    expect(plan.phases?.mid).toMatchObject({ OE: 6, AL: 4, killDesire: 6 });
    expect(plan.phases?.late).toMatchObject({ OE: 5, AL: 1, killDesire: 5 });
    expect(plan.offensiveTactic).toBe('Decisiveness');
  });

  it('Scum-Breaker grinds at 6 OE and aims the legs — Blind Man anti-TP', () => {
    const plan = getStylePresets(FightingStyle.StrikingAttack)[3]!.plan;
    expect(plan.phases?.opening).toMatchObject({ OE: 6, AL: 4, killDesire: 6 });
    expect(plan.phases?.mid).toMatchObject({ OE: 6, AL: 2, killDesire: 6 });
    expect(plan.phases?.late).toMatchObject({ OE: 6, AL: 1, killDesire: 6 });
    expect(plan.target).toBe('Right Leg');
  });

  it("Talon's Marauder opens hot and fights behind Responsiveness", () => {
    const plan = getStylePresets(FightingStyle.StrikingAttack)[4]!.plan;
    expect(plan.phases?.opening).toMatchObject({ OE: 10, AL: 10, killDesire: 6 });
    expect(plan.phases?.mid).toMatchObject({ OE: 7, AL: 3, killDesire: 7 });
    expect(plan.phases?.late).toMatchObject({ OE: 5, AL: 1, killDesire: 5 });
    expect(plan.defensiveTactic).toBe('Responsiveness');
  });

  it('Crimson Striker keeps moderate AL and answers with Responsiveness', () => {
    const plan = getStylePresets(FightingStyle.StrikingAttack)[5]!.plan;
    expect(plan.phases?.opening).toMatchObject({ OE: 10, AL: 4, killDesire: 6 });
    expect(plan.phases?.mid).toMatchObject({ OE: 7, AL: 2, killDesire: 6 });
    expect(plan.phases?.late).toMatchObject({ OE: 6, AL: 1, killDesire: 5 });
    expect(plan.defensiveTactic).toBe('Responsiveness');
  });

  it("Tex's Marathon aims the arms, protects the head, surges when desperate", () => {
    const plan = getStylePresets(FightingStyle.StrikingAttack)[6]!.plan;
    expect(plan.phases?.opening).toMatchObject({ OE: 10, AL: 10, killDesire: 6 });
    expect(plan.phases?.mid).toMatchObject({ OE: 6, AL: 2, killDesire: 6 });
    expect(plan.phases?.late).toMatchObject({ OE: 5, AL: 1, killDesire: 5 });
    expect(plan.target).toBe('Right Arm');
    expect(plan.protect).toBe('Head');
    expect(plan.desperatePlan?.OE).toBe(10);
  });

  it('TotalParry presets match spec', () => {
    const presets = getStylePresets(FightingStyle.TotalParry);
    expect(presets[0]!.name).toBe('Endurance Wall');
    expect(presets[1]!.name).toBe('Opportunistic');
  });

  it('WallOfSteel presets match spec', () => {
    const presets = getStylePresets(FightingStyle.WallOfSteel);
    expect(presets[0]!.name).toBe('Iron Curtain');
    expect(presets[1]!.name).toBe('Aggressive Wall');
  });
});
