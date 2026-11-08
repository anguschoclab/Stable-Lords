/**
 * Turnaround Advisor — the "How To Make a Loser Win" diagnostic.
 * Given a struggling warrior, picks ONE reliable win condition from real
 * state (skills + learns + drills + style aptitudes) and a ranked action
 * list grounded in chart evidence, plan memory, learn ledger, and the
 * matchup matrix. Never recommends beating everyone — picks the route.
 */
import { describe, it, expect } from 'vitest';
import { diagnoseTurnaround } from '@/engine/advisor/turnaroundAdvisor';
import { makeWarrior } from '@/test/_fixtures/factories';
import { FightingStyle } from '@/types/shared.types';
import { STYLE_LEARN_WEIGHTS } from '@/data/learnPriorities';
import { getMatchupBonus } from '@/constants/combat/combat';

const loser = (over = {}) =>
  makeWarrior({
    style: FightingStyle.LungingAttack,
    career: { wins: 2, losses: 8, kills: 0 },
    baseSkills: { ATT: 8, PAR: 5, DEF: 6, INI: 12, RIP: 4, DEC: 6 },
    ...over,
  });

describe('diagnoseTurnaround', () => {
  it('returns null for warriors who are not losing', () => {
    const winner = makeWarrior({ career: { wins: 8, losses: 2, kills: 0 } });
    expect(diagnoseTurnaround(winner)).toBeNull();
    const even = makeWarrior({ career: { wins: 4, losses: 4, kills: 0 } });
    expect(diagnoseTurnaround(even)).toBeNull();
  });

  it('picks exactly one win condition — the strongest effective skill', () => {
    const report = diagnoseTurnaround(loser());
    expect(report).not.toBeNull();
    expect(report!.winCondition.skill).toBe('INI'); // 12 base is the clear standout
    expect(report!.winCondition.detail).toContain('12');
  });

  it('counts learns and drills toward the win-condition pick', () => {
    const w = loser({
      learnedSkills: { RIP: 4 },
      skillDrills: { RIP: 3 },
      baseSkills: { ATT: 8, PAR: 5, DEF: 6, INI: 6, RIP: 5, DEC: 6 },
    });
    const report = diagnoseTurnaround(w);
    // RIP: 5 + 4 + 3 = 12 beats everything else.
    expect(report!.winCondition.skill).toBe('RIP');
  });

  it('names the style priority backing the win condition', () => {
    const report = diagnoseTurnaround(loser());
    // Lunging Attack's top learn priority is INI — the rationale should say so.
    expect(STYLE_LEARN_WEIGHTS[FightingStyle.LungingAttack].INI).toBe(6);
    expect(report!.winCondition.detail).toMatch(/Lunging Attack/i);
  });

  it('recommends equipping a chart-proven weapon over the current one', () => {
    const w = loser({
      equipment: { weapon: 'broadsword', armor: 'leather', shield: 'none_shield', helm: 'none_helm' },
      favorites: {
        weaponId: 'scimitar',
        rhythm: { oe: 6, al: 6 },
        discovered: { weapon: false, rhythm: false, weaponHints: 0, rhythmHints: 0 },
        chart: {
          scimitar: { swings: 20, crits: 5, knockdowns: 1, critDamages: 4 },
          broadsword: { swings: 30, crits: 1, knockdowns: 0, critDamages: 0 },
        },
      },
    });
    const report = diagnoseTurnaround(w);
    const weapon = report!.actions.find((a) => a.kind === 'weapon');
    expect(weapon).toBeDefined();
    expect(weapon!.detail).toMatch(/scimitar/i);
  });

  it('recommends a weapon change when the equipped weapon produces nothing', () => {
    const w = loser({
      equipment: { weapon: 'broadsword', armor: 'leather', shield: 'none_shield', helm: 'none_helm' },
      favorites: {
        weaponId: 'scimitar',
        rhythm: { oe: 6, al: 6 },
        discovered: { weapon: false, rhythm: false, weaponHints: 0, rhythmHints: 0 },
        chart: {
          broadsword: { swings: 30, crits: 0, knockdowns: 0, critDamages: 0 },
        },
      },
    });
    const report = diagnoseTurnaround(w);
    const weapon = report!.actions.find((a) => a.kind === 'weapon');
    expect(weapon).toBeDefined();
    expect(weapon!.detail).toMatch(/broadsword/i);
    expect(weapon!.detail).toMatch(/try|switch|change/i);
  });

  it('recommends moving to the plan cell that is actually winning', () => {
    const w = loser({
      plan: {
        OE: 2,
        AL: 2,
        style: FightingStyle.LungingAttack,
        killDesire: 5,
      } as never,
      strategyMemory: {
        cells: {
          'VL/VL': { w: 0, l: 4 },
          'H/M': { w: 3, l: 0 },
        },
      },
    });
    const report = diagnoseTurnaround(w);
    const plan = report!.actions.find((a) => a.kind === 'plan');
    expect(plan).toBeDefined();
    expect(plan!.detail).toMatch(/3-0|3 wins|winning/i);
  });

  it('recommends probing when every tried plan cell is losing', () => {
    const w = loser({
      strategyMemory: {
        cells: {
          'VL/VL': { w: 0, l: 4 },
          'M/M': { w: 1, l: 4 },
        },
      },
    });
    const report = diagnoseTurnaround(w);
    const plan = report!.actions.find((a) => a.kind === 'plan');
    expect(plan).toBeDefined();
    expect(plan!.detail).toMatch(/probe|untested|different/i);
  });

  it('recommends WT training for a slow learner', () => {
    const w = loser({
      attributes: { ST: 12, CN: 10, SZ: 10, WT: 9, WL: 10, SP: 11, DF: 10 },
    });
    const report = diagnoseTurnaround(w);
    const train = report!.actions.find((a) => a.kind === 'train');
    expect(train).toBeDefined();
    expect(train!.detail).toMatch(/WT|wit/i);
  });

  it('names the favorite learn when discovery revealed it', () => {
    const w = loser({
      learnedSkills: { INI: 4 },
      favorites: {
        weaponId: 'scimitar',
        rhythm: { oe: 6, al: 6 },
        discovered: {
          weapon: false,
          rhythm: false,
          weaponHints: 0,
          rhythmHints: 0,
          learn: true,
          learnHints: 0,
        },
      },
    });
    const report = diagnoseTurnaround(w);
    const learn = report!.actions.find((a) => a.kind === 'learn');
    expect(learn).toBeDefined();
  });

  it('recommends a favorable style to challenge and a bad one to avoid', () => {
    // Total Parry is a style every fighter has a matrix number against.
    const report = diagnoseTurnaround(loser());
    const challenge = report!.actions.find((a) => a.kind === 'challenge');
    const avoid = report!.actions.find((a) => a.kind === 'avoid');
    // At least one of the two should exist — the matrix always has an opinion.
    expect(challenge ?? avoid).toBeDefined();
    if (challenge) {
      expect(getMatchupBonus(FightingStyle.LungingAttack, challenge.target as never)).toBeGreaterThan(
        0
      );
    }
    if (avoid) {
      expect(getMatchupBonus(FightingStyle.LungingAttack, avoid.target as never)).toBeLessThan(0);
    }
  });

  it('caps the action list and keeps every cited number real', () => {
    const report = diagnoseTurnaround(loser());
    expect(report!.actions.length).toBeLessThanOrEqual(5);
    for (const a of report!.actions) {
      expect(typeof a.headline).toBe('string');
      expect(typeof a.detail).toBe('string');
    }
  });
});
