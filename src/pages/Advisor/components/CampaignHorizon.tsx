import { Surface } from '@/components/ui/Surface';
import { ImperialRing } from '@/components/ui/ImperialRing';
import { CalendarClock, HeartPulse, Trophy, Swords } from 'lucide-react';
import { useStableAdvisor } from '@/hooks/useStableAdvisor';

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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-muted-foreground/60">
            <Swords className="h-3 w-3 text-primary" />
            Committed Bouts
          </div>
          {lookahead.futureCommitments.length === 0 ? (
            <p className="text-[10px] font-mono text-muted-foreground/50">
              No bouts booked beyond next week
            </p>
          ) : (
            <ul className="space-y-1.5">
              {lookahead.futureCommitments.map((c) => (
                <li key={c.offerId} className="text-xs font-semibold text-foreground/90">
                  WK {c.absoluteWeek} — {c.warriorName} vs {c.opponentName}
                  <span className="text-muted-foreground/60 font-mono"> · {c.purse}G</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-muted-foreground/60">
            <HeartPulse className="h-3 w-3 text-destructive" />
            Recovery Returns
          </div>
          {lookahead.recoveryEtas.length === 0 ? (
            <p className="text-[10px] font-mono text-muted-foreground/50">Roster at full health</p>
          ) : (
            <ul className="space-y-1.5">
              {lookahead.recoveryEtas.map((e) => (
                <li key={e.warriorId} className="text-xs font-semibold text-foreground/90">
                  {e.warriorName}
                  <span className="text-muted-foreground/60 font-mono">
                    {' '}
                    · returns WK {e.returnsAbsoluteWeek}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

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
      </div>
    </Surface>
  );
}
