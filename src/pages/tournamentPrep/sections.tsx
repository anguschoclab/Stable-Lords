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
import { AvatarForEntity } from '@/components/avatar';

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
      <div className="flex items-center gap-3 min-w-0">
        <AvatarForEntity
          entityId={w.id}
          entityType="warrior"
          source={w}
          size="xs"
          className="border border-white/10 bg-neutral-950 shrink-0"
        />
        <div className="min-w-0">
          <EntrantName w={w} isPlayerOwned={isPlayerOwned} />
          <span className="text-[9px] text-muted-foreground/50 uppercase tracking-widest">
            {stableName} · {STYLE_DISPLAY_NAMES[w.style]} · {fightExperience(w)} FE
          </span>
        </div>
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
            <span className="text-[10px] font-black uppercase tracking-[0.15em] text-muted-foreground/40">
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
        <p className="text-sm font-display font-black uppercase tracking-[0.15em] text-muted-foreground">
          No pending tournament
        </p>
        <p className="text-[10px] text-muted-foreground/50 uppercase tracking-widest">
          Prep mode opens when the season&apos;s brackets are drawn
        </p>
      </div>
      <Link
        to="/world/tournaments"
        className="mt-2 flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.15em] text-arena-gold/70 hover:text-arena-gold border border-arena-gold/20 hover:border-arena-gold/50 bg-arena-gold/5 hover:bg-arena-gold/10 px-4 py-2 transition-all motion-reduce:transition-none"
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
        Blocking issues bar a warrior from the bracket; advisory issues (injuries, fatigue, weather
        aversion) are at your risk. Lineups freeze once the first bout resolves — inspect and adjust
        now.
      </p>
    </Surface>
  );
}

import { Button } from '@/components/ui/button';
import { TOURNAMENT_CLASSES, classAtFreeze } from '@/engine/matchmaking/tournamentSelection/classes';
import { fightEquivalentsOf } from '@/engine/warrior/careerUpdate';
import type { TournamentCycle } from '@/types/state.types';
import type { StableId, WarriorId } from '@/types/shared.types';
import { Swords, XCircle } from 'lucide-react';

type EntryStatus = 'INVITED' | 'DECLARED' | 'SCRATCHED' | 'NONE';

function entryStatus(
  cycle: TournamentCycle,
  classId: string,
  warriorId: string,
  playerId: StableId
): EntryStatus {
  if (cycle.scratched.includes(warriorId)) return 'SCRATCHED';
  if ((cycle.invited[classId] ?? []).includes(warriorId)) return 'INVITED';
  if ((cycle.declared[playerId] ?? []).includes(warriorId)) return 'DECLARED';
  return 'NONE';
}

function statusBadge(status: EntryStatus) {
  switch (status) {
    case 'INVITED':
      return 'bg-arena-gold/10 text-arena-gold border-arena-gold/30';
    case 'DECLARED':
      return 'bg-primary/10 text-primary border-primary/30';
    case 'SCRATCHED':
      return 'bg-destructive/10 text-destructive border-destructive/30';
    default:
      return 'bg-white/[0.03] text-muted-foreground/50 border-white/10';
  }
}

/** One freeze-window roster row: frozen class, FE, breakpoint gap, desk action. */
function EntryRow({
  cycle,
  warrior: w,
  classId,
  playerId,
  onDeclare,
  onScratch,
}: {
  cycle: TournamentCycle;
  warrior: Warrior;
  classId: string;
  playerId: StableId;
  onDeclare: (id: WarriorId) => void;
  onScratch: (id: WarriorId) => void;
}) {
  const fe = cycle.feByWarrior[w.id] ?? fightEquivalentsOf(w);
  const next = TOURNAMENT_CLASSES.find((c) => c.minFE > fe);
  const gap = next ? next.minFE - fe : 0;
  const status = entryStatus(cycle, classId, w.id, playerId);
  return (
    <div className="flex items-center justify-between gap-4 p-3 border border-white/5 bg-white/[0.02]">
      <div className="flex items-center gap-3 min-w-0">
        <AvatarForEntity
          entityId={w.id}
          entityType="warrior"
          source={w}
          size="xs"
          className="border border-white/10 bg-neutral-950 shrink-0"
        />
        <div className="min-w-0">
          <EntrantName w={w} isPlayerOwned />
          <span className="text-[9px] text-muted-foreground/50 uppercase tracking-widest">
            {STYLE_DISPLAY_NAMES[w.style]} · {fe} FE
            {gap === 1 && next ? ' · one bout under breakpoint' : ''}
          </span>
        </div>
      </div>
      <div className="flex items-center gap-1.5 shrink-0">
        <Badge className={cn('rounded-none text-[7px] font-black uppercase tracking-widest', statusBadge(status))}>
          {status === 'NONE' ? 'Open' : status}
        </Badge>
        {status === 'NONE' && (
          <Button
            variant="outline"
            onClick={() => onDeclare(w.id)}
            className="h-6 px-2 text-[8px] font-black uppercase tracking-widest gap-1 rounded-none border-primary/30 hover:bg-primary/10"
          >
            <Swords className="h-2.5 w-2.5" /> Declare
          </Button>
        )}
        {(status === 'INVITED' || status === 'DECLARED') && (
          <Button
            variant="outline"
            onClick={() => onScratch(w.id)}
            className="h-6 px-2 text-[8px] font-black uppercase tracking-widest gap-1 rounded-none border-destructive/30 hover:bg-destructive/10 text-destructive"
          >
            <XCircle className="h-2.5 w-2.5" /> Scratch
          </Button>
        )}
      </div>
    </div>
  );
}

/**
 * V27 Entry Desk — the freeze-window surface. FE is locked at the snapshot;
 * the player files declarations (≤4 per class) and scratches before brackets draw.
 */
export function EntryDeskSection({
  cycle,
  roster,
  playerId,
  onDeclare,
  onScratch,
}: {
  cycle: TournamentCycle;
  roster: Warrior[];
  playerId: StableId;
  onDeclare: (id: WarriorId) => void;
  onScratch: (id: WarriorId) => void;
}) {
  return (
    <section className="space-y-8">
      <SectionDivider label={`Entry Desk — ${cycle.season} Week ${cycle.forWeek}`} />
      <Surface
        variant="glass"
        className="p-5 border-l-2 border-arena-gold/40 bg-white/[0.01]"
      >
        <p className="text-[10px] font-black uppercase tracking-[0.15em] text-muted-foreground/60 leading-relaxed">
          Fight equivalents froze at week {cycle.frozenAtAbsWeek}. Bouts fought now add real
          experience on top of the locked class — they cannot move a warrior up a bracket.
        </p>
      </Surface>
      {TOURNAMENT_CLASSES.map((spec) => {
        const entrants = roster.filter(
          (w) => classAtFreeze({ tournamentCycle: cycle }, w.id, fightEquivalentsOf(w)) === spec.id
        );
        if (entrants.length === 0) return null;
        return (
          <div key={spec.id}>
            <div className="mb-3 flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-[0.15em] text-arena-gold">
                {spec.name}
              </span>
              <span className="text-[9px] uppercase tracking-widest text-muted-foreground/50">
                {spec.minFE}+ FE{spec.id !== 'champions' ? '' : ' · Champions'}
              </span>
            </div>
            <div className="space-y-1.5">
              {entrants.map((w) => (
                <EntryRow
                  key={w.id}
                  cycle={cycle}
                  warrior={w}
                  classId={spec.id}
                  playerId={playerId}
                  onDeclare={onDeclare}
                  onScratch={onScratch}
                />
              ))}
            </div>
          </div>
        );
      })}
    </section>
  );
}
