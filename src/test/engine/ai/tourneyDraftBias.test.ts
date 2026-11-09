// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { tourneyDraftBonus } from '@/engine/ai/workers/recruitmentWorker';
import { FightingStyle } from '@/types/shared.types';
import type { PoolWarrior } from '@/types/state.types';

/** Minimal pool-candidate shape — the fields tourneyDraftBonus reads. */
const cand = (attrs: Record<string, number>, style: FightingStyle): PoolWarrior =>
  ({ id: `c_${style}`, style, attributes: attrs } as never);

describe('tourneyDraftBonus — archetype-driven tournament draft bias', () => {
  it('returns 0 outside a tournament campaign', () => {
    const w = cand({ WT: 21, ST: 15, DF: 15 }, FightingStyle.LungingAttack);
    expect(tourneyDraftBonus(w, 'EXPANSION')).toBe(0);
    expect(tourneyDraftBonus(w, undefined)).toBe(0);
  });

  it('rewards a strong winning-frame fit even at moderate wit (scum rookie profile)', () => {
    // CN/WL-heavy small Total Parry — a pureDefensive frame, viable Rookies
    // pick despite WT 9 (the flat WT threshold gave this candidate nothing).
    const scum = cand(
      { WT: 9, CN: 17, WL: 17, SZ: 5, SP: 5, ST: 11, DF: 9 },
      FightingStyle.TotalParry
    );
    expect(tourneyDraftBonus(scum, 'TOURNAMENT_CAMPAIGN')).toBeGreaterThan(0);
  });

  it('rewards a high-wit offensive frame (the 21-WT champions signal)', () => {
    const frame = cand(
      { WT: 21, ST: 15, DF: 15, CN: 9, SZ: 7, SP: 11, WL: 13 },
      FightingStyle.LungingAttack
    );
    expect(tourneyDraftBonus(frame, 'TOURNAMENT_CAMPAIGN')).toBeGreaterThan(0);
  });

  it('a strong frame out-scores a formless one under the same intent', () => {
    const frame = cand(
      { WT: 21, ST: 15, DF: 15, CN: 9, SZ: 7, SP: 11, WL: 13 },
      FightingStyle.LungingAttack
    );
    const formless = cand(
      { WT: 7, ST: 7, DF: 7, CN: 7, SZ: 15, SP: 15, WL: 7 },
      FightingStyle.LungingAttack
    );
    expect(tourneyDraftBonus(frame, 'TOURNAMENT_CAMPAIGN')).toBeGreaterThan(
      tourneyDraftBonus(formless, 'TOURNAMENT_CAMPAIGN')
    );
  });
});
