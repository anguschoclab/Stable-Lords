/**
 * V24 canon — Bloodfeuds (Rose of Shanon / Pagan, Arena 93): when a warrior
 * kills an opponent, the victim's stable earns a four-turn bloodfeud — any
 * stablemate may use it to challenge the killer, and it takes priority over
 * all other challenges. Here: entitlement bookkeeping only.
 */
import type { BloodfeudMark } from '@/types/state/gameState';
import type { FightSummary } from '@/types/combat.types';
import type { Warrior } from '@/types/warrior.types';

export const BLOODFEUD_TURNS = 4;

/**
 * Entitlements created by a bout outcome: one mark per PLAYER warrior killed
 * by a rival. The mark rides on the killer — any player stablemate may spend
 * the feud window challenging them.
 */
export function bloodfeudMarksFromOutcome(args: {
  outcome: Pick<FightSummary, 'by' | 'winner'>;
  warriorA: Pick<Warrior, 'id' | 'stableId'>;
  warriorD: Pick<Warrior, 'id' | 'stableId'>;
  week: number;
  playerWarriorIds: Set<string>;
}): BloodfeudMark[] {
  const { outcome, warriorA, warriorD, week, playerWarriorIds } = args;
  if (outcome.by !== 'Kill' || (outcome.winner !== 'A' && outcome.winner !== 'D'))
    return [];
  const victim = outcome.winner === 'A' ? warriorD : warriorA;
  const killer = outcome.winner === 'A' ? warriorA : warriorD;
  // Only player deaths create a player entitlement — rival-on-rival kills
  // feed the world's grudges, not the player's.
  if (!playerWarriorIds.has(victim.id)) return [];
  return [
    {
      killerWarriorId: killer.id,
      killerStableId: killer.stableId,
      expiresWeek: week + BLOODFEUD_TURNS,
    },
  ];
}
