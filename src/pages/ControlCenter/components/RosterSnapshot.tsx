import { useMemo } from 'react';
import { useGameStore } from '@/state/useGameStore';
import { useShallow } from 'zustand/react/shallow';
// eslint-disable-next-line no-restricted-imports -- grandfathered pre-boundary-fix import
import { isActive } from '@/engine/warrior/warriorStatus';
import { SnapshotRow } from './SnapshotRow';

/** Compact list of active warriors for the control-center overview. */
export function RosterSnapshot() {
  const { roster } = useGameStore(useShallow((s) => ({ roster: s.roster })));
  const active = useMemo(() => roster.filter((w) => isActive(w)), [roster]);

  return (
    <div className="flex flex-col gap-3">
      {active.length === 0 && (
        <div className="text-center py-12 text-muted-foreground/40 text-sm font-black uppercase tracking-widest">
          No Active Warriors
        </div>
      )}
      {active.map((w) => (
        <SnapshotRow key={w.id} warrior={w} />
      ))}
    </div>
  );
}
