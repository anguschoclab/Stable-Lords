import { useMemo } from 'react';
import { useWorldState, useGameStore } from '@/state/useGameStore';
import { type Warrior, STYLE_DISPLAY_NAMES } from '@/types/game';
import {
  getRecommendedChallenges,
  getMatchupsToAvoid,
  type MatchupScore,
} from '@/engine/matchmaking/schedulingAssistant';
import { Surface } from '@/components/ui/Surface';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { SectionDivider } from '@/components/ui/SectionDivider';
import { ImperialRing } from '@/components/ui/ImperialRing';
import { Link } from '@tanstack/react-router';
import { Swords, ExternalLink, TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { warriorDisplayName } from '@/utils/warriorDisplay';

interface MatchupCardProps {
  matchup: MatchupScore;
  type: 'recommend' | 'avoid';
  isChallenged: boolean;
  isAvoided: boolean;
  onToggleChallenge: () => void;
  onToggleAvoid: () => void;
}

/** Card head — direction icon + warrior name + profile link. */
function CardHeader({ w, isGood }: { w: MatchupScore['rivalWarrior']; isGood: boolean }) {
  return (
    <div className="flex items-center justify-between mb-3">
      <div className="flex items-center gap-3">
        <ImperialRing size="xs" variant={isGood ? 'bronze' : 'blood'}>
          {isGood ? (
            <TrendingUp className="h-3 w-3 text-primary" />
          ) : (
            <TrendingDown className="h-3 w-3 text-destructive" />
          )}
        </ImperialRing>
        <span className="font-display font-black text-[11px] uppercase tracking-tight text-foreground">
          {warriorDisplayName(w)}
        </span>
      </div>
      <Link to="/warrior/$id" params={{ id: w.id }}>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity motion-reduce:transition-none"
          tooltip="View warrior profile"
          aria-label="View warrior profile"
        >
          <ExternalLink className="h-3 w-3" />
        </Button>
      </Link>
    </div>
  );
}

/** Style/stable badges + the analyst's note list. */
function MatchupDetails({ matchup, isGood }: { matchup: MatchupScore; isGood: boolean }) {
  return (
    <>
      <div className="flex flex-wrap gap-2 mb-4">
        <Badge
          variant="outline"
          className="text-[8px] font-black uppercase tracking-widest px-2 py-0 rounded-none border-white/5 bg-white/5"
        >
          {STYLE_DISPLAY_NAMES[matchup.rivalWarrior.style]}
        </Badge>
        <Badge
          variant="outline"
          className="text-[8px] font-black uppercase tracking-widest px-2 py-0 rounded-none border-white/5 bg-white/5"
        >
          {matchup.rivalStableName}
        </Badge>
      </div>

      <div className="space-y-2 mb-4">
        {matchup.notes.map((note, i) => (
          <div
            key={`${note.slice(0, 20)}-${i}`}
            className="text-[9px] text-muted-foreground/60 flex items-center gap-2 italic uppercase font-black tracking-tight"
          >
            <div className={cn('h-1 w-1', isGood ? 'bg-primary' : 'bg-destructive')} />
            {note}
          </div>
        ))}
      </div>
    </>
  );
}

/** Priority score readout + challenge/avoid toggles. */
function CardFooter({
  score,
  isGood,
  isChallenged,
  isAvoided,
  onToggleChallenge,
  onToggleAvoid,
}: {
  score: number;
  isGood: boolean;
  isChallenged: boolean;
  isAvoided: boolean;
  onToggleChallenge: () => void;
  onToggleAvoid: () => void;
}) {
  return (
    <>
      <div className="flex items-center justify-between pt-3 border-t border-white/5">
        <div className="text-[8px] uppercase font-black text-muted-foreground/40 tracking-[0.2em]">
          Priority_Index
        </div>
        <div
          className={cn(
            'text-xs font-display font-black',
            isGood ? 'text-primary' : 'text-destructive'
          )}
        >
          {Math.round(score)}
        </div>
      </div>

      <div className="flex items-center gap-2 pt-3">
        <Button
          variant={isChallenged ? 'default' : 'outline'}
          size="sm"
          onClick={onToggleChallenge}
          className="font-display font-black uppercase tracking-widest text-[8px] h-7 px-3"
        >
          {isChallenged ? 'Challenged' : 'Challenge'}
        </Button>
        <Button
          variant={isAvoided ? 'destructive' : 'outline'}
          size="sm"
          onClick={onToggleAvoid}
          className="font-display font-black uppercase tracking-widest text-[8px] h-7 px-3"
        >
          {isAvoided ? 'Avoided' : 'Avoid'}
        </Button>
      </div>
    </>
  );
}

function MatchupCard({
  matchup,
  type,
  isChallenged,
  isAvoided,
  onToggleChallenge,
  onToggleAvoid,
}: MatchupCardProps) {
  const isGood = type === 'recommend';

  return (
    <Surface
      variant="glass"
      className={cn(
        'p-4 border-white/5 transition-all motion-reduce:transition-none motion-reduce:transform-none group hover:bg-white/[0.02]',
        isGood ? 'hover:border-primary/20' : 'hover:border-destructive/20'
      )}
    >
      <CardHeader w={matchup.rivalWarrior} isGood={isGood} />
      <MatchupDetails matchup={matchup} isGood={isGood} />
      <CardFooter
        score={matchup.score}
        isGood={isGood}
        isChallenged={isChallenged}
        isAvoided={isAvoided}
        onToggleChallenge={onToggleChallenge}
        onToggleAvoid={onToggleAvoid}
      />
    </Surface>
  );
}

interface SchedulingWidgetProps {
  warrior: Warrior;
}

type Matchup = ReturnType<typeof getRecommendedChallenges>[number];

type MatchupFlags = {
  playerChallenges: string[] | undefined;
  playerAvoids: string[] | undefined;
  toggleChallenge: (id: string) => void;
  toggleAvoid: (id: string) => void;
};

/** One matchup column: divider label, cards, or an empty-state notice. */
function MatchupColumn({
  label,
  variant,
  matchups,
  type,
  emptyText,
  flags,
}: {
  label: string;
  variant?: 'blood';
  matchups: Matchup[];
  type: 'recommend' | 'avoid';
  emptyText: string;
  flags: MatchupFlags;
}) {
  return (
    <div className="space-y-6">
      <SectionDivider label={label} variant={variant} />
      <div className="space-y-4">
        {matchups.length > 0 ? (
          matchups.map((m) => (
            <MatchupCard
              key={m.rivalStableName}
              matchup={m}
              type={type}
              isChallenged={flags.playerChallenges?.includes(m.rivalWarrior.id) ?? false}
              isAvoided={flags.playerAvoids?.includes(m.rivalWarrior.id) ?? false}
              onToggleChallenge={() => flags.toggleChallenge(m.rivalWarrior.id)}
              onToggleAvoid={() => flags.toggleAvoid(m.rivalWarrior.id)}
            />
          ))
        ) : (
          <p className="text-[10px] text-muted-foreground/20 italic p-12 border border-dashed border-white/5 text-center uppercase font-black tracking-widest">
            {emptyText}
          </p>
        )}
      </div>
    </div>
  );
}

/**
 * Scheduling widget.
 * @param - { warrior }.
 */
export function SchedulingWidget({ warrior }: SchedulingWidgetProps) {
  const state = useWorldState();
  const flags = {
    playerChallenges: useGameStore((s) => s.playerChallenges),
    playerAvoids: useGameStore((s) => s.playerAvoids),
    toggleChallenge: useGameStore((s) => s.toggleChallenge),
    toggleAvoid: useGameStore((s) => s.toggleAvoid),
  };

  const recommendations = useMemo(
    () => getRecommendedChallenges(state, warrior, 2),
    [state, warrior]
  );

  const toAvoid = useMemo(() => getMatchupsToAvoid(state, warrior, 2), [state, warrior]);

  return (
    <div className="space-y-12">
      <div className="grid gap-12 md:grid-cols-2">
        <MatchupColumn
          label="Upcoming Bouts"
          matchups={recommendations}
          type="recommend"
          emptyText="No prime targets available."
          flags={flags}
        />
        <MatchupColumn
          label="High Risk Vectors"
          variant="blood"
          matchups={toAvoid}
          type="avoid"
          emptyText="No imminent threats detected."
          flags={flags}
        />
      </div>

      <Surface variant="glass" className="p-8 border-white/5 bg-white/[0.01]">
        <div className="flex items-start gap-4">
          <ImperialRing size="sm" variant="bronze">
            <Swords className="h-4 w-4 text-muted-foreground/40" />
          </ImperialRing>
          <div className="text-[11px] text-muted-foreground/60 leading-relaxed uppercase font-black tracking-tight">
            <span className="text-foreground">Tactical Intelligence Note:</span> Engagement matrices
            are calculated based on style affinity, historical performance, and institutional fame
            differential. Grudge matches against rivals escalate priority levels.
          </div>
        </div>
      </Surface>
    </div>
  );
}
