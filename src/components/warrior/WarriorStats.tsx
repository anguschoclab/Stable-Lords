import { type Warrior } from '@/types/game';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ATTRIBUTE_TRAINING, SKILL_MAX_DEFAULT } from '@/constants/training';
import { growthNarrative } from './GrowthHelpers';
import { generateWarriorStatements, physicalProfileLines, skillRating } from '@/data/warriorStatements';
import { computeEnduranceTier, computeEncumbranceClass, computeDamageClass, computeHP } from '@/data/terrabloodCharts';
import { StatBattery } from '@/components/ui/StatBattery';

/**
 * Attr bar.
 * @param  - {
  label,
  value,
  potential,
  max = 25,
}.
 */
export function AttrBar({
  label,
  value,
  potential,
  max = ATTRIBUTE_TRAINING.MAX_VALUE,
}: {
  label: string;
  value: number;
  potential?: number;
  max?: number;
}) {
  const growth = growthNarrative(value, potential);

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground w-20">{label}</span>
        <div className="flex items-center gap-2">
          {growth.label && (
            <TooltipProvider delayDuration={200}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className={`text-[10px] italic ${growth.color} cursor-default`}>
                    {growth.label}
                  </span>
                </TooltipTrigger>
                <TooltipContent side="left" className="w-full max-w-xs text-xs">
                  {growth.tooltip}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
      </div>
      <StatBattery label="" value={value} max={max} className="[&>span:first-child]:hidden" />
    </div>
  );
}

/**
 * Render the SkillBar component.
 * @param  - {
  label,
  value,
  max = 20,
}.
 */
export function SkillBar({
  label,
  value,
  max = SKILL_MAX_DEFAULT,
}: {
  label: string;
  value: number;
  max?: number;
}) {
  return <StatBattery label={label} value={value} max={max} />;
}

/**
 * Render the WarriorStatementsPanel component.
 * @param - { warrior }.
 */
export function WarriorStatementsPanel({ warrior }: { warrior: Warrior }) {
  if (!warrior.baseSkills) return null;
  const statements = generateWarriorStatements(
    warrior.attributes.WT,
    warrior.attributes.SP,
    warrior.attributes.DF,
    warrior.baseSkills
  );
  const { ST, CN, SZ, WL } = warrior.attributes;
  const skills = warrior.baseSkills;
  // Canon overview: skill statements carry an Expert (16+) / Advanced Expert
  // (20+) rating suffix; physical profile lines flag non-normal physicals.
  const rate = (text: string, skill: number) =>
    text && skillRating(skill) ? `${text} — ${skillRating(skill)}` : text;
  const physical = physicalProfileLines({
    enduranceTier: computeEnduranceTier(ST, CN, WL),
    hp: warrior.derivedStats?.hp ?? computeHP(CN, SZ, WL),
    encumbranceClass: computeEncumbranceClass(ST, CN),
    damageClass: warrior.derivedStats?.damage ?? computeDamageClass(ST, SZ),
  });
  const lines = [
    rate(statements.initiative, skills.INI),
    rate(statements.riposte, skills.RIP),
    rate(statements.attack, skills.ATT),
    rate(statements.parry, skills.PAR),
    rate(statements.defense, skills.DEF),
    rate(statements.endurance, skills.DEC),
    statements.coordination,
    statements.quickness,
    statements.activity,
    ...physical,
    warrior.handedness === 'ambidextrous' ? 'Is Ambidextrous' : '',
  ].filter(Boolean);

  if (lines.length === 0)
    return <p className="text-xs text-muted-foreground italic">No notable observations.</p>;

  return (
    <ul className="space-y-1.5">
      {lines.map((line, i) => (
        <li
          key={`${line.slice(0, 30)}-${i}`}
          className="text-xs text-muted-foreground italic leading-relaxed"
        >
          • {line}
        </li>
      ))}
    </ul>
  );
}
