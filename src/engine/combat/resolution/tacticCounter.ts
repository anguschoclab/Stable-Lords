/**
 * Tactic counter-play — pairwise tactic-vs-tactic adjustments resolved once
 * per exchange, after each fighter's own tactic mods are known.
 *
 * Arena 93 canon (Sir Boyd, "The Striking Style"): "Decise tactic has
 * advantage over no tactic or any tactic other than Response. Any tactic
 * other than Decise has advantage over Response tactic. Response tactic has
 * advantage over Decise tactic."
 *
 * Engine mapping: a decisive attacker's `decBonus` is a live first-strike
 * edge (`tacticIni`, the offensive-tactic channel into the initiative sum) —
 * suppressed when the defender stands responsive. A responsive defender
 * seizes tempo against decisiveness (`iniBonus + RESPONSE_COUNTER_INI`) and
 * wastes the read against anything else (`iniBonus × WASTED_MULT`).
 *
 * Pure — no RNG.
 */
import { RESPONSE_COUNTER_INI, RESPONSE_WASTED_INI_MULT } from '@/constants/combat';
import type { ResolvedTactics } from './tactics';
import type { OffensiveMods, DefensiveMods } from '../mechanics/tacticResolution';

/** Pairwise tactic-vs-tactic adjustments for one exchange. */
export interface TacticCounterMods {
  /** Live first-strike edge from each fighter's own offensive tactic. */
  tacticIniA: number;
  tacticIniD: number;
  /** Adjusted defensive iniBonus — boosted on a successful counter-read, wasted on a missed one. */
  defIniBonusA: number;
  defIniBonusD: number;
}

interface ResolveTacticCountersArgs {
  tactA: ResolvedTactics;
  tactD: ResolvedTactics;
  offModsA: OffensiveMods;
  offModsD: OffensiveMods;
  defModsA: DefensiveMods;
  defModsD: DefensiveMods;
}

/** First-strike edge an offensive tactic claims against this defense. */
function offensiveIniEdge(
  offTactic: ResolvedTactics['offTactic'],
  oppDefTactic: ResolvedTactics['defTactic'],
  offMods: OffensiveMods
): number {
  if (offTactic !== 'Decisiveness') return 0;
  return oppDefTactic === 'Responsiveness' ? 0 : offMods.decBonus;
}

/** Defensive iniBonus after the read is judged against the incoming attack. */
function defensiveIniBonus(
  defTactic: ResolvedTactics['defTactic'],
  oppOffTactic: ResolvedTactics['offTactic'],
  defMods: DefensiveMods
): number {
  if (defTactic !== 'Responsiveness') return defMods.iniBonus;
  return oppOffTactic === 'Decisiveness'
    ? defMods.iniBonus + RESPONSE_COUNTER_INI
    : Math.round(defMods.iniBonus * RESPONSE_WASTED_INI_MULT);
}

/**
 * Resolve pairwise tactic counters for the exchange. Pure — no RNG.
 */
export function resolveTacticCounters(args: ResolveTacticCountersArgs): TacticCounterMods {
  const { tactA, tactD, offModsA, offModsD, defModsA, defModsD } = args;
  return {
    tacticIniA: offensiveIniEdge(tactA.offTactic, tactD.defTactic, offModsA),
    tacticIniD: offensiveIniEdge(tactD.offTactic, tactA.defTactic, offModsD),
    defIniBonusA: defensiveIniBonus(tactA.defTactic, tactD.offTactic, defModsA),
    defIniBonusD: defensiveIniBonus(tactD.defTactic, tactA.offTactic, defModsD),
  };
}
