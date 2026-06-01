/**
 * Simulation Resolution - Decision logic and tag generation
 */
import { resolveDecision } from '../bout/decisionLogic';
import { MAX_EXCHANGES, EXCHANGES_PER_MINUTE, WIN_XP, LOSS_XP } from '@/constants/combat';
import type { FighterState } from '../combat/resolution/resolution';
import type { FightOutcomeBy, DeathCauseBucket, MinuteEvent } from '@/types/combat.types';

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

