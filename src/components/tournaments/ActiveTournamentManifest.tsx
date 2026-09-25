import { Play, Settings2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { SectionDivider } from '@/components/ui/SectionDivider';
import { Surface } from '@/components/ui/Surface';
import { ImperialRing } from '@/components/ui/ImperialRing';
import type { TournamentEntry, FightSummary } from '@/types/game';
import { TournamentBracket } from './TournamentBracket';
import { TournamentSchedule } from './TournamentSchedule';
import { ChampionDisplay, BronzeHighlight, TournamentProgress } from './TournamentBracket';

interface ActiveTournamentManifestProps {
  tournament: TournamentEntry;
  arenaHistory: FightSummary[];
  week: number;
  expandedBout: string | null;
  onToggleExpand: (id: string | null) => void;
  isReadyToStart: boolean;
  onExecuteRound: () => void;
  onOpenPrep: () => void;
  seasonIcon: string;
  isSimulating?: boolean;
}

/**
 * Active tournament manifest: header, schedule, bracket, and the
 * EXECUTE NEXT BOUT / OPEN PREPARATION CONSOLE action footer.
 */
export function ActiveTournamentManifest({
  tournament,
  arenaHistory,
  week,
  expandedBout,
  onToggleExpand,
  isReadyToStart,
  onExecuteRound,
  onOpenPrep,
  seasonIcon,
  isSimulating,
}: ActiveTournamentManifestProps) {
  const bracket = tournament.bracket;
  const totalMatches = bracket.length;

  let completedMatches = 0;
  let maxRound = 0;
  let minIncompleteRound = Infinity;

  for (let i = 0; i < totalMatches; i++) {
    const b = bracket[i];
    if (!b) continue;
    if (b.winner !== undefined) {
      completedMatches++;
    } else if (b.round < minIncompleteRound) {
      minIncompleteRound = b.round;
    }
    if (b.round > maxRound) {
      maxRound = b.round;
    }
  }

  const isComplete = totalMatches > 0 && completedMatches === totalMatches;
  const totalRounds = maxRound;
  const currentRound = isComplete
    ? maxRound
    : minIncompleteRound === Infinity
      ? 0
      : minIncompleteRound;

  const participantName = (id: string | undefined) =>
    tournament.participants?.find((w) => w.id === id)?.name ?? 'Unknown';

  let championshipBout;
  let bronzeBout;
  for (let i = 0; i < totalMatches; i++) {
    const b = bracket[i];
    if (!b) continue;
    if (b.round === maxRound && b.matchIndex === 0) {
      championshipBout = b;
    } else if (b.matchIndex === 1 && (b.round === maxRound || b.round === maxRound - 1)) {
      bronzeBout = b;
    }
  }
  const championId =
    isComplete && championshipBout?.winner
      ? championshipBout.winner === 'A'
        ? championshipBout.warriorIdA
        : championshipBout.warriorIdD
      : undefined;
  const bronzeId =
    isComplete && bronzeBout?.winner
      ? bronzeBout.winner === 'A'
        ? bronzeBout.warriorIdA
        : bronzeBout.warriorIdD
      : undefined;

  return (
    <div className="pt-8">
      <SectionDivider label="Active Manifest" variant="primary" />
      <Surface
        variant="glass"
        padding="none"
        className="border-primary/20 shadow-[0_0_50px_-10px_rgba(135,34,40,0.15)] overflow-hidden"
      >
        <div className="pb-6 bg-primary/5 border-b border-white/5 p-8 flex items-center justify-between">
          <div className="flex items-center gap-5">
            <ImperialRing size="md" variant="blood">
              <span className="text-xl">{seasonIcon}</span>
            </ImperialRing>
            <div className="flex flex-col">
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">
                Tournament Active
              </span>
              <h3 className="font-display text-2xl font-black uppercase tracking-tight text-foreground">
                {tournament.name}
              </h3>
            </div>
          </div>
          <Badge className="bg-primary text-primary-foreground font-black uppercase text-[10px] tracking-[0.3em] px-6 py-2 rounded-none animate-pulse motion-reduce:animate-none">
            LIVE PHASE
          </Badge>
        </div>

        <div className="p-0">
          <div className="p-8 border-b border-white/5 bg-white/[0.01]">
            <TournamentSchedule tournament={tournament} currentWeek={week} />
          </div>

          <div className="px-8 pt-8">
            <TournamentProgress
              currentRound={currentRound}
              totalRounds={totalRounds}
              completedMatches={completedMatches}
              totalMatches={totalMatches}
            />
          </div>

          <div className="py-12 bg-gradient-to-b from-transparent to-white/[0.02]">
            <TournamentBracket
              bouts={tournament.bracket}
              arenaHistory={arenaHistory}
              expandedBout={expandedBout}
              onToggleExpand={onToggleExpand}
            />
          </div>

          {isComplete && (
            <div className="grid gap-4 px-8 pb-8 md:grid-cols-2">
              {championId && (
                <ChampionDisplay
                  championName={participantName(championId)}
                  championId={championId}
                  tournamentName={tournament.name}
                />
              )}
              {bronzeId && (
                <BronzeHighlight
                  thirdPlaceName={participantName(bronzeId)}
                  thirdPlaceId={bronzeId}
                />
              )}
            </div>
          )}

          {tournament.bracket.some((b) => b.winner === undefined) && (
            <div className="flex flex-col gap-6 p-8 border-t border-white/5 bg-primary/5">
              <div className="flex gap-6">
                <Button
                  onClick={onExecuteRound}
                  disabled={isSimulating}
                  className="flex-1 h-16 font-black uppercase text-[12px] tracking-[0.4em] bg-primary text-primary-foreground hover:bg-primary/90 hover:shadow-[0_0_30px_rgba(135,34,40,0.4)] transition-all motion-reduce:transition-none rounded-none"
                >
                  <Play className="h-5 w-5 mr-4 fill-current" /> EXECUTE NEXT BOUT
                </Button>
              </div>

              {isReadyToStart && (
                <Button
                  variant="outline"
                  onClick={onOpenPrep}
                  className="w-full h-12 font-black uppercase text-[10px] tracking-[0.2em] gap-3 bg-white/5 border-white/10 hover:bg-white/10 transition-all motion-reduce:transition-none rounded-none"
                >
                  <Settings2 className="h-4 w-4" /> OPEN PREPARATION CONSOLE
                </Button>
              )}
            </div>
          )}
        </div>
      </Surface>
    </div>
  );
}
