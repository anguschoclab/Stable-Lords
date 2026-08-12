import { describe, it, expect } from 'vitest';
import { STYLE_PRESETS, getStylePresets, defaultStylePreset } from '@/engine/bout/stylePresets';
import { FightingStyle } from '@/types/shared.types';

const ALL_STYLES = Object.values(FightingStyle);

describe('STYLE_PRESETS', () => {
  it('has exactly 2 presets per style (20 total)', () => {
    for (const style of ALL_STYLES) {
      expect(STYLE_PRESETS[style]).toHaveLength(2);
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
    expect(presets[0].name).toBe('Patient Surgeon');
    expect(presets[1].name).toBe('Aggressive Precision');
  });

  it('BashingAttack presets match spec', () => {
    const presets = getStylePresets(FightingStyle.BashingAttack);
    expect(presets[0].name).toBe('Steamroller');
    expect(presets[1].name).toBe('Measured Brute');
  });

  it('LungingAttack presets match spec', () => {
    const presets = getStylePresets(FightingStyle.LungingAttack);
    expect(presets[0].name).toBe('Blitz');
    expect(presets[1].name).toBe('Sustained Pressure');
  });

  it('ParryLunge presets match spec', () => {
    const presets = getStylePresets(FightingStyle.ParryLunge);
    expect(presets[0].name).toBe('Counter-Strike');
    expect(presets[1].name).toBe('Explosive Opener');
  });

  it('ParryRiposte presets match spec', () => {
    const presets = getStylePresets(FightingStyle.ParryRiposte);
    expect(presets[0].name).toBe('Classic Counter');
    expect(presets[1].name).toBe('Aggressive Riposte');
  });

  it('ParryStrike presets match spec', () => {
    const presets = getStylePresets(FightingStyle.ParryStrike);
    expect(presets[0].name).toBe('Measured Defense');
    expect(presets[1].name).toBe('Quick Finish');
  });

  it('SlashingAttack presets match spec', () => {
    const presets = getStylePresets(FightingStyle.SlashingAttack);
    expect(presets[0].name).toBe('Pressure Cutter');
    expect(presets[1].name).toBe('Cautious Slasher');
  });

  it('StrikingAttack presets match spec', () => {
    const presets = getStylePresets(FightingStyle.StrikingAttack);
    expect(presets[0].name).toBe('Fast Finish');
    expect(presets[1].name).toBe('Technical Striker');
  });

  it('TotalParry presets match spec', () => {
    const presets = getStylePresets(FightingStyle.TotalParry);
    expect(presets[0].name).toBe('Endurance Wall');
    expect(presets[1].name).toBe('Opportunistic');
  });

  it('WallOfSteel presets match spec', () => {
    const presets = getStylePresets(FightingStyle.WallOfSteel);
    expect(presets[0].name).toBe('Iron Curtain');
    expect(presets[1].name).toBe('Aggressive Wall');
  });
});
