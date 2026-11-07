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
 *  PR: "rippers eat strikers and scum, die to aimed blows" — the Arena 93
 *   ripper articles call AB "the bane" of the style (a −3 bias trips the
 *   boutAcceptance hard-avoid) and slashers "pretty tough".
 *  SL: "slashers eat lungers" — every slasher article says it; "the worst
 *   style to be out against is the long-haul scum" (burns out on the shell);
 *   decisive strikers and the defensive walls are respected, PRs are a
 *   tough-but-winnable go.
 *  ST: "best matchups: bashers, slashers, parry lungers, and aimed blows;
 *   worst: parry ripostes and wall of steels" (Assur) — the pure offensive
 *   hunts soft offensives and out-endures scum (Blind Man/Talon/Tex), and
 *   fears the defenses that weather the first blow.
 *  PL: "prey on strikers, PS, PR and slashers ... stay away from lungers
 *   and bashers" in the first few fights, "always remain cautious" after —
 *   veterans still bid the heavy hitters, rookies refuse them outright;
 *   Tripwire steers clear of scum that burn out the fragile frame.
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

const PR: StyleBias = {
  [FightingStyle.StrikingAttack]: 2.5, // natural striker-killer
  [FightingStyle.TotalParry]: 1.5, // scum-hunter — ripostes starve the shell
  [FightingStyle.ParryStrike]: 1,
  [FightingStyle.LungingAttack]: 0,
  [FightingStyle.BashingAttack]: -1,
  [FightingStyle.SlashingAttack]: -1.5, // "pretty tough" matchup
  [FightingStyle.AimedBlow]: -3, // "the bane" — hard-avoid band (≤ −3)
};

const SL: StyleBias = {
  [FightingStyle.LungingAttack]: 2, // "slashers eat lungers" — every article
  [FightingStyle.ParryRiposte]: 1, // "PR types give us fits but we usually win"
  [FightingStyle.TotalParry]: -2, // the worst out — burns out on the shell
  [FightingStyle.StrikingAttack]: -1.5, // decisive strikers beat them to it
  [FightingStyle.ParryStrike]: -1,
  [FightingStyle.BashingAttack]: -1,
  [FightingStyle.WallOfSteel]: -1,
};

const PL: StyleBias = {
  [FightingStyle.StrikingAttack]: 1.5, // "prey on strikers"
  [FightingStyle.ParryStrike]: 1.5, // the article's hunting list
  [FightingStyle.SlashingAttack]: 1.5, // slashers are prey
  [FightingStyle.ParryRiposte]: 1, // rippers are prey
  [FightingStyle.TotalParry]: -1, // scum burn out the fragile frame
  [FightingStyle.LungingAttack]: -2, // "always remain cautious"
  [FightingStyle.BashingAttack]: -2.5, // hardest hitters — deepest caution
};

const ST: StyleBias = {
  [FightingStyle.BashingAttack]: 2, // Assur's best matchup — soft offensives
  [FightingStyle.SlashingAttack]: 2, // Assur's best matchup — burn-out slashers
  [FightingStyle.ParryLunge]: 1.5, // Assur: "parry lungers" best matchup
  [FightingStyle.AimedBlow]: 1.5, // Assur: "aimed blows" best matchup
  [FightingStyle.TotalParry]: 1.5, // Talon/Tex: the scum-breaker — out-endures the shell
  [FightingStyle.LungingAttack]: 1, // Crimson: the decise edge beats lungers
  [FightingStyle.ParryRiposte]: -2.5, // Assur's worst — rippers answer the first blow
  [FightingStyle.WallOfSteel]: -2, // Assur's worst — the wall weathers it
};

const CANON_TARGETING: Partial<Record<FightingStyle, StyleBias>> = {
  [FightingStyle.TotalParry]: TP,
  [FightingStyle.AimedBlow]: AB,
  [FightingStyle.ParryRiposte]: PR,
  [FightingStyle.ParryLunge]: PL,
  [FightingStyle.SlashingAttack]: SL,
  [FightingStyle.StrikingAttack]: ST,
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
  if (
    attStyle === FightingStyle.ParryLunge &&
    bias < 0 &&
    (oppStyle === FightingStyle.LungingAttack ||
      oppStyle === FightingStyle.BashingAttack) &&
    (attFights ?? 99) < 10
  ) {
    return -3; // "in his first few fights stay away from lungers and bashers"
  }
  return bias;
}
