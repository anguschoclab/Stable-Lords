import { FightingStyle } from '@/types/game';

/** One point of favorite-weapon mastery, routed to a single identity axis. */
export interface MasteryBonus {
  att: number;
  dmg: number;
  ini: number;
  def: number;
  rip: number;
}

const ZERO: MasteryBonus = { att: 0, dmg: 0, ini: 0, def: 0, rip: 0 };

/**
 * Which axis a style's mastery reinforces. Same +1 budget as the old flat
 * "+1 ATT", but spent where it deepens the style's win condition instead of
 * nudging every style toward generic attack. Grouped by Terrablood archetype.
 */
const MASTERY_AXIS: Record<FightingStyle, keyof MasteryBonus> = {
  // Brutal — damage
  [FightingStyle.BashingAttack]: 'dmg',
  [FightingStyle.StrikingAttack]: 'dmg',
  // Agile — tempo
  [FightingStyle.LungingAttack]: 'ini',
  [FightingStyle.SlashingAttack]: 'ini',
  // Tank — defense
  [FightingStyle.TotalParry]: 'def',
  [FightingStyle.WallOfSteel]: 'def',
  // Cunning / parry — riposte & precision
  [FightingStyle.ParryRiposte]: 'rip',
  [FightingStyle.ParryStrike]: 'rip',
  [FightingStyle.ParryLunge]: 'rip',
  [FightingStyle.AimedBlow]: 'att', // precision: keeps ATT until #2 gives it a called-shot edge
};

export function getMasteryBonus(style: FightingStyle, mastered: boolean): MasteryBonus {
  if (!mastered) return { ...ZERO };
  const axis = MASTERY_AXIS[style] ?? 'att';
  return { ...ZERO, [axis]: 1 };
}
