/**
 * Stable Lords — Warrior Builder
 * Create a new warrior: allocate 70 points across 7 attributes, pick style, name.
 */
import { useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Shuffle } from 'lucide-react';
import { ATTRIBUTE_TOTAL } from '@/types/game';
import { DAMAGE_LABELS } from '@/engine/warrior/skillCalc';
import { useWarriorBuilderState } from './hooks/useWarriorBuilderState';
import { IdentitySection } from './components/IdentitySection';
import { AttributeSliders } from './components/AttributeSliders';
import { SkillsPreview } from './components/SkillsPreview';
import { PhysicalsPreview } from './components/PhysicalsPreview';
import { CreateButton } from './components/CreateButton';
import { Avatar } from '@/components/avatar';
import { useAvatarCatalog } from '@/components/avatar/useAvatarCatalog';
import { generateAvatar } from '@/engine/avatar/avatarGenerator';
import { useGameStore } from '@/state/useGameStore';

interface WarriorBuilderProps {
  onCreateWarrior: (data: {
    name: string;
    style: import('@/types/game').FightingStyle;
    attributes: import('@/types/game').Attributes;
    avatarSeed: number;
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
    personality,
    style,
    setStyle,
    avatarSeed,
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
  const catalogReady = useAvatarCatalog();
  const crest = useGameStore((state) => state.player.crest);
  const preview = useMemo(
    () =>
      catalogReady
        ? generateAvatar({
            entityId: 'warrior-builder-preview',
            entityType: 'warrior',
            seed: avatarSeed,
            name: name || 'New Warrior',
            style,
            primaryColor: crest?.primaryColor,
            secondaryColor: crest?.secondaryColor,
          })
        : null,
    [avatarSeed, catalogReady, crest?.primaryColor, crest?.secondaryColor, name, style]
  );

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
        <div className="flex items-center gap-3">
          {preview && <Avatar portrait={preview} size="md" className="border border-border" />}
          <Button variant="outline" onClick={randomize} className="gap-2">
            <Shuffle className="h-4 w-4" /> Randomize
          </Button>
        </div>
      </div>

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
    </div>
  );
}
