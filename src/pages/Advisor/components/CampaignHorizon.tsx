import { Surface } from '@/components/ui/Surface';
import { ImperialRing } from '@/components/ui/ImperialRing';
import { CalendarClock, HeartPulse, Trophy, Swords, Crown } from 'lucide-react';
import { useStableAdvisor } from '@/hooks/useStableAdvisor';
import { getAllArenas } from '@/data/arenas';

const arenaName = (id: string): string =>
  getAllArenas().find((a) => a.id === id)?.name ?? id;

/** One horizon column: icon + label, then items or an empty-state line. */
function HorizonColumn<T>({
  icon,
  label,
  items,
  emptyText,
  renderItem,
  itemKey,
}: {
  icon: React.ReactNode;
  label: string;
  items: T[];
  emptyText: string;
  renderItem: (item: T) => React.ReactNode;
  itemKey: (item: T) => string;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-muted-foreground/60">
        {icon}
        {label}
      </div>
      {items.length === 0 ? (
        <p className="text-[10px] font-mono text-muted-foreground/50">{emptyText}</p>
      ) : (
        <ul className="space-y-1.5">
          {items.map((item) => (
            <li key={itemKey(item)} className="text-xs font-semibold text-foreground/90">
              {renderItem(item)}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

type Lookahead = ReturnType<typeof useStableAdvisor>['lookahead'];

/** Tournament countdown + projected-contender list. */
function TournamentColumn({ lookahead }: { lookahead: Lookahead }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-muted-foreground/60">
        <Trophy className="h-3 w-3 text-arena-gold" />
        Tournament
      </div>
      <p className="text-xs font-semibold text-foreground/90">
        {lookahead.weeksUntilTournament === 0
          ? 'Tournament week — brackets active'
          : `${lookahead.weeksUntilTournament} week${lookahead.weeksUntilTournament === 1 ? '' : 's'} until the seasonal tournament`}
      </p>
      {lookahead.projectedContenders.length > 0 && (
        <ul className="space-y-1.5">
          {lookahead.projectedContenders.map((c) => (
            <li key={c.warriorId} className="text-xs font-semibold text-foreground/90">
              {c.warriorName}
              <span className="text-muted-foreground/60 font-mono"> · {c.tierName}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/**
 * Campaign Horizon — the council's multi-week lookahead: committed bouts past
 * next week, injury return dates, and the seasonal tournament countdown.
 */
export function CampaignHorizon() {
  const { lookahead } = useStableAdvisor();

  return (
    <Surface variant="glass" className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <ImperialRing size="xs" variant="gold">
          <CalendarClock className="h-3.5 w-3.5 text-arena-gold" />
        </ImperialRing>
        <span className="text-[10px] font-black uppercase tracking-[0.25em] text-arena-gold">
          Campaign Horizon
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        <HorizonColumn
          icon={<Swords className="h-3 w-3 text-primary" />}
          label="Committed Bouts"
          items={lookahead.futureCommitments}
          emptyText="No bouts booked beyond next week"
          itemKey={(c) => c.offerId}
          renderItem={(c) => (
            <>
              WK {c.absoluteWeek} — {c.warriorName} vs {c.opponentName}
              <span className="text-muted-foreground/60 font-mono"> · {c.purse}G</span>
            </>
          )}
        />
        <HorizonColumn
          icon={<HeartPulse className="h-3 w-3 text-destructive" />}
          label="Recovery Returns"
          items={lookahead.recoveryEtas}
          emptyText="Roster at full health"
          itemKey={(e) => e.warriorId}
          renderItem={(e) => (
            <>
              {e.warriorName}
              <span className="text-muted-foreground/60 font-mono">
                {' '}
                · returns WK {e.returnsAbsoluteWeek}
              </span>
            </>
          )}
        />
        <TournamentColumn lookahead={lookahead} />
        <HorizonColumn
          icon={<Crown className="h-3 w-3 text-arena-gold" />}
          label="Title Defenses"
          items={lookahead.titleDefenses}
          emptyText="No crowns held"
          itemKey={(d) => d.arenaId}
          renderItem={(d) => (
            <>
              {d.warriorName}
              <span className="text-muted-foreground/60 font-mono">
                {' '}
                · {arenaName(d.arenaId)} · due WK {d.dueAbsoluteWeek}
              </span>
            </>
          )}
        />
      </div>
    </Surface>
  );
}
