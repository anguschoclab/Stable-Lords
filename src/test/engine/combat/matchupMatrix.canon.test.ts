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
import { FightingStyle } from '@/types/shared.types';

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
    // (TP>AB) — sim runs 64.2% FOR the aimed blow; the matrix's AB edge
    // stands and no pin is asserted here.
    // GUARDRAIL-BLOCKED: TP>ST — archive + probe (52%) supported it, but
    // every legal retune breached the 80/20 balance invariant (+1/−1 → 81%,
    // +1/0 → 84%); passives dominate the pairing. Needs a TP/ST rebalance
    // campaign — no pin asserted.
  ])('%s is archive-and-sim-favored over %s', (fav, dog) => {
    expect(favored(fav, dog)).toBe(true);
  });
});

describe('scum metagame (adjudicated canon-accurate, BACKLOG §3)', () => {
  it('total parries are favored over the classic offensive styles', () => {
    // TP>ST omitted — guardrail-blocked (80/20 invariant); see above.
    for (const off of [FightingStyle.BashingAttack, FightingStyle.SlashingAttack]) {
      expect(favored(FightingStyle.TotalParry, off), `TP > ${off}`).toBe(true);
    }
  });
});
