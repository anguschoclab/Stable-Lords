/**
 * Style Strategies - Strategy pattern for style-specific combat behaviors
 * Registry: one file per style in this directory, keyed here for exhaustive
 * coverage (Record<FightingStyle, …> — a missing file fails typecheck).
 */
import { FightingStyle } from '@/types/shared.types';
import type { StyleStrategy } from '../types';
import { aimedBlow } from './aimedBlow';
import { bashingAttack } from './bashingAttack';
import { lungingAttack } from './lungingAttack';
import { parryLunge } from './parryLunge';
import { parryRiposte } from './parryRiposte';
import { parryStrike } from './parryStrike';
import { slashingAttack } from './slashingAttack';
import { strikingAttack } from './strikingAttack';
import { totalParry } from './totalParry';
import { wallOfSteel } from './wallOfSteel';

export const STYLES: Record<FightingStyle, StyleStrategy> = {
  [FightingStyle.AimedBlow]: aimedBlow,
  [FightingStyle.BashingAttack]: bashingAttack,
  [FightingStyle.LungingAttack]: lungingAttack,
  [FightingStyle.ParryLunge]: parryLunge,
  [FightingStyle.ParryRiposte]: parryRiposte,
  [FightingStyle.ParryStrike]: parryStrike,
  [FightingStyle.SlashingAttack]: slashingAttack,
  [FightingStyle.StrikingAttack]: strikingAttack,
  [FightingStyle.TotalParry]: totalParry,
  [FightingStyle.WallOfSteel]: wallOfSteel,
};
