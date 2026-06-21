/**
 * Stable Lords — Warrior Builder
 * Create a new warrior: allocate 70 points across 7 attributes, pick style, name.
 */
import { Button } from '@/components/ui/button';
import { Shuffle } from 'lucide-react';
import { ATTRIBUTE_TOTAL } from '@/types/game';
import { DAMAGE_LABELS } from '@/engine/skillCalc';
import { useWarriorBuilderState } from './hooks/useWarriorBuilderState';
import { IdentitySection } from './components/IdentitySection';
import { AttributeSliders } from './components/AttributeSliders';
import { SkillsPreview } from './components/SkillsPreview';
import { PhysicalsPreview } from './components/PhysicalsPreview';
import { CreateButton } from './components/CreateButton';

interface WarriorBuilderProps {
  onCreateWarrior: (data: {
    name: string;
    style: import('@/types/game').FightingStyle;
    attributes: import('@/types/game').Attributes;
  }) => void;
  maxRoster?: number;
  currentRosterSize?: number;
}

/**
 *
 */
export default function WarriorBuilder({
  onCreateWarrior,
  maxRoster = 10,
  currentRosterSize = 0,
}: WarriorBuilderProps) {
  const {
    name,
    setName,
    style,
    setStyle,
    attrs,
    total,
    remaining,
    isValid,
    rosterFull,
    stats,
    updateAttr,
    randomize,
    handleCreate,
  } = useWarriorBuilderState({ onCreateWarrior, maxRoster, currentRosterSize });

  const buttonStatus: 'roster-full' | 'invalid' | 'valid' = rosterFull
    ? 'roster-full'
    : !isValid
      ? 'invalid'
      : 'valid';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold">Warrior Builder</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Forge a new warrior for your stable. Allocate {ATTRIBUTE_TOTAL} points across 7
            attributes.
          </p>
        </div>
        <Button variant="outline" onClick={randomize} className="gap-2">
          <Shuffle className="h-4 w-4" /> Randomize
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-4">
          <IdentitySection name={name} setName={setName} style={style} setStyle={setStyle} />
          <AttributeSliders
            attrs={attrs}
            updateAttr={updateAttr}
            total={total}
            remaining={remaining}
          />
        </div>

        <div className="space-y-4">
          <SkillsPreview baseSkills={stats.baseSkills} />
          <PhysicalsPreview
            hp={stats.derivedStats.hp}
            endurance={stats.derivedStats.endurance}
            damage={DAMAGE_LABELS[stats.derivedStats.damage]}
            encumbrance={stats.derivedStats.encumbrance}
          />
          <CreateButton
            disabled={!isValid || rosterFull}
            onClick={handleCreate}
            status={buttonStatus}
            remaining={remaining}
          />
        </div>
      </div>
    </div>
  );
}
