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
function generateOutcomeTags(
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
 *
 */
interface BuildPostFightStatsArgs {
  winner: 'A' | 'D' | null;
  by: FightOutcomeBy | null;
  fA: FighterState;
  fD: FighterState;
  tags: string[];
  causeBucket?: DeathCauseBucket;
  fatalHitLocation?: string;
  fatalExchangeIndex?: number;
}

/**
 * Build post-fight statistics.
 */
function buildPostFightStats(args: BuildPostFightStatsArgs) {
  const { winner, by, fA, fD, tags } = args;
  const { causeBucket, fatalHitLocation, fatalExchangeIndex } = args;
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
 *
 */
interface HandleTimeLimitArgs {
  fA: FighterState;
  fD: FighterState;
  nameA: string;
  nameD: string;
  rng: () => number;
  log: MinuteEvent[];
  headless?: boolean;
}

/**
 * Handle decision logic if time limit reached.
 */
function handleTimeLimit(args: HandleTimeLimitArgs): { winner: 'A' | 'D' | null; by: FightOutcomeBy | null } {
  const { fA, fD, nameA, nameD, rng } = args;
  const { log, headless } = args;
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
 *
 */
interface ProcessPostFightArgs {
  winner: 'A' | 'D' | null;
  by: FightOutcomeBy | null;
  fA: FighterState;
  fD: FighterState;
  nameA: string;
  nameD: string;
  rng: () => number;
  log: MinuteEvent[];
  exchangeLog: import('@/types/combat.types').ExchangeLogEntry[];
  headless: boolean;
  fightMinutes: number;
  causeBucket?: DeathCauseBucket;
  fatalHitLocation?: string;
  fatalExchangeIndex?: number;
}

/**
 * Process post-fight: generate tags, build stats, and assemble the final FightOutcome.
 *
 * This handles both cases:
 * - A winner was determined during the simulation loop.
 * - The time limit was reached and a decision is needed.
 */
export function processPostFight(args: ProcessPostFightArgs): FightOutcome {
  const { winner, by, fA, fD, nameA } = args;
  const { nameD, rng, log, exchangeLog, headless } = args;
  const { fightMinutes, causeBucket, fatalHitLocation, fatalExchangeIndex } = args;
  // Run judges only when the loop timed out without a terminal outcome.
  // A real terminal outcome with winner === null (mutual-collapse Exhaustion,
  // Draw) must be surfaced as-is — re-judging it would silently convert every
  // draw into a Decision and fabricate a winner.
  if (by === null) {
    const timeLimitResult = handleTimeLimit({ fA: fA, fD: fD, nameA: nameA, nameD: nameD, rng: rng, log: log, headless: headless });
    const finalMinutes = fightMinutes;

    return {
      winner: timeLimitResult.winner,
      by: timeLimitResult.by,
      minutes: finalMinutes,
      log,
      exchangeLog,
      post: buildPostFightStats(
        { winner: timeLimitResult.winner, by: timeLimitResult.by, fA: fA, fD: fD, tags: generateOutcomeTags(timeLimitResult.winner, timeLimitResult.by, fA, fD, finalMinutes) }
      ),
    };
  }

  // Winner was determined during the simulation
  const finalMinutes = fightMinutes;
  const tags = generateOutcomeTags(winner, by, fA, fD, finalMinutes);

  return {
    winner,
    by,
    minutes: finalMinutes,
    log,
    exchangeLog,
    post: buildPostFightStats(
      { winner: winner, by: by, fA: fA, fD: fD, tags: tags, causeBucket: causeBucket, fatalHitLocation: fatalHitLocation, fatalExchangeIndex: fatalExchangeIndex }
    ),
  };
}
