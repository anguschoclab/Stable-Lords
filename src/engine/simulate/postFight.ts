/**
 * Post-Fight Processing — outcome tags, post-fight stats, and final outcome assembly.
 *
 * Extracted from simulate.ts and simulate/resolution.ts to improve modularity.
 */
import { MAX_EXCHANGES, EXCHANGES_PER_MINUTE, WIN_XP, LOSS_XP, INFIRMARY } from '@/constants/combat';
import { rollInfirmaryOutcome } from '../combat/mechanics/deathRolls';
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
  diedPostBout?: 'A' | 'D';
}

/**
 * Build post-fight statistics.
 */
function buildPostFightStats(args: BuildPostFightStatsArgs) {
  const { winner, by, fA, fD, tags } = args;
  const { causeBucket, fatalHitLocation, fatalExchangeIndex, diedPostBout } = args;
  return {
    xpA: winner === 'A' ? WIN_XP : LOSS_XP,
    xpD: winner === 'D' ? WIN_XP : LOSS_XP,
    hitsA: fA.hitsLanded,
    hitsD: fD.hitsLanded,
    gotKillA: winner === 'A' && by === 'Kill',
    gotKillD: winner === 'D' && by === 'Kill',
    // Limb attrition — feeds location-weighted post-bout injury selection.
    armHitsA: fA.armHits,
    armHitsD: fD.armHits,
    legHitsA: fA.legHits,
    legHitsD: fD.legHits,
    weaponChartA: fA.weaponChart,
    weaponChartD: fD.weaponChart,
    tags,
    causeBucket,
    fatalHitLocation,
    fatalExchangeIndex,
    diedPostBout,
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
function handleTimeLimit(args: HandleTimeLimitArgs): {
  winner: 'A' | 'D' | null;
  by: FightOutcomeBy | null;
} {
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
  diedPostBout?: 'A' | 'D';
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
  const { fightMinutes, causeBucket, fatalHitLocation, fatalExchangeIndex, diedPostBout } = args;
  // Run judges only when the loop timed out without a terminal outcome.
  // A real terminal outcome with winner === null (mutual-collapse Exhaustion,
  // Draw) must be surfaced as-is — re-judging it would silently convert every
  // draw into a Decision and fabricate a winner.
  if (by === null) {
    const timeLimitResult = handleTimeLimit({
      fA: fA,
      fD: fD,
      nameA: nameA,
      nameD: nameD,
      rng: rng,
      log: log,
      headless: headless,
    });
    const finalMinutes = fightMinutes;

    return {
      winner: timeLimitResult.winner,
      by: timeLimitResult.by,
      minutes: finalMinutes,
      log,
      exchangeLog,
      post: buildPostFightStats({
        winner: timeLimitResult.winner,
        by: timeLimitResult.by,
        fA: fA,
        fD: fD,
        tags: generateOutcomeTags(timeLimitResult.winner, timeLimitResult.by, fA, fD, finalMinutes),
        diedPostBout: diedPostBout,
      }),
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
    post: buildPostFightStats({
      winner: winner,
      by: by,
      fA: fA,
      fD: fD,
      tags: tags,
      causeBucket: causeBucket,
      fatalHitLocation: fatalHitLocation,
      fatalExchangeIndex: fatalExchangeIndex,
      diedPostBout: diedPostBout,
    }),
  };
}

/**
 * Post-bout fate resolution — canon (Mechanics of Death):
 *  1) A doomed fighter still standing when the bout ends dies regardless.
 *  2) The loser below a preset hp fraction takes the post-fight infirmary
 *     roll; failing it (then the death roll) turns the result into a Kill —
 *     "died of wounds" in the infirmary.
 * Runs between the simulation loop and outcome assembly so `by`/`winner`
 * stay consistent for records, mortality, and reporting downstream.
 */
export function applyPostBoutFate(args: {
  winner: 'A' | 'D' | null;
  by: FightOutcomeBy | null;
  fA: FighterState;
  fD: FighterState;
  rng: () => number;
  deathRateMult?: number;
  log: MinuteEvent[];
  headless: boolean;
  fightMinutes: number;
  causeBucket?: DeathCauseBucket;
  fatalHitLocation?: string;
  fatalExchangeIndex?: number;
}): {
  winner: 'A' | 'D' | null;
  by: FightOutcomeBy | null;
  causeBucket?: DeathCauseBucket;
  fatalHitLocation?: string;
  fatalExchangeIndex?: number;
  diedPostBout?: 'A' | 'D';
} {
  const { fA, fD, rng, log, headless, fightMinutes } = args;
  const deathMult = args.deathRateMult ?? 1;
  const { winner, fatalHitLocation, fatalExchangeIndex } = args;
  let { by, causeBucket } = args;
  let diedPostBout: 'A' | 'D' | undefined;

  // 1. Doomed survivors: a failed death roll means death, win or lose.
  for (const side of ['A', 'D'] as const) {
    const f = side === 'A' ? fA : fD;
    if (!f.doomed) continue;
    if (winner === side || winner === null) {
      // Doomed winner (or no-winner bout): they die anyway — recorded
      // downstream off the diedPostBout marker.
      diedPostBout = side;
      f.hp = 0;
    } else {
      // Doomed loser: the victor's work is already done — record the kill.
      by = 'Kill';
      causeBucket = 'EXECUTION';
      f.hp = 0;
    }
  }

  // 2. Post-fight infirmary roll — the loser below the hp threshold.
  if (winner && by !== 'Kill') {
    const loser = winner === 'A' ? fD : fA;
    if (
      loser.hp < loser.maxHp * INFIRMARY.POST_HP_RATIO &&
      rollInfirmaryOutcome(rng, loser, deathMult)
    ) {
      by = 'Kill';
      causeBucket = 'DIED_OF_WOUNDS';
      if (!headless) {
        log.push({
          minute: fightMinutes,
          text: 'The healers rush in, but it is too late — the wounds were mortal.',
          emphasis: true,
        });
      }
    }
  }

  return { winner, by, causeBucket, fatalHitLocation, fatalExchangeIndex, diedPostBout };
}
