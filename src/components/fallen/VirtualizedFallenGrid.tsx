import { useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Surface } from '@/components/ui/Surface';
import { Shield, Skull, Crosshair, Activity } from 'lucide-react';
import { WarriorLink } from '@/components/EntityLink';
import { STYLE_DISPLAY_NAMES } from '@/types/game';
import type { Warrior } from '@/types/game';
import type { FightingStyle } from '@/types/game';
import { useColumns } from '@/hooks/useColumns';

interface VirtualizedFallenGridProps {
  warriors: Warrior[];
  season: string;
  emptyTitle: string;
  emptyDesc: string;
}

export function VirtualizedFallenGrid({
  warriors,
  season,
  emptyTitle,
  emptyDesc,
}: VirtualizedFallenGridProps) {
  const cols = useColumns();
  const parentRef = useRef<HTMLDivElement>(null);

  if (warriors.length === 0) {
    return (
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
        <Surface
          variant="glass"
          className="text-center py-32 border-2 border-border/20 border-dashed flex flex-col items-center"
        >
          <Shield className="w-16 h-16 text-muted-foreground/20 mx-auto mb-6" />
          <h3 className="text-xl font-display font-black uppercase tracking-tight">{emptyTitle}</h3>
          <p className="text-muted-foreground text-sm mt-2 max-w-md mx-auto">{emptyDesc}</p>
        </Surface>
      </motion.div>
    );
  }

  const rows: Warrior[][] = [];
  for (let i = 0; i < warriors.length; i += cols) {
    rows.push(warriors.slice(i, i + cols));
  }

  return <VirtualizedInner rows={rows} cols={cols} season={season} parentRef={parentRef} />;
}

function VirtualizedInner({
  rows,
  cols,
  season,
  parentRef,
}: {
  rows: Warrior[][];
  cols: number;
  season: string;
  parentRef: React.RefObject<HTMLDivElement>;
}) {
  const colsClass =
    cols === 3
      ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8'
      : cols === 2
        ? 'grid grid-cols-1 md:grid-cols-2 gap-8'
        : 'grid grid-cols-1 gap-8';

  const virtualizer = useVirtualizer({
    count: rows.length,
    estimateSize: () => 400,
    overscan: 3,
    getScrollElement: () => parentRef.current,
  });

  const items = virtualizer.getVirtualItems();

  if (items.length === 0 && rows.length > 0) {
    return (
      <div className={colsClass}>
        {rows.flatMap((row) =>
          row.map((w) => <FallenCard key={w.id} warrior={w} season={season} />)
        )}
      </div>
    );
  }

  return (
    <div ref={parentRef} className="max-h-[80vh] overflow-auto">
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          width: '100%',
          position: 'relative',
        }}
      >
        {items.map((virtualRow) => (
          <div
            key={virtualRow.key}
            data-index={virtualRow.index}
            ref={virtualizer.measureElement}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              transform: `translateY(${virtualRow.start}px)`,
            }}
          >
            <div className={colsClass}>
              {rows[virtualRow.index]?.map((w) => (
                <FallenCard key={w.id} warrior={w} season={season} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function FallenCard({ warrior: w, season }: { warrior: Warrior; season: string }) {
  return (
    <Surface
      variant="glass"
      padding="none"
      className="group relative border-border/40 overflow-hidden hover:border-destructive/40 transition-all duration-500 shadow-2xl h-full flex flex-col"
    >
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-destructive via-destructive/40 to-transparent opacity-60 group-hover:opacity-100 transition-opacity" />
      <div className="p-8 flex-1 flex flex-col">
        <div className="flex justify-between items-start mb-8">
          <div className="flex flex-col">
            <WarriorLink
              name={w.name}
              id={w.id}
              className="font-display font-black text-2xl uppercase tracking-tighter group-hover:text-destructive transition-colors"
            />
            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-muted-foreground/50 mt-1">
              {STYLE_DISPLAY_NAMES[w.style as FightingStyle]}
            </span>
          </div>
          <div className="flex flex-col items-end gap-2">
            <Badge
              variant="outline"
              className="text-[9px] font-black tracking-widest text-destructive bg-destructive/10 border-destructive/30 uppercase py-1 px-3"
            >
              Terminated
            </Badge>
            {(w.career?.medals?.gold ?? 0) > 0 && (
              <Badge className="bg-arena-gold text-primary-foreground text-[8px] font-black tracking-widest px-2">
                Champion
              </Badge>
            )}
          </div>
        </div>

        <Surface variant="blood" className="p-5 mb-8 relative border-destructive/10">
          <Skull className="absolute top-3 right-3 w-12 h-12 text-destructive/5 pointer-events-none" />
          <p className="text-xs text-foreground/90 italic font-medium leading-relaxed mb-4 pr-8">
            &quot;
            {w.deathEvent?.deathSummary || w.causeOfDeath || w.deathCause || 'Killed in the arena.'}
            &quot;
          </p>
          <div className="space-y-3 border-t border-destructive/10 pt-4 mt-auto">
            <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">
              <Crosshair className="w-3.5 h-3.5 text-destructive" />
              {w.killedBy ? (
                <>
                  Fatal strike by: <span className="text-foreground">{w.killedBy}</span>
                </>
              ) : (
                <>Killed in arena combat</>
              )}
            </div>
            <div className="flex items-center justify-between text-[10px] font-mono font-black text-muted-foreground/30">
              <span>
                Week {w.deathWeek || '??'} &middot; {season?.toUpperCase()}
              </span>
              <span className="flex items-center gap-1.5">
                <Activity className="h-3 w-3" /> Remains recovered
              </span>
            </div>
          </div>
        </Surface>

        <div className="grid grid-cols-2 gap-4 mt-auto">
          <div className="bg-white/[0.02] p-4 border border-white/5 text-center">
            <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/40 block mb-1">
              Service Record
            </span>
            <span className="text-sm font-mono font-black">
              {w.career?.wins || 0}W-{w.career?.losses || 0}L-{w.career?.kills || 0}K
            </span>
          </div>
          <div className="bg-white/[0.02] p-4 border border-white/5 text-center">
            <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/40 block mb-1">
              Final Fame
            </span>
            <span className="text-sm font-mono font-black text-arena-gold">{w.fame}G</span>
          </div>
        </div>

        {w.career?.medals &&
          (w.career.medals.gold > 0 ||
            w.career.medals.silver > 0 ||
            w.career.medals.bronze > 0) && (
            <div className="flex flex-wrap gap-2 pt-6 mt-6 border-t border-white/5">
              {w.career.medals.gold > 0 && (
                <span className="text-[9px] uppercase font-black tracking-widest text-arena-gold bg-arena-gold/10 px-2.5 py-1.5 border border-arena-gold/20">
                  GOLD &middot; VALOR
                </span>
              )}
              {w.career.medals.silver > 0 && (
                <span className="text-[9px] uppercase font-black tracking-widest text-muted-foreground bg-foreground/5 px-2.5 py-1.5 border border-border/20">
                  SILVER &middot; TOKEN
                </span>
              )}
              {w.career.medals.bronze > 0 && (
                <span className="text-[9px] uppercase font-black tracking-widest text-arena-gold bg-arena-gold/10 px-2.5 py-1.5 border border-arena-gold/20">
                  BRONZE &middot; ELITE
                </span>
              )}
            </div>
          )}
      </div>
    </Surface>
  );
}
