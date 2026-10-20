import { PageHeader } from '@/components/ui/PageHeader';
import { Badge } from '@/components/ui/badge';
import { Swords } from 'lucide-react';
import { useGameStore } from '@/state/useGameStore';
import { isActive } from '@/engine/warrior/warriorStatus';

/** Hub page header with the active-warrior count badge. */
export function HubHeader({ roster }: { roster: ReturnType<typeof useGameStore.getState>['roster'] }) {
  return (
    <PageHeader
      icon={Swords}
      eyebrow="Combat Operations"
      title="Arena"
      subtitle="ARENA · BOUTS · RANKINGS"
      actions={
        <div className="flex gap-3">
          <Badge
            variant="outline"
            className="bg-primary/5 text-primary border-primary/20 font-black uppercase tracking-widest text-[9px] px-3 py-1 rounded-none"
          >
            {roster.filter((w) => isActive(w)).length} WARRIORS ACTIVE
          </Badge>
        </div>
      }
    />
  );
}
