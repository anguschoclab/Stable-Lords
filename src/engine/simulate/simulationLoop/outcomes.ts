import type { FighterState } from '../../combat/resolution/types';
import type {
  DeathCauseBucket,
  FightOutcomeBy,
  CombatEvent,
} from '@/types/combat.types';
import { narrateBoutEnd } from '../../narrative';
import type { LoopCtx } from './types';

const YIELD_THRESHOLD = 0.15;

/**
 * Yield check — before resolving the exchange, a fighter whose
 * fallbackCondition is 'YIELD' and who is below desperation thresholds
 * surrenders. Returns the outcome or null to continue.
 */
export function checkYieldOutcome(
  c: LoopCtx,
  fA: FighterState,
  fD: FighterState,
  min: number
): { winner: 'A' | 'D'; by: FightOutcomeBy } | null {
  const yields =
    c.planA?.fallbackCondition === 'YIELD' &&
    fA.hp < fA.maxHp * YIELD_THRESHOLD &&
    fA.endurance < fA.maxEndurance * YIELD_THRESHOLD
      ? 'A'
      : c.planD?.fallbackCondition === 'YIELD' &&
          fD.hp < fD.maxHp * YIELD_THRESHOLD &&
          fD.endurance < fD.maxEndurance * YIELD_THRESHOLD
        ? 'D'
        : null;
  if (!yields) return null;
  const winner = yields === 'A' ? 'D' : 'A';
  if (!c.headless) {
    const narWinner = yields === 'A' ? c.nameD : c.nameA;
    const narLoser = yields === 'A' ? c.nameA : c.nameD;
    const winnerWeapon = yields === 'A' ? c.weaponD : c.weaponA;
    const boutEndLines = narrateBoutEnd({ rng: c.flavorRng, by: 'Yield', winnerName: narWinner, loserName: narLoser, weaponId: winnerWeapon, ctx: {
      mood: c.crowdMood,
    } });
    boutEndLines.forEach((line) => c.log.push({ minute: min, text: line, emphasis: true }));
  }
  return { winner, by: 'Yield' };
}

/**
 * Bout end result.
 */
export interface BoutEndResult {
  by: FightOutcomeBy;
  winner: 'A' | 'D' | null;
  causeBucket: DeathCauseBucket | undefined;
  fatalHitLocation: string | undefined;
  fatalExchangeIndex: number;
}

/** Resolves a BOUT_END event into outcome + narration. */
export function resolveBoutEnd(c: LoopCtx, boutEnd: CombatEvent, ex: number, min: number): BoutEndResult {
  const by = boutEnd.result as FightOutcomeBy;
  const causeBucket = boutEnd.metadata?.cause as DeathCauseBucket;
  const fatalHitLocation = boutEnd.metadata?.location as string;

  let winner: 'A' | 'D' | null;
  if (by === 'Stoppage' || by === 'Decision' || by === 'Yield') {
    winner = boutEnd.actor === 'A' ? 'D' : 'A';
  } else if (by === 'Exhaustion') {
    winner = null;
  } else {
    winner = boutEnd.actor === 'A' ? 'A' : 'D';
  }

  if (!c.headless) {
    const boutActorIsWinner = by !== 'Stoppage' && by !== 'Decision' && by !== 'Yield';
    const narWinner = boutActorIsWinner
      ? boutEnd.actor === 'A'
        ? c.nameA
        : c.nameD
      : boutEnd.actor === 'A'
        ? c.nameD
        : c.nameA;
    const narLoser = boutActorIsWinner
      ? boutEnd.actor === 'A'
        ? c.nameD
        : c.nameA
      : boutEnd.actor === 'A'
        ? c.nameA
        : c.nameD;
    const winnerStyle = boutEnd.actor === 'A' ? c.planA?.style : c.planD?.style;
    const winnerWeapon = boutActorIsWinner
      ? boutEnd.actor === 'A'
        ? c.weaponA
        : c.weaponD
      : boutEnd.actor === 'A'
        ? c.weaponD
        : c.weaponA;
    const boutEndLines = narrateBoutEnd(
      { rng: c.flavorRng, by: by as string, winnerName: narWinner, loserName: narLoser, weaponId: winnerWeapon, ctx: {
        cause: causeBucket,
        style: winnerStyle,
        mood: c.crowdMood,
      } }
    );
    boutEndLines.forEach((line) => c.log.push({ minute: min, text: line, emphasis: true }));
  }
  return { by, winner, causeBucket, fatalHitLocation, fatalExchangeIndex: ex };
}

/**
 * First BOUT_END in the event array wins; inline scan avoids allocating a
 * find-closure per exchange.
 */
export function firstBoutEnd(events: CombatEvent[]): CombatEvent | undefined {
  for (const e of events) {
    if (e.type === 'BOUT_END') return e;
  }
  return undefined;
}
