import { Activity, Skull, type LucideIcon } from 'lucide-react';
import uiMeta from '@/data/narrative/uiMeta.json';
import { WarriorNameAvatar } from '@/components/avatar';
import type { WarriorRef } from '@/types/shared.types';
import { StepHeader } from './StepHeader';
import { StepShell } from './StepShell';

interface InjuriesStepProps {
  injuries: WarriorRef[];
  deaths: WarriorRef[];
}

/** Display name of a casualty entry — tolerates legacy plain-string records. */
const refName = (r: WarriorRef | string): string => (typeof r === 'string' ? r : r.name);
/** Warrior id of a casualty entry — undefined for legacy string records. */
const refId = (r: WarriorRef | string): string | undefined =>
  typeof r === 'string' ? undefined : r.id;

const TONE = {
  destructive: {
    section: 'bg-destructive/10 border border-destructive/20',
    header: 'text-destructive',
    list: 'text-destructive-foreground',
    avatar: 'border-destructive/30 grayscale',
  },
  gold: {
    section: 'bg-arena-gold/10 border border-arena-gold/20',
    header: 'text-arena-gold',
    list: 'text-arena-gold',
    avatar: 'border-arena-gold/30',
  },
} as const;

/** One casualty card — a tinted section listing fallen or injured warriors. */
function CasualtySection({
  title,
  icon: Icon,
  items,
  tone,
}: {
  title: string;
  icon: LucideIcon;
  items: (WarriorRef | string)[];
  tone: keyof typeof TONE;
}) {
  const t = TONE[tone];
  return (
    <div className={`${t.section} rounded-none p-4 space-y-3`}>
      <div className={`flex items-center gap-2 font-bold ${t.header}`}>
        <Icon className="h-5 w-5" />
        <h4>{title}</h4>
      </div>
      <ul className={`list-none space-y-2 text-sm ${t.list}`}>
        {items.map((r, i) => (
          <li key={`${refId(r) ?? refName(r)}-${i}`} className="flex items-center gap-2">
            <WarriorNameAvatar
              warriorId={refId(r)}
              name={refName(r)}
              size="xs"
              className={`border ${t.avatar}`}
            />
            {refName(r)}
          </li>
        ))}
      </ul>
    </div>
  );
}

/**
 * Injuries step.
 * @param - { injuries, deaths }.
 */
export function InjuriesStep({ injuries, deaths }: InjuriesStepProps) {
  return (
    <StepShell className="flex flex-col gap-6">
      <StepHeader icon={Activity} iconClassName="text-arena-gold" title={uiMeta.fanfare.report_medical} />

      {deaths.length > 0 && (
        <CasualtySection title="Fallen Warriors" icon={Skull} items={deaths} tone="destructive" />
      )}

      {injuries.length > 0 && (
        <CasualtySection title="Injured Roster" icon={Activity} items={injuries} tone="gold" />
      )}
    </StepShell>
  );
}
