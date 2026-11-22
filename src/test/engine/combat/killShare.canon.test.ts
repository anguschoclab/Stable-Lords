/**
 * Per-style kill-share differentiation — canon pin.
 *
 * The overall kill rate is only half the invariant: Duel2's lethality is
 * style-typed. Total Parries almost never kill (walls don't try), while
 * the pure offensive styles convert wins to kills at several times the
 * rate. The 2026-11-22 world re-baseline measured kill-share-of-wins:
 *   AB 9.6 | SL 6.9 | ST 6.4 | LU 5.7 | BA 5.5 — offensive cluster
 *   PS 3.6 | WS 3.5 | PL 3.3 | PR 2.3 | TP 2.0 — defensive cluster
 * This spec pins the ordering on the fixture surface (all-15 warriors,
 * AI plans, balanced opponent rotation) so a mechanic change that
 * flattens style-typed lethality fails loudly — not silently inside an
 * aggregate band.
 */
import { describe, it, expect } from 'vitest';
import { simulateFight } from '@/engine/simulate';
import { aiPlanForWarrior } from '@/engine/ai/plan/coreGenerator';
import { makeComputedWarrior } from '@/test/_fixtures/factories';
import { FightingStyle } from '@/types/shared.types';
import type { Warrior } from '@/types/warrior.types';

const STYLES = Object.values(FightingStyle);
const OFFENSIVE = [
  FightingStyle.AimedBlow,
  FightingStyle.BashingAttack,
  FightingStyle.LungingAttack,
  FightingStyle.SlashingAttack,
  FightingStyle.StrikingAttack,
];
const STD = { ST: 15, CN: 15, SZ: 15, WT: 15, WL: 15, SP: 15, DF: 15 };
const ROUNDS = 15;

/** Kills dealt / wins per style, every style seeing every other style ROUNDS times. */
function killShares() {
  const kills: Record<string, number> = {};
  const wins: Record<string, number> = {};
  let seed = 13;
  for (const x of STYLES)
    for (const y of STYLES)
      for (let r = 0; r < ROUNDS; r++) {
        if (x === y) continue;
        seed += 1;
        const wX = makeComputedWarrior(STD, x, {
          id: `X${seed}` as never,
          name: `X${seed}`,
          fame: 0,
          age: 20,
        });
        const wY = makeComputedWarrior(STD, y, {
          id: `Y${seed}` as never,
          name: `Y${seed}`,
          fame: 0,
          age: 20,
        });
        const pX = aiPlanForWarrior({
          w: wX,
          personality: 'Bold' as never,
          philosophy: '',
          opponentStyle: y,
        });
        const pY = aiPlanForWarrior({
          w: wY,
          personality: 'Bold' as never,
          philosophy: '',
          opponentStyle: x,
        });
        // A/D alternation keeps position effects balanced.
        const aIsX = (seed + r) % 2 === 0;
        const o = simulateFight({
          planA: aIsX ? pX : pY,
          planD: aIsX ? pY : pX,
          warriorA: (aIsX ? wX : wY) as Warrior,
          warriorD: (aIsX ? wY : wX) as Warrior,
          providedRng: seed * 7919,
          weather: 'Clear',
          headless: true,
        });
        const winnerStyle =
          o.winner === null ? null : o.winner === 'A' ? (aIsX ? x : y) : aIsX ? y : x;
        if (winnerStyle) {
          wins[winnerStyle] = (wins[winnerStyle] ?? 0) + 1;
          if (o.by === 'Kill') kills[winnerStyle] = (kills[winnerStyle] ?? 0) + 1;
        }
      }
  const share = Object.fromEntries(
    STYLES.map((s) => [s, (kills[s] ?? 0) / Math.max(1, wins[s] ?? 0)])
  ) as Record<FightingStyle, number>;
  return { share, kills, wins };
}

describe('per-style kill-share differentiation (canon lethality)', () => {
  const { share, wins } = killShares();

  it('every style produced enough wins to measure share on', () => {
    for (const s of STYLES) expect(wins[s] ?? 0, `${s} wins`).toBeGreaterThan(20);
  });

  it('the two walls are the two lowest kill shares — walls do not kill', () => {
    // World surface shows TP/WS at 2.0%/3.5% (strictly lowest). On the
    // fixture they tie at ~6.8–6.9% — assert the pair, not the order:
    // a coin-flip margin between the two walls must not fail the pin.
    const sorted = [...STYLES].sort((a, b) => (share[a] ?? 0) - (share[b] ?? 0));
    const bottomTwo = new Set(sorted.slice(0, 2));
    expect(
      bottomTwo,
      `bottom two: ${[...bottomTwo].map((s) => `${s} ${(share[s] * 100).toFixed(1)}%`).join(', ')}`
    ).toEqual(new Set([FightingStyle.TotalParry, FightingStyle.WallOfSteel]));
  });

  // NB: PARRY-STRIKE reads ~20% on this fixture vs ~3.6% in the world —
  // a stylized-surface divergence (uniform all-15 builds reward its
  // riposte pattern), not a defect to flatten away. Two-surface rule:
  // the world is the truth surface; the fixture pins ordering only.

  it('every offensive style kills at a higher share than both walls', () => {
    const walls = [FightingStyle.TotalParry, FightingStyle.WallOfSteel];
    const wallMax = Math.max(...walls.map((s) => share[s]));
    for (const s of OFFENSIVE) {
      expect(
        share[s],
        `${s} ${(share[s] * 100).toFixed(1)}% vs wall max ${(wallMax * 100).toFixed(1)}%`
      ).toBeGreaterThan(wallMax);
    }
  });

  it('offensive cluster out-kills the defensive cluster on average', () => {
    const defensive = STYLES.filter((s) => !OFFENSIVE.includes(s));
    const offMean = OFFENSIVE.reduce((a, s) => a + share[s], 0) / OFFENSIVE.length;
    const defMean = defensive.reduce((a, s) => a + share[s], 0) / defensive.length;
    expect(
      offMean,
      `off ${(offMean * 100).toFixed(1)}% vs def ${(defMean * 100).toFixed(1)}%`
    ).toBeGreaterThan(defMean);
  });
});
