/**
 * Arena-93 skill-learning priority table — Pagan's "Priority Skill Learning"
 * chart (Noblish Island newsletter). Each style's six skills ordered from
 * most to least likely to be learned in a bout; the learn roll weights the
 * pool 6..1 in this order, summed for both combatants.
 *
 * Canon rationale: a fighter learns what the bout teaches — fighting a
 * Total Parry teaches parry and defense, fighting a lunger teaches
 * initiative and defense. The warrior's own style supplies its natural
 * aptitudes; the opponent's supplies the lesson.
 */
import { FightingStyle } from '@/types/shared.types';
import type { BaseSkills } from '@/types/shared.types';

/** Ordered most-learned → least-learned per style (Pagan, Arena 93). */
export const STYLE_LEARN_PRIORITY: Record<FightingStyle, (keyof BaseSkills)[]> = {
  [FightingStyle.AimedBlow]: ['ATT', 'RIP', 'DEF', 'PAR', 'DEC', 'INI'],
  [FightingStyle.BashingAttack]: ['ATT', 'INI', 'DEC', 'PAR', 'RIP', 'DEF'],
  [FightingStyle.LungingAttack]: ['INI', 'DEF', 'RIP', 'ATT', 'DEC', 'PAR'],
  [FightingStyle.ParryLunge]: ['INI', 'PAR', 'ATT', 'DEF', 'DEC', 'RIP'],
  [FightingStyle.ParryStrike]: ['PAR', 'DEC', 'INI', 'ATT', 'DEF', 'RIP'],
  [FightingStyle.ParryRiposte]: ['RIP', 'PAR', 'ATT', 'DEF', 'INI', 'DEC'],
  [FightingStyle.StrikingAttack]: ['DEC', 'ATT', 'INI', 'RIP', 'PAR', 'DEF'],
  [FightingStyle.SlashingAttack]: ['INI', 'ATT', 'RIP', 'DEC', 'PAR', 'DEF'],
  [FightingStyle.WallOfSteel]: ['ATT', 'INI', 'PAR', 'DEF', 'DEC', 'RIP'],
  [FightingStyle.TotalParry]: ['PAR', 'DEF', 'RIP', 'ATT', 'DEC', 'INI'],
};

/** Priority position → pool weight: rank 1 → 6, rank 6 → 1. */
function buildWeights(): Record<FightingStyle, Record<keyof BaseSkills, number>> {
  const out = {} as Record<FightingStyle, Record<keyof BaseSkills, number>>;
  for (const style of Object.values(FightingStyle)) {
    const row = STYLE_LEARN_PRIORITY[style];
    const weights = {} as Record<keyof BaseSkills, number>;
    row.forEach((skill, idx) => {
      weights[skill] = row.length - idx;
    });
    out[style] = weights;
  }
  return out;
}

/** Per-style skill → weight (6 for the style's most-learned skill, 1 least). */
export const STYLE_LEARN_WEIGHTS: Record<
  FightingStyle,
  Record<keyof BaseSkills, number>
> = buildWeights();
