import { useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { SelectableCard } from '@/components/ui/SelectableCard';
import type { RivalStableData } from '@/types/game';
import { useGameStore } from '@/state/useGameStore';
import { ListToolbar } from '@/components/ui/ListToolbar';
import { RIVAL_SORTS, rivalSearchText } from './utils/rivalListUtils';
import { useListShell } from '@/hooks/useListShell';
import { RivalIdentity, GrudgeFlames } from './RivalIdentity';

interface RivalStableListProps {
  rivals: RivalStableData[];
  selectedRivalId: string | null;
  onSelectRival: (id: string) => void;
}

type OwnerGrudge = NonNullable<ReturnType<typeof useGameStore.getState>['ownerGrudges']>[number];

/** One rival row — crest, stable name, roster count, personality, grudge flames. */
function RivalRow({
  rival,
  isSelected,
  grudge,
  onSelectRival,
}: {
  rival: RivalStableData;
  isSelected: boolean;
  grudge: OwnerGrudge | undefined;
  onSelectRival: (id: string) => void;
}) {
  return (
    <SelectableCard
      selected={isSelected}
      onSelect={() => onSelectRival(rival.owner.id)}
      ariaLabel={`Select rival stable ${rival.owner.stableName}`}
      tooltip={{
        className: 'bg-neutral-900 border-primary/20 shadow-2xl p-3 rounded-none',
        content: (
          <div className="space-y-1">
            <p className="text-[10px] font-black uppercase tracking-widest text-primary">
              CHOOSE STABLE
            </p>
            {grudge && (
              <p className="text-[9px] text-arena-blood/80 uppercase tracking-wider">
                Active grudge · intensity {grudge.intensity}/5
              </p>
            )}
          </div>
        ),
      }}
    >
      <RivalIdentity rival={rival} isSelected={isSelected} />
      {grudge && <GrudgeFlames intensity={grudge.intensity} />}
    </SelectableCard>
  );
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

  // Virtualize list.visible inside a bounded scroll container — the 25-row
  // window and "show all" expansion stay useListShell's job; virtualization
  // only bounds the DOM, not the data. Plain-map fallback when the
  // virtualizer reports no items (jsdom, SSR).
  const scrollRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line react-hooks/incompatible-library -- @tanstack/react-virtual returns non-memoizable functions; no memo-safe alternative exists
  const virtualizer = useVirtualizer({
    count: list.visible.length,
    estimateSize: () => 76,
    overscan: 5,
    getScrollElement: () => scrollRef.current,
  });
  const items = virtualizer.getVirtualItems();
  const useFallback = items.length === 0 && list.visible.length > 0;

  const renderRow = (rival: RivalStableData) => (
    <RivalRow
      key={rival.owner.id}
      rival={rival}
      isSelected={selectedRivalId === rival.owner.id}
      grudge={grudgeByOwner.get(rival.owner.id)}
      onSelectRival={onSelectRival}
    />
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 px-2">
        <h3 className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.15em]">
          Rival Stables
        </h3>
        <div className="h-px flex-1 bg-border/20" />
      </div>

      <ListToolbar list={list} sorts={RIVAL_SORTS} placeholder="Search stables…" />

      <div ref={scrollRef} className="max-h-[60vh] overflow-auto">
        {useFallback ? (
          <div className="grid grid-cols-1 gap-2">{list.visible.map(renderRow)}</div>
        ) : (
          <div
            style={{
              height: `${virtualizer.getTotalSize()}px`,
              width: '100%',
              position: 'relative',
            }}
          >
            {items.map((vi) => {
              const rival = list.visible[vi.index];
              if (!rival) return null;
              return (
                <div
                  key={vi.key}
                  data-index={vi.index}
                  ref={virtualizer.measureElement}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    transform: `translateY(${vi.start}px)`,
                  }}
                >
                  <div className="pb-2">{renderRow(rival)}</div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
