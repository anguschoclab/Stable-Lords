import { Surface } from '@/components/ui/Surface';
import { Badge } from '@/components/ui/badge';
import { WarriorLink } from '@/components/EntityLink';
import {
  BookOpen,
  Trophy,
  Medal,
  Crown,
  Flame,
  Swords,
  Landmark,
  Scroll,
  Globe,
} from 'lucide-react';
import type {
  AlmanacBoard,
  AlmanacData,
  AlmanacRow,
  AlmanacStat,
} from '@/engine/analytics/almanac';

interface AlmanacSectionProps {
  data: AlmanacData;
}

const SECTION_META: {
  key: keyof Omit<AlmanacData, 'world'>;
  title: string;
  icon: typeof Trophy;
}[] = [
  { key: 'career', title: 'Career Records', icon: Trophy },
  { key: 'accolades', title: 'Annual Accolades', icon: Medal },
  { key: 'championships', title: 'Championship Lineage', icon: Crown },
  { key: 'streaks', title: 'Streaks', icon: Flame },
  { key: 'styleArena', title: 'Styles & Arenas', icon: Swords },
  { key: 'fights', title: 'Fight Records', icon: Landmark },
  { key: 'stables', title: 'Stable Records', icon: Scroll },
];

function WorldStrip({ stats }: { stats: AlmanacStat[] }) {
  if (stats.length === 0) return null;
  return (
    <div className="flex flex-wrap items-center gap-x-6 gap-y-2 border-y border-white/5 py-3">
      <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/50 flex items-center gap-1.5">
        <Globe className="h-3 w-3" /> World Registry
      </span>
      {stats.map((s) => (
        <span key={s.label} className="text-[10px] font-mono text-muted-foreground/80">
          <span className="uppercase text-muted-foreground/50">{s.label}</span>{' '}
          <span className="font-black text-foreground">{s.value}</span>
        </span>
      ))}
    </div>
  );
}

function RowLine({ row, index }: { row: AlmanacRow; index: number }) {
  return (
    <div className="flex items-baseline gap-3 py-1.5 border-b border-white/5 last:border-0">
      <span className="text-[10px] font-mono font-black text-foreground/20 w-6 shrink-0">
        #{index + 1}
      </span>
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2 flex-wrap">
          {row.warriorId ? (
            <WarriorLink
              name={row.name}
              className="text-xs font-display font-black uppercase tracking-tight text-foreground hover:text-primary transition-colors motion-reduce:transition-none"
            />
          ) : (
            <span className="text-xs font-display font-black uppercase tracking-tight text-foreground">
              {row.name}
            </span>
          )}
          {row.sub && (
            <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/60 truncate">
              {row.sub}
            </span>
          )}
          {row.status === 'Dead' && (
            <span className="text-[8px] font-black uppercase tracking-widest text-destructive/70">
              †
            </span>
          )}
          {row.archived && (
            <span className="text-[8px] font-black uppercase tracking-widest text-muted-foreground/50 italic">
              archived — lost to history
            </span>
          )}
        </div>
        {row.detail && (
          <div className="text-[9px] font-mono text-muted-foreground/50 truncate">
            {row.detail}
          </div>
        )}
        {row.tags && row.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-0.5">
            {row.tags.map((t) => (
              <Badge
                key={t}
                variant="outline"
                className="text-[8px] font-black border-white/10 bg-white/5 text-muted-foreground/70 px-1.5"
              >
                {t}
              </Badge>
            ))}
          </div>
        )}
      </div>
      <div className="text-right shrink-0">
        <span className="text-sm font-mono font-black text-primary/90">{row.value}</span>
        {row.valueLabel && (
          <span className="text-[8px] font-black uppercase tracking-widest text-muted-foreground/50 ml-1">
            {row.valueLabel}
          </span>
        )}
      </div>
    </div>
  );
}

function RecordBoard({ board }: { board: AlmanacBoard }) {
  return (
    <Surface
      variant="glass"
      padding="sm"
      className="border-border/10 bg-neutral-900/40"
      data-testid={`almanac-board-${board.id}`}
    >
      <div className="flex items-baseline justify-between gap-2 mb-2 pb-2 border-b border-white/5">
        <h4 className="font-display text-xs font-black uppercase tracking-tight text-foreground/90">
          {board.title}
        </h4>
        {board.caveat && (
          <span className="text-[8px] font-black uppercase tracking-widest text-arena-gold/70 italic">
            {board.caveat}
          </span>
        )}
      </div>
      {board.rows.length === 0 ? (
        <div className="py-4 text-center text-[9px] uppercase tracking-widest text-muted-foreground/40 italic">
          No records yet
        </div>
      ) : (
        board.rows.map((row, i) => <RowLine key={row.key} row={row} index={i} />)
      )}
    </Surface>
  );
}

/** The Almanac — the world's all-time record boards, live + archival. */
export function AlmanacSection({ data }: AlmanacSectionProps) {
  const anyBoards = SECTION_META.some(({ key }) => data[key].length > 0);
  return (
    <div className="space-y-10">
      <div className="flex items-end gap-3 border-b-2 border-accent/30 pb-2">
        <h2 className="font-display text-xl text-foreground leading-none flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-primary" /> The Almanac
        </h2>
        <span className="text-[10px] text-muted-foreground font-mono mb-0.5 uppercase">
          All-time records — live state + archive
        </span>
      </div>

      <WorldStrip stats={data.world} />

      {!anyBoards && (
        <div className="py-16 text-center">
          <BookOpen className="h-10 w-10 text-muted-foreground mx-auto mb-3 opacity-40" />
          <p className="text-muted-foreground text-sm uppercase font-black tracking-widest">
            Nothing recorded yet
          </p>
          <p className="text-muted-foreground text-[10px] mt-1">
            Records inscribe themselves as the sands remember.
          </p>
        </div>
      )}

      {SECTION_META.map(({ key, title, icon: Icon }) => {
        const boards = data[key];
        if (boards.length === 0) return null;
        return (
          <section key={key} className="space-y-4">
            <h3 className="font-display text-sm font-black uppercase tracking-tight text-muted-foreground flex items-center gap-2">
              <Icon className="h-4 w-4 text-primary/70" /> {title}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {boards.map((b) => (
                <RecordBoard key={b.id} board={b} />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
