/**
 * Canon targeting doctrine — the managerial meta-knowledge layer.
 *
 * `scorePairwiseMatchup` knows the mechanical matchup matrix (±1 deltas);
 * this table is what veteran managers *believe* about styles, independent of
 * engine truth — the articles' challenge/avoid doctrine:
 *
 *  TP scum: "the aimer is a scum's worst nightmare, a lunger his best
 *   friend" — avoid AB (canon 90-95% loss), challenge LU (60-80% win),
 *   fear hard-hitters, prefer other shells it can out-endure.
 *  AB: "Scum, scum, and more scum" — farm defensive styles; "avoid lungers
 *   like the plague" plus BA/SL/ST early.
 *
 * Bias units match the post-transform score scale in boutBidding (−5..+5).
 */
import { FightingStyle } from '@/types/shared.types';

type StyleBias = Partial<Record<FightingStyle, number>>;

const TP: StyleBias = {
  [FightingStyle.AimedBlow]: -4, // canon: loses 90-95% — the nemesis
  [FightingStyle.BashingAttack]: -1.5,
  [FightingStyle.StrikingAttack]: -1.5,
  [FightingStyle.ParryStrike]: -1.5,
  [FightingStyle.SlashingAttack]: -1, // "slashers do reasonably well vs scum"
  [FightingStyle.LungingAttack]: 3, // best friend — 60-80% canon win rate
  [FightingStyle.ParryLunge]: 1,
  [FightingStyle.ParryRiposte]: 1.5,
  [FightingStyle.WallOfSteel]: 1,
  [FightingStyle.TotalParry]: 0.5, // scum wars: out-endure the other shell
};

const AB: StyleBias = {
  [FightingStyle.TotalParry]: 3.5, // "scum never want to see ABs"
  [FightingStyle.ParryRiposte]: 2.5,
  [FightingStyle.ParryLunge]: 2,
  [FightingStyle.WallOfSteel]: 1.5,
  [FightingStyle.ParryStrike]: 1.5,
  [FightingStyle.AimedBlow]: 1, // mirror fights are even; slight aim preference
  [FightingStyle.LungingAttack]: -3.5, // "avoid like the plague"
  [FightingStyle.BashingAttack]: -2.5,
  [FightingStyle.SlashingAttack]: -2,
  [FightingStyle.StrikingAttack]: -1.5,
};

const CANON_TARGETING: Partial<Record<FightingStyle, StyleBias>> = {
  [FightingStyle.TotalParry]: TP,
  [FightingStyle.AimedBlow]: AB,
};

/**
 * Managerial matchup bias for a fighter of `attStyle` facing `oppStyle`.
 * Positive = canon says hunt this style; negative = canon says avoid.
 * `attFights` enables the rookie carve-out: a TP under 10 FE challenges
 * everything but AB (canon), so the negative biases soften early.
 */
export function canonTargetingBias(
  attStyle: FightingStyle,
  oppStyle: FightingStyle,
  attFights?: number
): number {
  const bias = CANON_TARGETING[attStyle]?.[oppStyle] ?? 0;
  if (attStyle === FightingStyle.TotalParry && bias < 0 && (attFights ?? 99) < 10) {
    return bias * 0.4; // young scum learns by fighting everyone but aimers
  }
  return bias;
}
