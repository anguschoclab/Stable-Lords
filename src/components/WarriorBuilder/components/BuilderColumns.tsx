import { DAMAGE_LABELS } from '@/engine/warrior/skillCalc';
import { IdentitySection } from './IdentitySection';
import { AttributeSliders } from './AttributeSliders';
import { SkillsPreview } from './SkillsPreview';
import { PhysicalsPreview } from './PhysicalsPreview';
import { CreateButton } from './CreateButton';
import type { useWarriorBuilderState } from '../hooks/useWarriorBuilderState';

interface BuilderColumnsProps {
  builder: ReturnType<typeof useWarriorBuilderState>;
  buttonStatus: 'roster-full' | 'invalid' | 'valid';
}

/** The two-column editor: identity + attribute sliders | stat previews + create. */
export function BuilderColumns({ builder, buttonStatus }: BuilderColumnsProps) {
  const {
    name, setName, personality, style, setStyle,
    attrs, total, remaining, isValid, rosterFull,
    stats, updateAttr, handleCreate,
  } = builder;
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="space-y-4">
        <IdentitySection
          name={name}
          setName={setName}
          style={style}
          setStyle={setStyle}
          personality={personality}
        />
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
  );
}
