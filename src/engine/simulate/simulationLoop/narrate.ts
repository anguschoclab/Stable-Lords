import { narrateEvents, NarrationContext } from '../../combat/narrative/narrator';
import type { FighterState } from '../../combat/resolution/types';
import type { CombatEvent } from '@/types/combat.types';
import { tacticStreakLine } from '../../narrative';
import type { LoopCtx } from './types';

/**
 * Narrate exchange events args.
 */
interface NarrateExchangeEventsArgs {
  c: LoopCtx;
  fA: FighterState;
  fD: FighterState;
  events: CombatEvent[];
  min: number;
  prevHpRatioA: number;
  prevHpRatioD: number;
}

/**
 * Resolves narration for one exchange (drama layer): post-exchange HP ratios,
 * event narration, and tactic-streak commentary. Returns updated ratios.
 */
export function narrateExchangeEvents(args: NarrateExchangeEventsArgs): { prevHpRatioA: number; prevHpRatioD: number } {
  const { c, fA, fD, events, min } = args;
  const { prevHpRatioA, prevHpRatioD } = args;
  // Use authoritative post-mitigation HP ratios from the engine state.
  // These are already correct — resolveExchange mutated fA.hp and fD.hp
  // with the real (post-shield, post-protect) damage figure.
  const postHpRatioA = Math.max(0, fA.hp / fA.maxHp);
  const postHpRatioD = Math.max(0, fD.hp / fD.maxHp);

  const narCtx: NarrationContext = {
    rng: c.flavorRng,
    nameA: c.nameA,
    nameD: c.nameD,
    weaponA: c.weaponA,
    weaponD: c.weaponD,
    styleA: fA.style,
    styleD: fD.style,
    maxHpA: fA.maxHp,
    maxHpD: fD.maxHp,
    prevHpRatioA,
    prevHpRatioD,
    // Authoritative post-exchange HP ratios — narrator reads these instead
    // of re-deriving from pre-mitigation event.value.
    postHpRatioA,
    postHpRatioD,
    fameA: c.warriorA?.fame ?? 0,
    fameD: c.warriorD?.fame ?? 0,
    isFavoriteA: !!c.warriorA?.favorites?.discovered?.weapon,
    isFavoriteD: !!c.warriorD?.favorites?.discovered?.weapon,
    spA: c.warriorA?.attributes.SP,
    spD: c.warriorD?.attributes.SP,
    originA: c.warriorA?.origin,
    originD: c.warriorD?.origin,
    crowdMood: c.crowdMood,
  };
  const { log: newLines } = narrateEvents(events, narCtx, min);
  c.log.push(...newLines);

  // Tactic streak commentary
  if ((c.resCtx.tacticStreakA === 3 || c.resCtx.tacticStreakA === 5) && c.resCtx.lastOffTacticA) {
    const streakLine = tacticStreakLine(c.nameA, c.resCtx.lastOffTacticA, c.resCtx.tacticStreakA);
    if (streakLine) c.log.push({ minute: min, text: streakLine });
  }
  if ((c.resCtx.tacticStreakD === 3 || c.resCtx.tacticStreakD === 5) && c.resCtx.lastOffTacticD) {
    const streakLine = tacticStreakLine(c.nameD, c.resCtx.lastOffTacticD, c.resCtx.tacticStreakD);
    if (streakLine) c.log.push({ minute: min, text: streakLine });
  }
  return { prevHpRatioA: postHpRatioA, prevHpRatioD: postHpRatioD };
}
