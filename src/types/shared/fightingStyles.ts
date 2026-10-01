/**
 * FightingStyle enumeration.
 */
export enum FightingStyle {
  AimedBlow = 'AIMED BLOW',
  BashingAttack = 'BASHING ATTACK',
  LungingAttack = 'LUNGING ATTACK',
  ParryLunge = 'PARRY-LUNGE',
  ParryRiposte = 'PARRY-RIPOSTE',
  ParryStrike = 'PARRY-STRIKE',
  SlashingAttack = 'SLASHING ATTACK',
  StrikingAttack = 'STRIKING ATTACK',
  TotalParry = 'TOTAL PARRY',
  WallOfSteel = 'WALL OF STEEL',
}

/**
 * Style_display_names.
 */
export const STYLE_DISPLAY_NAMES: Record<FightingStyle, string> = {
  [FightingStyle.AimedBlow]: 'Aimed-Blow',
  [FightingStyle.BashingAttack]: 'Basher',
  [FightingStyle.LungingAttack]: 'Lunger',
  [FightingStyle.ParryLunge]: 'Parry-Lunger',
  [FightingStyle.ParryRiposte]: 'Parry-Riposte',
  [FightingStyle.ParryStrike]: 'Parry-Striker',
  [FightingStyle.SlashingAttack]: 'Slasher',
  [FightingStyle.StrikingAttack]: 'Striker',
  [FightingStyle.TotalParry]: 'Total-Parry',
  [FightingStyle.WallOfSteel]: 'Wall of Steel',
};

/**
 * Style_abbrev.
 */
export const STYLE_ABBREV: Record<FightingStyle, string> = {
  [FightingStyle.AimedBlow]: 'AB',
  [FightingStyle.BashingAttack]: 'BA',
  [FightingStyle.LungingAttack]: 'LU',
  [FightingStyle.ParryLunge]: 'PL',
  [FightingStyle.ParryRiposte]: 'PR',
  [FightingStyle.ParryStrike]: 'PS',
  [FightingStyle.SlashingAttack]: 'SL',
  [FightingStyle.StrikingAttack]: 'ST',
  [FightingStyle.TotalParry]: 'TP',
  [FightingStyle.WallOfSteel]: 'WS',
};
