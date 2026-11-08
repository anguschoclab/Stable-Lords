/**
 * AI turnaround behavior — the "Tinkering strategies" doctrine applied to
 * rival stables:
 *  - drill the skill the warrior is demonstrably learning (suspected
 *    favorite learn) rather than blindly following the style default
 *  - train WT on young slow-witted warriors so arena lessons actually land
 */
import { describe, it, expect } from 'vitest';
import {
  performAISkillDrill,
  selectTrainingFocus,
} from '@/engine/ai/workers/rosterWorkerTraining';
import { makeWarrior } from '@/test/_fixtures/factories';
import { FightingStyle } from '@/types/shared.types';
import type { RivalStableData } from '@/types/state.types';
import type { IRNGService } from '@/engine/core/rng/IRNGService';

const passRng: IRNGService = {
  next: () => 0.0, // every chance roll succeeds
  uuid: () => 'u',
  pick: <T>(arr: T[]) => arr[0] as T,
  roll: (min: number) => min,
  shuffle: <T>(arr: T[]) => arr,
  rollWeighted: <K extends string>(w: Partial<Record<K, number>>): K => Object.keys(w)[0] as K,
  chance: () => true,
};

const stable = { id: 'r1', trainers: [] } as unknown as RivalStableData;

describe('performAISkillDrill — evidence-driven focus', () => {
  it('drills the suspected favorite learn over the style default', () => {
    // StrikingAttack's default drill is ATT, but this warrior keeps
    // learning RIP in the arena — the AI follows the evidence.
    const w = makeWarrior({
      style: FightingStyle.StrikingAttack,
      learnedSkills: { RIP: 4 },
      skillDrills: {},
    });
    const out = performAISkillDrill(w, stable, passRng);
    expect(out.skillDrills?.RIP ?? 0).toBe(1);
    expect(out.skillDrills?.ATT ?? 0).toBe(0);
  });

  it('falls back to the style default when no learn signal exists', () => {
    const w = makeWarrior({
      style: FightingStyle.StrikingAttack,
      learnedSkills: { RIP: 1 }, // below the suspicion threshold
      skillDrills: {},
    });
    const out = performAISkillDrill(w, stable, passRng);
    expect(out.skillDrills?.ATT ?? 0).toBe(1);
  });

  it('skips the suspected learn when it is already drill-capped', () => {
    const w = makeWarrior({
      style: FightingStyle.StrikingAttack,
      learnedSkills: { RIP: 4 },
      skillDrills: { RIP: 3 }, // at SKILL_DRILL_CAP
    });
    const out = performAISkillDrill(w, stable, passRng);
    // Falls through to the style primary.
    expect(out.skillDrills?.RIP).toBe(3);
    expect(out.skillDrills?.ATT ?? 0).toBe(1);
  });
});

describe('selectTrainingFocus — canon godling doctrine', () => {
  it('trains WT on a young warrior whose wit gates arena learning', () => {
    const w = makeWarrior({
      style: FightingStyle.StrikingAttack,
      attributes: { ST: 12, CN: 10, SZ: 10, WT: 9, WL: 10, SP: 11, DF: 10 },
      career: { wins: 3, losses: 4, kills: 0 }, // 7 bouts — still a prospect
    });
    expect(selectTrainingFocus(w, 'Winter')).toBe('WT');
  });

  it('stops burning WT once the learn-rate floor is reached', () => {
    const w = makeWarrior({
      style: FightingStyle.StrikingAttack,
      attributes: { ST: 12, CN: 10, SZ: 10, WT: 13, WL: 10, SP: 11, DF: 10 },
      career: { wins: 3, losses: 4, kills: 0 },
    });
    expect(selectTrainingFocus(w, 'Winter')).not.toBe('WT');
  });

  it('does not force WT on a veteran past the prospect cutoff', () => {
    const w = makeWarrior({
      style: FightingStyle.StrikingAttack,
      // DF is lowest so the generic lowest-attr path picks DF — the point is
      // that the WT floor no longer hijacks the pick.
      attributes: { ST: 12, CN: 10, SZ: 10, WT: 9, WL: 10, SP: 11, DF: 8 },
      career: { wins: 10, losses: 12, kills: 0 }, // 22 bouts — past the cutoff
    });
    expect(selectTrainingFocus(w, 'Winter')).not.toBe('WT');
  });

  it('leaves the scum-TP train order untouched', () => {
    const w = makeWarrior({
      style: FightingStyle.TotalParry,
      attributes: { ST: 10, CN: 10, SZ: 10, WT: 9, WL: 10, SP: 10, DF: 9 },
      career: { wins: 1, losses: 5, kills: 0 },
    });
    // Scum TP trains WL first — WT preference must not hijack the order.
    expect(selectTrainingFocus(w, 'Winter')).toBe('WL');
  });
});
