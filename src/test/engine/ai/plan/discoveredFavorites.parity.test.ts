/**
 * V26 parity — AI plans must consume the same discovered favorites a player
 * would see on the favorites panel:
 *
 *  - discovered rhythm → OE/AL steered into the favorite's close-match band,
 *    then clamped back inside the style's doctrine caps (a TP scum never
 *    exceeds its OE/AL ceiling even when the favorite says 9/9)
 *  - discovered tactic → the correct plan slot holds the favorite
 *    (offensive → offensiveTactic, defensive → defensiveTactic)
 *  - undiscovered → no steering at all: strict information parity — the AI
 *    reads only what discovery has revealed, never the hidden fields
 *
 * The hook slots after the strategic layer / before challenge-plan emission
 * in `aiPlanForWarrior`, the shared path every stable (and any future
 * player-authored equivalent) flows through.
 *
 * Live since Phase 4 — guards `applyDiscoveredFavorites` + lab probing.
 */
import { describe, it, expect } from 'vitest';
import { aiPlanForWarrior } from '@/engine/ai/plan/coreGenerator';
import { makeComputedWarrior } from '@/test/_fixtures/factories';
import { FightingStyle } from '@/types/shared.types';
import type { WarriorFavorites } from '@/types/warrior.types';

const favFor = (over: Partial<WarriorFavorites> = {}): WarriorFavorites =>
  ({
    weaponId: 'broadsword',
    rhythm: { oe: 9, al: 9 },
    tactic: 'Lunge',
    discovered: {
      weapon: false,
      rhythm: false,
      weaponHints: 0,
      rhythmHints: 0,
      tactic: false,
      ...over.discovered,
    },
    ...over,
  }) as WarriorFavorites;

const planFor = (w: Parameters<typeof aiPlanForWarrior>[0]['w'], personality = 'Pragmatic' as const) =>
  aiPlanForWarrior({ w, personality, philosophy: 'Balanced', now: 10 });

describe('discovered rhythm steers the plan', () => {
  it('pulls OE/AL into the favorite band for a neutral style', () => {
    const w = makeComputedWarrior({}, FightingStyle.StrikingAttack, {
      favorites: favFor({ discovered: { rhythm: true } as never }),
    });
    const plan = planFor(w);
    expect(Math.abs(plan.OE - 9)).toBeLessThanOrEqual(1);
    expect(Math.abs(plan.AL - 9)).toBeLessThanOrEqual(1);
  });

  it('clamps the pull at style doctrine caps (TP scum cannot hot-rhythm)', () => {
    // WT10/DF10 TP → scum doctrine caps OE/AL at 5.
    const w = makeComputedWarrior({ WT: 10, DF: 10 }, FightingStyle.TotalParry, {
      favorites: favFor({ discovered: { rhythm: true } as never }),
    });
    const plan = planFor(w);
    expect(plan.OE).toBeLessThanOrEqual(5);
    expect(plan.AL).toBeLessThanOrEqual(5);
    // ...but the steer must still have pulled UP to the cap — a do-nothing
    // implementation leaves OE/AL at the doctrine floor instead.
    expect(plan.OE).toBeGreaterThanOrEqual(4);
    expect(plan.AL).toBeGreaterThanOrEqual(4);
  });

  it('leaves the plan alone when rhythm is undiscovered (information parity)', () => {
    const discovered = makeComputedWarrior({}, FightingStyle.StrikingAttack, {
      favorites: favFor({ discovered: { rhythm: true } as never }),
    });
    const blind = makeComputedWarrior({}, FightingStyle.StrikingAttack, {
      favorites: favFor({ discovered: { rhythm: false } as never }),
    });
    const pDiscovered = planFor(discovered);
    const pBlind = planFor(blind);
    // The undiscovered twin must NOT be pulled toward 9/9.
    expect(
      Math.abs(pBlind.OE - 9) > Math.abs(pDiscovered.OE - 9) ||
        Math.abs(pBlind.AL - 9) > Math.abs(pDiscovered.AL - 9)
    ).toBe(true);
  });
});

describe('discovered tactic fills the matching plan slot', () => {
  it('places a discovered offensive favorite on offensiveTactic', () => {
    const w = makeComputedWarrior({}, FightingStyle.StrikingAttack, {
      favorites: favFor({ tactic: 'Lunge', discovered: { tactic: true } as never }),
    });
    const plan = planFor(w);
    expect(plan.offensiveTactic).toBe('Lunge');
  });

  it('places a discovered defensive favorite on defensiveTactic', () => {
    const w = makeComputedWarrior({}, FightingStyle.StrikingAttack, {
      favorites: favFor({ tactic: 'Dodge', discovered: { tactic: true } as never }),
    });
    const plan = planFor(w);
    expect(plan.defensiveTactic).toBe('Dodge');
    expect(plan.offensiveTactic).not.toBe('Dodge');
  });

  it('keeps the preset tactic when the favorite is undiscovered', () => {
    const discovered = makeComputedWarrior({}, FightingStyle.StrikingAttack, {
      favorites: favFor({ tactic: 'Lunge', discovered: { tactic: true } as never }),
    });
    const blind = makeComputedWarrior({}, FightingStyle.StrikingAttack, {
      favorites: favFor({ tactic: 'Lunge', discovered: { tactic: false } as never }),
    });
    const pBlind = planFor(blind);
    const pDiscovered = planFor(discovered);
    expect(pDiscovered.offensiveTactic).toBe('Lunge');
    expect(pBlind.offensiveTactic).not.toBe('Lunge');
  });
});

describe('strategy-lab exploration probes WS-suited tactics', () => {
  it('an exploring stable can fight a non-preset tactic it might discover', () => {
    // A losing plan-memory record forces the explore arm; over a range of
    // weeks the explored plans must carry at least one tactic OUTSIDE the
    // stable's static baseline — otherwise the AI can never organically
    // earn a tactic discovery the way a tinkering player can.
    // (Baseline verified: WS emits exactly {Bash, Parry} on every week.)
    const w = makeComputedWarrior({}, FightingStyle.WallOfSteel, {
      strategyMemory: { cells: { 'M/M': { w: 1, l: 8 } }, recentLossFactors: [] },
    });
    const tactics = new Set<string>();
    for (let week = 1; week <= 40; week++) {
      const plan = aiPlanForWarrior({ w, personality: 'Pragmatic', philosophy: 'Balanced', now: week });
      if (plan.offensiveTactic) tactics.add(plan.offensiveTactic);
      if (plan.defensiveTactic) tactics.add(plan.defensiveTactic);
    }
    expect(tactics.size).toBeGreaterThan(2);
  });
});
