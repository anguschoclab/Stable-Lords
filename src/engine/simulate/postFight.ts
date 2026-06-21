/**
 * Post-Fight Processing — outcome tags, post-fight stats, and final outcome assembly.
 *
 * Extracted from simulate.ts and simulate/resolution.ts to improve modularity.
 */
import { MAX_EXCHANGES, EXCHANGES_PER_MINUTE, WIN_XP, LOSS_XP } from '@/constants/combat';
import { resolveDecision } from '../bout/decisionLogic';
import type { FighterState } from '../combat/resolution/types';
import type {
  FightOutcome,
  FightOutcomeBy,
  DeathCauseBucket,
  MinuteEvent,
} from '@/types/combat.types';

/**
 * Generate outcome tags based on fight statistics.
 */
export function generateOutcomeTags(
  winner: 'A' | 'D' | null,
  by: FightOutcomeBy | null,
  fA: FighterState,
  fD: FighterState,
  fightMinutes: number
): string[] {
  const tags = new Set<string>();

  if (fightMinutes <= 3) tags.add('Quick');
  if (fightMinutes >= 8) tags.add('Epic');

  if (winner) {
    const w = winner === 'A' ? fA : fD;
    const l = winner === 'A' ? fD : fA;
    if (w.hp < w.maxHp * 0.3 && w.hitsLanded > l.hitsLanded) tags.add('Comeback');
    if (w.hitsLanded >= 5) tags.add('Dominance');
    if (by === 'KO') tags.add('KO');
    if (by === 'Kill') tags.add('Kill');
    if (w.ripostes >= 3) tags.add('RiposteChain');
    if (w.ripostes >= 2 || w.hitsLanded >= 6) tags.add('Flashy');
  }

  return Array.from(tags);
}

/**
 * Build post-fight statistics.
 */
export function buildPostFightStats(
  winner: 'A' | 'D' | null,
  by: FightOutcomeBy | null,
  fA: FighterState,
  fD: FighterState,
  tags: string[],
  causeBucket?: DeathCauseBucket,
  fatalHitLocation?: string,
  fatalExchangeIndex?: number
) {
  return {
    xpA: winner === 'A' ? WIN_XP : LOSS_XP,
    xpD: winner === 'D' ? WIN_XP : LOSS_XP,
    hitsA: fA.hitsLanded,
    hitsD: fD.hitsLanded,
    gotKillA: winner === 'A' && by === 'Kill',
    gotKillD: winner === 'D' && by === 'Kill',
    tags,
    causeBucket,
    fatalHitLocation,
    fatalExchangeIndex,
  };
}

/**
 * Handle decision logic if time limit reached.
 */
export function handleTimeLimit(
  fA: FighterState,
  fD: FighterState,
  nameA: string,
  nameD: string,
  rng: () => number,
  log: MinuteEvent[],
  headless?: boolean
): { winner: 'A' | 'D' | null; by: FightOutcomeBy | null } {
  const finalOutcome = resolveDecision(fA, fD, nameA, nameD, rng);
  if (!headless) {
    log.push({
      minute: Math.floor(MAX_EXCHANGES / EXCHANGES_PER_MINUTE),
      text: finalOutcome.narrative,
    });
  }
  return { winner: finalOutcome.winner, by: finalOutcome.by };
}

/**
 * Process post-fight: generate tags, build stats, and assemble the final FightOutcome.
 *
 * This handles both cases:
 * - A winner was determined during the simulation loop.
 * - The time limit was reached and a decision is needed.
 */
export function processPostFight(
  winner: 'A' | 'D' | null,
  by: FightOutcomeBy | null,
  fA: FighterState,
  fD: FighterState,
  nameA: string,
  nameD: string,
  rng: () => number,
  log: MinuteEvent[],
  exchangeLog: import('@/types/combat.types').ExchangeLogEntry[],
  headless: boolean,
  fightMinutes: number,
  causeBucket?: DeathCauseBucket,
  fatalHitLocation?: string,
  fatalExchangeIndex?: number
): FightOutcome {
  // If no winner was determined, resolve via decision logic
  if (!winner) {
    const timeLimitResult = handleTimeLimit(fA, fD, nameA, nameD, rng, log, headless);
    const finalMinutes = headless ? fightMinutes : Math.max(1, log[log.length - 1]?.minute ?? 1);

    return {
      winner: timeLimitResult.winner,
      by: timeLimitResult.by,
      minutes: finalMinutes,
      log,
      exchangeLog,
      post: buildPostFightStats(
        timeLimitResult.winner,
        timeLimitResult.by,
        fA,
        fD,
        generateOutcomeTags(timeLimitResult.winner, timeLimitResult.by, fA, fD, finalMinutes)
      ),
    };
  }

  // Winner was determined during the simulation
  const finalMinutes = headless ? fightMinutes : Math.max(1, log[log.length - 1]?.minute ?? 1);
  const tags = generateOutcomeTags(winner, by, fA, fD, finalMinutes);

  return {
    winner,
    by,
    minutes: finalMinutes,
    log,
    exchangeLog,
    post: buildPostFightStats(
      winner,
      by,
      fA,
      fD,
      tags,
      causeBucket,
      fatalHitLocation,
      fatalExchangeIndex
    ),
  };
}
