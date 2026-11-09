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
 * Entitlements created by a bout outcome: one mark per arena kill, owed to
 * the VICTIM'S stable — player or rival alike (V26 harmonization). The mark
 * rides on the killer — any stablemate of the owed stable may spend the
 * feud window challenging them. Draw-free bookkeeping: consumes no RNG.
 */
export function bloodfeudMarksFromOutcome(args: {
  outcome: Pick<FightSummary, 'by' | 'winner'>;
  warriorA: Pick<Warrior, 'id' | 'stableId'>;
  warriorD: Pick<Warrior, 'id' | 'stableId'>;
  week: number;
  /** The player stable's id — the owed key for roster victims (who carry
   *  no stableId of their own). */
  playerStableId: string;
}): BloodfeudMark[] {
  const { outcome, warriorA, warriorD, week, playerStableId } = args;
  if (outcome.by !== 'Kill' || (outcome.winner !== 'A' && outcome.winner !== 'D'))
    return [];
  const victim = outcome.winner === 'A' ? warriorD : warriorA;
  const killer = outcome.winner === 'A' ? warriorA : warriorD;
  return [
    {
      killerWarriorId: killer.id,
      killerStableId: killer.stableId ?? playerStableId,
      owedStableId: victim.stableId ?? playerStableId,
      expiresWeek: week + BLOODFEUD_TURNS,
    },
  ];
}
