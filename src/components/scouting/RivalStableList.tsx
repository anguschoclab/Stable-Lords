import type { RivalStableData } from '@/types/game';
import type { OwnerGrudge } from '@/types/state.types';
import { useGameStore } from '@/state/useGameStore';
import { ListToolbar } from '@/components/ui/ListToolbar';
import { RIVAL_SORTS, rivalSearchText } from './utils/rivalListUtils';
import { useListShell } from '@/hooks/useListShell';
import { RivalVirtualRows } from './rivalStableList/RivalVirtualRows';

interface RivalStableListProps {
  rivals: RivalStableData[];
  selectedRivalId: string | null;
  onSelectRival: (id: string) => void;
}

/**
 * Rival stable list.
 * @param - { rivals, selected rival id, on select rival }.
 */
export function RivalStableList({ rivals, selectedRivalId, onSelectRival }: RivalStableListProps) {
  const ownerGrudges = useGameStore((s) => s.ownerGrudges) ?? [];
  // ownerId → grudge, first match wins on either side — same pick the
  // per-row ownerGrudges.find scan made.
  const grudgeByOwner = new Map<string, OwnerGrudge>();
  for (const g of ownerGrudges) {
    if (!grudgeByOwner.has(g.ownerIdA)) grudgeByOwner.set(g.ownerIdA, g);
    if (!grudgeByOwner.has(g.ownerIdB)) grudgeByOwner.set(g.ownerIdB, g);
  }
  const list = useListShell(rivals, {
    searchText: rivalSearchText,
    sorts: RIVAL_SORTS,
    pageSize: 25,
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 px-2">
        <h3 className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.15em]">
          Rival Stables
        </h3>
        <div className="h-px flex-1 bg-border/20" />
      </div>

      <ListToolbar list={list} sorts={RIVAL_SORTS} placeholder="Search stables…" />

      <RivalVirtualRows
        visible={list.visible}
        selectedRivalId={selectedRivalId}
        grudgeByOwner={grudgeByOwner}
        onSelectRival={onSelectRival}
      />
    </div>
  );
}
