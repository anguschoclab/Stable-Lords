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
    // Lungers run over bashers — the arena's clearest record.
    [FightingStyle.LungingAttack, FightingStyle.BashingAttack],
    // Parry-ripostes fed on lungers — the classic counter record.
    [FightingStyle.ParryRiposte, FightingStyle.LungingAttack],
    // Total parries blunt aimed blows — scum answers the surgeon.
    [FightingStyle.TotalParry, FightingStyle.AimedBlow],
  ])('%s is archive-favored over %s', (fav, dog) => {
    expect(favored(fav, dog)).toBe(true);
  });
});

describe('scum metagame (adjudicated canon-accurate, BACKLOG §3)', () => {
  it('total parries are favored over the classic offensive styles', () => {
    for (const off of [
      FightingStyle.BashingAttack,
      FightingStyle.SlashingAttack,
      FightingStyle.StrikingAttack,
    ]) {
      expect(favored(FightingStyle.TotalParry, off), `TP > ${off}`).toBe(true);
    }
  });
});
