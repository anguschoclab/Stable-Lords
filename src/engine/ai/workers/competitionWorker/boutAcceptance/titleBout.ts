import type { Warrior, RivalStableData, BoutOffer, GameState } from '@/types/state.types';
import { ARENA_TITLE } from '@/constants/arena';
import { buildFightForecast } from '@/engine/narrative/fightForecast';
import { fightingCondition } from '@/engine/warrior/condition';
import type { BoutEvaluation } from './gates';

interface ResolveTitleBoutArgs {
  offer: BoutOffer;
  rival: RivalStableData;
  warrior: Warrior;
  opponent: Warrior | undefined;
  state: GameState | undefined;
  observedDanger: boolean;
  explain?: { reason?: string };
}

/**
 * Title-bout resolution — the Arena Commission doesn't negotiate: a crown
 * shot outweighs any purse, so counter/fame-floor logic is skipped. Runs
 * BEFORE the RECOVERY refusal so reign obligations are decided by title
 * economics (strip risk, defense health floors) rather than ordinary bout
 * risk aversion — the unified gate fixes the old double-gate where a
 * RECOVERY champion could quietly refuse defenses into a strip.
 */
export function resolveTitleBout(args: ResolveTitleBoutArgs): BoutEvaluation {
  const { offer, rival, warrior, opponent, state } = args;
  const { observedDanger, explain } = args;
  const arenaId = offer.titleArenaId as string;
  const personality = rival.owner.personality;
  const title = state?.arenaChampions?.[arenaId];
  const isChampion = title?.champion?.warriorId === warrior.id;

  if (isChampion && title) {
    // Declining counts toward stripping — when the next refusal would cost
    // the crown, the champion fights hurt rather than abdicate by accident.
    const wouldStrip = title.refusals + 1 >= ARENA_TITLE.REFUSALS_TO_STRIP;
    if (!wouldStrip && personality !== 'Aggressive') {
      const hp = fightingCondition(warrior);
      const fatigue = warrior.fatigue ?? 0;
      if (hp < 45 || fatigue >= 85) {
        if (explain) explain.reason = 'title-defense-health';
        return 'Declined';
      }
      if ((opponent?.career?.kills ?? 0) >= 3 && hp < 70) {
        if (explain) explain.reason = 'title-defense-threat';
        return 'Declined';
      }
    }
    if (explain) explain.reason = 'crown-defense';
    return 'Accepted';
  }

  // Challenger side — a declined shot costs only the challenger cooldown,
  // so a known killer champion is a legitimate pass for calculating stables.
  if (
    opponent &&
    personality !== 'Aggressive' &&
    (opponent.career?.kills ?? 0) >= 3 &&
    (warrior.career?.kills ?? 0) === 0
  ) {
    if (explain) explain.reason = 'killer-champion';
    return 'Declined';
  }
  if (opponent && (personality === 'Methodical' || personality === 'Pragmatic')) {
    const edge = buildFightForecast(warrior, opponent).styleMatchup.edge;
    if (edge <= (observedDanger ? -1 : -2)) {
      if (explain) explain.reason = 'title-shot-mismatch';
      return 'Declined';
    }
  }
  if (explain) explain.reason = 'title-shot';
  return 'Accepted';
}
