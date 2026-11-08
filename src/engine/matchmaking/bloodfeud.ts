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
 * by a rival. Phase-1 scaffolding returns [] — Phase 8 wires the writer at
 * the recordHandler kill-detection site.
 */
export function bloodfeudMarksFromOutcome(args: {
  outcome: Pick<FightSummary, 'by' | 'winner'>;
  warriorA: Pick<Warrior, 'id' | 'stableId'>;
  warriorD: Pick<Warrior, 'id' | 'stableId'>;
  week: number;
  playerWarriorIds: Set<string>;
}): BloodfeudMark[] {
  void args;
  return [];
}
