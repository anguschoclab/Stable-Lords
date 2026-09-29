import { Link } from '@tanstack/react-router';
import { AlertTriangle, Trophy, Snowflake } from 'lucide-react';
import { SectionDivider } from '@/components/ui/SectionDivider';
import { Surface } from '@/components/ui/Surface';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { STYLE_DISPLAY_NAMES, type WeatherType } from '@/types/shared.types';
import { fightExperience, prepIssues, type PrepIssue } from './prepChecks';
import type { Warrior, TournamentEntry } from '@/types/state.types';
import { warriorDisplayName } from '@/utils/warriorDisplay';

function EntrantName({ w, isPlayerOwned }: { w: Warrior; isPlayerOwned: boolean }) {
  return (
    <div className="flex items-center gap-2">
      {isPlayerOwned ? (
        <Link
          to="/warrior/$id"
          params={{ id: w.id }}
          className="text-[11px] font-black uppercase tracking-tight text-foreground hover:text-primary transition-colors motion-reduce:transition-none"
        >
          {warriorDisplayName(w)}
        </Link>
      ) : (
        <span className="text-[11px] font-black uppercase tracking-tight text-foreground">
          {warriorDisplayName(w)}
        </span>
      )}
      {isPlayerOwned && (
        <Badge className="rounded-none text-[7px] font-black uppercase tracking-widest bg-primary/10 text-primary border-primary/20">
          Yours
        </Badge>
      )}
    </div>
  );
}

function EntrantIssues({ issues }: { issues: PrepIssue[] }) {
  if (issues.length === 0) {
    return (
      <Badge className="rounded-none text-[7px] font-black uppercase tracking-widest bg-primary/10 text-primary border-primary/20">
        Cleared
      </Badge>
    );
  }
  return (
    <>
      {issues.map((i) => (
        <Badge
          key={i.label}
          variant="outline"
          className={cn(
            'rounded-none text-[7px] font-black uppercase tracking-widest',
            i.blocking
              ? 'text-destructive border-destructive/40 bg-destructive/10'
              : 'text-arena-gold border-arena-gold/30 bg-arena-gold/5'
          )}
        >
          {i.label}
        </Badge>
      ))}
    </>
  );
}

function EntrantRow({
  w,
  stableName,
  isPlayerOwned,
  issues,
}: {
  w: Warrior;
  stableName: string;
  isPlayerOwned: boolean;
  issues: PrepIssue[];
}) {
  return (
    <div
      className={cn(
        'flex items-center justify-between gap-4 p-3 border border-white/5 bg-white/[0.02]',
        issues.some((i) => i.blocking) && 'border-destructive/20 bg-destructive/[0.03]'
      )}
    >
      <div className="min-w-0">
        <EntrantName w={w} isPlayerOwned={isPlayerOwned} />
        <span className="text-[9px] text-muted-foreground/50 uppercase tracking-widest">
          {stableName} · {STYLE_DISPLAY_NAMES[w.style]} · {fightExperience(w)} FE
        </span>
      </div>
      <div className="flex items-center gap-1.5 shrink-0">
        <EntrantIssues issues={issues} />
      </div>
    </div>
  );
}

/** One tournament tier's entrant list with per-warrior prep issues. */
export function TierSection({
  tournament,
  stableNames,
  playerStableId,
  weather,
}: {
  tournament: TournamentEntry;
  stableNames: Map<string, string>;
  playerStableId: string | undefined;
  weather: WeatherType | undefined;
}) {
  return (
    <section>
      <SectionDivider label={`${tournament.tierId} Class — ${tournament.name}`} />
      <div className="mt-6 space-y-1.5">
        {tournament.participants.map((w) => (
          <EntrantRow
            key={w.id}
            w={w}
            stableName={stableNames.get(w.stableId ?? '') ?? 'Free Agent'}
            isPlayerOwned={w.stableId === playerStableId}
            issues={prepIssues(w, weather)}
          />
        ))}
        {tournament.participants.length === 0 && (
          <div className="py-8 text-center border border-dashed border-white/10">
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/40">
              No entrants recorded
            </span>
          </div>
        )}
      </div>
    </section>
  );
}

/** Empty state when no pending brackets exist for the current week. */
export function EmptyPrepState() {
  return (
    <Surface
      variant="glass"
      className="py-20 text-center border-dashed border-white/10 flex flex-col items-center gap-4"
    >
      <Snowflake className="h-10 w-10 text-muted-foreground/20" />
      <div className="space-y-1">
        <p className="text-sm font-display font-black uppercase tracking-[0.2em] text-muted-foreground">
          No pending tournament
        </p>
        <p className="text-[10px] text-muted-foreground/50 uppercase tracking-widest">
          Prep mode opens when the season&apos;s brackets are drawn
        </p>
      </div>
      <Link
        to="/world/tournaments"
        className="mt-2 flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.3em] text-arena-gold/70 hover:text-arena-gold border border-arena-gold/20 hover:border-arena-gold/50 bg-arena-gold/5 hover:bg-arena-gold/10 px-4 py-2 transition-all motion-reduce:transition-none"
      >
        <Trophy className="h-3 w-3" /> Tournament Index
      </Link>
    </Surface>
  );
}

/** Advisory banner explaining the prep checklist semantics. */
export function PrepNotice() {
  return (
    <Surface
      variant="glass"
      className="p-5 border-l-2 border-primary/40 bg-white/[0.01] flex items-start gap-3"
    >
      <AlertTriangle className="h-4 w-4 text-arena-gold shrink-0 mt-0.5" />
      <p className="text-[10px] font-black uppercase tracking-[0.15em] text-muted-foreground/60 leading-relaxed">
        Blocking issues bar a warrior from the bracket; advisory issues (injuries, fatigue,
        weather aversion) are at your risk. Lineups freeze once the first bout resolves —
        inspect and adjust now.
      </p>
    </Surface>
  );
}
