import { useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import type { RivalStableData } from '@/types/game';
import type { OwnerGrudge } from '@/types/state.types';
import { SelectableCard } from '@/components/ui/SelectableCard';
import { RivalIdentity, GrudgeFlames } from '../RivalIdentity';

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
 * Virtualized rival rows — bounds DOM nodes inside a scroll container while
 * `useListShell` owns the data window (25 rows / "show all"). Plain-map
 * fallback when the virtualizer reports no items (jsdom, SSR).
 */
export function RivalVirtualRows({
  visible,
  selectedRivalId,
  grudgeByOwner,
  onSelectRival,
}: {
  visible: RivalStableData[];
  selectedRivalId: string | null;
  grudgeByOwner: Map<string, OwnerGrudge>;
  onSelectRival: (id: string) => void;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line react-hooks/incompatible-library -- @tanstack/react-virtual returns non-memoizable functions; no memo-safe alternative exists
  const virtualizer = useVirtualizer({
    count: visible.length,
    estimateSize: () => 76,
    overscan: 5,
    getScrollElement: () => scrollRef.current,
  });
  const items = virtualizer.getVirtualItems();
  const useFallback = items.length === 0 && visible.length > 0;

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
    <div ref={scrollRef} className="max-h-[60vh] overflow-auto">
      {useFallback ? (
        <div className="grid grid-cols-1 gap-2">{visible.map(renderRow)}</div>
      ) : (
        <div
          style={{
            height: `${virtualizer.getTotalSize()}px`,
            width: '100%',
            position: 'relative',
          }}
        >
          {items.map((vi) => {
            const rival = visible[vi.index];
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
  );
}
