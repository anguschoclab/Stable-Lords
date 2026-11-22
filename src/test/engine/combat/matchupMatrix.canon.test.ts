/**
 * V31 canon — style-vs-style dominance directions from the Terrablood archive
 * (Hoser Report #9, arena-25 records; adjudicated DN-S6: retune probe under
 * the two-source rule — a cell only retunes where BOTH the archive record and
 * the style-probe sim evidence contradict the matrix).
 *
 * The matrix is a *tuned* house balance tool, so these pins assert only the
 * dominance directions the archive records unambiguously — never magnitudes.
 * Direction check: getMatchupBonus(X,Y) > getMatchupBonus(Y,X) means X is
 * favored attacking Y relative to Y attacking X.
 */
import { describe, it, expect } from 'vitest';
import { getMatchupBonus } from '@/constants/combat/combat/matchup';
import { simulateFight } from '@/engine/simulate';
import { aiPlanForWarrior } from '@/engine/ai/plan/coreGenerator';
import { makeComputedWarrior } from '@/test/_fixtures/factories';
import { FightingStyle } from '@/types/shared.types';
import type { Warrior } from '@/types/warrior.types';

/** X favored over Y: X's attacker bonus vs Y exceeds Y's attacker bonus vs X. */
const favored = (x: FightingStyle, y: FightingStyle) =>
  getMatchupBonus(x, y) > getMatchupBonus(y, x);

describe('archive-recorded dominance directions (Hoser #9, arena 25)', () => {
  it.each([
    // Lungers run over bashers — the arena's clearest record (sim: 68.5%).
    [FightingStyle.LungingAttack, FightingStyle.BashingAttack],
    // Parry-ripostes fed on lungers — the classic counter record (sim: 56.8%).
    [FightingStyle.ParryRiposte, FightingStyle.LungingAttack],
    // PROBE-REJECTED under the two-source rule: "scum answers the surgeon"
    // (TP>AB) — the isolated matchup runs FOR the aimed blow (V31 style-
    // typical probe 35.8% TP; re-probe 2026-11-22 all-15s+AI 47.3% TP).
    // The world surface DOES reproduce canon direction (TP>AB ≈70%) — via
    // TP's global dominance, not a pair-specific edge — so this is an
    // adjudicated house divergence (BACKLOG §3): the matrix's +1 AB edge
    // keeps the isolated pairing honest; no TP>AB pin is asserted.
    // RESOLVED EMERGENTLY: TP>ST — the canon direction holds through TP's
    // identity (52% all-15s+AI, ≈72% world matrix) while the matrix cell
    // deliberately stays −1/+1: every retune breached the 80/20 invariant
    // (+1/−1 → 81%, +1/0 → 84%). Pinned by win-rate below, not by bonus.
  ])('%s is archive-and-sim-favored over %s', (fav, dog) => {
    expect(favored(fav, dog)).toBe(true);
  });
});

describe('scum metagame (adjudicated canon-accurate, BACKLOG §3)', () => {
  it('total parries are favored over the classic offensive styles', () => {
    // TP>ST kept off the bonus-axis pin deliberately — its direction is
    // pinned by win-rate in the block below (matrix cell stays −1/+1).
    for (const off of [FightingStyle.BashingAttack, FightingStyle.SlashingAttack]) {
      expect(favored(FightingStyle.TotalParry, off), `TP > ${off}`).toBe(true);
    }
  });
});

describe('emergent canon direction (win-rate pin, seeded)', () => {
  const STD = { ST: 15, CN: 15, SZ: 15, WT: 15, WL: 15, SP: 15, DF: 15 };
  const N = 400;

  /** Seeded A/D-balanced pair probe — deterministic under providedRng. */
  function pairWins(x: FightingStyle, y: FightingStyle) {
    let xw = 0;
    for (let i = 0; i < N; i++) {
      const aIsX = i % 2 === 0;
      const wX = makeComputedWarrior(STD, x, {
        id: `X${i}` as never,
        name: `X${i}`,
        fame: 0,
        age: 20,
      });
      const wY = makeComputedWarrior(STD, y, {
        id: `Y${i}` as never,
        name: `Y${i}`,
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
      const o = simulateFight({
        planA: aIsX ? pX : pY,
        planD: aIsX ? pY : pX,
        warriorA: (aIsX ? wX : wY) as Warrior,
        warriorD: (aIsX ? wY : wX) as Warrior,
        providedRng: i * 7919 + 42,
        weather: 'Clear',
        headless: true,
      });
      if (o.winner === (aIsX ? 'A' : 'D')) xw++;
    }
    return xw;
  }

  it('total parry beats striking attack by the archive direction', () => {
    // The matrix cell stays −1/+1 (80/20 guardrail); TP's dominance arrives
    // through its identity. 52.0% at authoring — a flip here means a real
    // mechanic change eroded the canon direction, investigate not re-seed.
    const tpWins = pairWins(FightingStyle.TotalParry, FightingStyle.StrikingAttack);
    expect(tpWins, `TP ${tpWins}/${N} vs ST`).toBeGreaterThan(N / 2);
  });
});
