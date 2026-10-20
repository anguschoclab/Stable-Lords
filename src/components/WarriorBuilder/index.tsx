/**
 * Stable Lords — Warrior Builder
 * Create a new warrior: allocate 70 points across 7 attributes, pick style, name.
 */
import { Avatar } from '@/components/avatar';
import { useWarriorBuilderState } from './hooks/useWarriorBuilderState';
import { useBuilderAvatar } from './hooks/useBuilderAvatar';
import { BuilderHeader } from './components/BuilderHeader';
import { BuilderColumns } from './components/BuilderColumns';

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
  const builder = useWarriorBuilderState({ onCreateWarrior, maxRoster, currentRosterSize });
  const { avatarSeed, name, style, isValid, rosterFull, randomize } = builder;
  const preview = useBuilderAvatar(avatarSeed, name, style);

  const buttonStatus: 'roster-full' | 'invalid' | 'valid' = rosterFull
    ? 'roster-full'
    : !isValid
      ? 'invalid'
      : 'valid';

  return (
    <div className="space-y-6">
      <BuilderHeader
        preview={
          preview && <Avatar portrait={preview} size="md" className="border border-border" />
        }
        onRandomize={randomize}
      />
      <BuilderColumns builder={builder} buttonStatus={buttonStatus} />
    </div>
  );
}
