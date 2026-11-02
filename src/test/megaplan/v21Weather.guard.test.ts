import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { WEATHER_TYPES, OFFSEASON_WEATHER_TYPES } from '@/types/enumSources';
import { WEATHER_EFFECTS } from '@/engine/combat/mechanics/weatherEffects/table';
import { WEATHER_CONFIG } from '@/constants/arena/weather';
import { WEATHER_STATS } from '@/constants/arena/weatherStats';
// Exported as part of the V21 #1074 fix — the spec is RED until the
// disposition record is exported AND has the new entry.
import { WEATHER_AI_DISPOSITION } from '@/engine/ai/weatherSuitability';

/**
 * V21 weather guards (PR #1074 — 'Threads of Chaos').
 *
 * The merge-blocked describes are RED at commit and turn green when the
 * weather branch lands with its three missing exhaustive surfaces wired
 * (WEATHER_STATS, WEATHER_VISUALS, WEATHER_AI_DISPOSITION).
 *
 * The live ratchets are GREEN at commit:
 *   - disposition-bucket ↔ OFFSEASON_WEATHER_TYPES coherence (an ARENA
 *     disposition on an event-only type is dead config tsc can't see)
 *   - WEATHER_STATS-string ↔ WEATHER_EFFECTS parity, shrink-only allowlist
 *   - effect-magnitude envelope ratchet (post-merge observed range)
 */
describe('weather surface coherence (live guard)', () => {

  it('weather effect magnitudes stay inside the observed envelope', () => {
    const violations: string[] = [];
    for (const w of WEATHER_TYPES) {
      const e = WEATHER_EFFECTS[w];
      if (e.damageMult < 0.8 || e.damageMult > 1.5) violations.push(`${w}: damageMult ${e.damageMult}`);
      if (Math.abs(e.initiativeMod) > 10) violations.push(`${w}: initiativeMod ${e.initiativeMod}`);
      if (Math.abs(e.riposteMod) > 12) violations.push(`${w}: riposteMod ${e.riposteMod}`);
      if (e.staminaMult < 0.7 || e.staminaMult > 2.0) violations.push(`${w}: staminaMult ${e.staminaMult}`);
    }
    expect(violations).toEqual([]);
  });

  it('WEATHER_STATS strings match WEATHER_EFFECTS values (shrink-only allowlist)', () => {
    // Known pre-existing drift — display lies vs engine truth (V21 §B).
    // Shrink-only: new weather rows must be parity-clean; fixing a listed
    // row removes it from the allowlist.
    const ALLOWLIST = new Set([
      'Gale', // missing DAMAGE token, mult 0.85
      'Eclipse', // missing DAMAGE token, mult 1.3
      'Sandstorm', // missing DAMAGE token, mult 0.9
      'Ashfall', // missing DAMAGE token, mult 0.9
      'Spooky Night', // missing DAMAGE token, mult 0.9
      'Cursed Miasma', // missing DAMAGE token, mult 1.1
      'Aurora Borealis', // missing DAMAGE token, mult 0.95
      'Diamond Rain', // claims +30, mult 1.15
    ]);
    const mismatches: string[] = [];
    for (const w of WEATHER_TYPES) {
      const stats = WEATHER_STATS[w];
      const e = WEATHER_EFFECTS[w];
      if (!stats || !e) continue;
      let bad = false;
      const dmg = stats.match(/DAMAGE ([+-]\d+)%/);
      if (!dmg && e.damageMult !== 1.0) bad = true;
      if (dmg && parseInt(dmg[1]) !== Math.round((e.damageMult - 1) * 100)) bad = true;
      const ini = stats.match(/INITIATIVE ([+-]\d+)/);
      if (ini && parseInt(ini[1]) !== e.initiativeMod) bad = true;
      const rip = stats.match(/RIPOSTE ([+-]\d+)/);
      if (rip && parseInt(rip[1]) !== e.riposteMod) bad = true;
      if (bad && !ALLOWLIST.has(w)) mismatches.push(w);
    }
    expect(mismatches, 'new stats↔effects drift — fix the string, not the allowlist').toEqual([]);
  });
});

describe('MEGAPLAN-V7: Threads of Chaos surfaces (PR #1074)', () => {
  it('is registered in WEATHER_TYPES with the post-merge count', () => {
    expect(WEATHER_TYPES).toContain('Threads of Chaos');
    expect(WEATHER_TYPES.length).toBe(65);
  });

  it('has a WEATHER_EFFECTS row inside the chaos-family envelope', () => {
    const e = WEATHER_EFFECTS['Threads of Chaos'];
    expect(e).toBeDefined();
    expect(e.damageMult).toBe(1.5);
    expect(e.staminaMult).toBe(1.5);
    expect(e.initiativeMod).toBe(5);
    expect(e.riposteMod).toBe(5);
  });

  it('has config, stats, visual, and opening-line surfaces', () => {
    expect(WEATHER_CONFIG['Threads of Chaos']).toBeDefined();
    const stats = WEATHER_STATS['Threads of Chaos'];
    expect(stats, 'WEATHER_STATS missing entry').toBeDefined();
    // Stats string must match the shipped effect row (stats↔effects parity).
    expect(stats).toContain('INITIATIVE +5');
    expect(stats).toContain('RIPOSTE +5');
    expect(stats).toContain('DAMAGE +50%');
    const visualsSrc = readFileSync('src/components/arena/weather/index.tsx', 'utf-8');
    expect(visualsSrc).toContain("'Threads of Chaos':");
  });

  it('has an offseason AI disposition (event-only per enum contract)', () => {
    const d = WEATHER_AI_DISPOSITION['Threads of Chaos'];
    expect(d, 'WEATHER_AI_DISPOSITION missing entry').toBeDefined();
    expect(d.bucket).toBe('offseason');
  });

  it('every weather disposition bucket matches its pool membership', () => {
    // Merge-blocked: asserts on the exported record (the #1074 fix adds the
    // export). An ARENA disposition on an OFFSEASON-list member is dead
    // config tsc can't see — this is the coherence check the branch missed.
    const offseasonSet = new Set<string>(OFFSEASON_WEATHER_TYPES);
    const violations: string[] = [];
    for (const w of WEATHER_TYPES) {
      const bucket = WEATHER_AI_DISPOSITION?.[w as keyof typeof WEATHER_AI_DISPOSITION]?.bucket;
      const isOffseason = offseasonSet.has(w);
      if (isOffseason && bucket !== 'offseason') {
        violations.push(`${w}: OFFSEASON-list member with bucket '${bucket}'`);
      }
      if (!isOffseason && bucket === 'offseason') {
        violations.push(`${w}: seasonal member labeled 'offseason'`);
      }
    }
    expect(violations).toEqual([]);
  });
});
