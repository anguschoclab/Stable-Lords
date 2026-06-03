import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Surface } from '@/components/ui/Surface';
import { SectionDivider } from '@/components/ui/SectionDivider';
import { ImperialRing } from '@/components/ui/ImperialRing';
import { Zap, Activity, Skull } from 'lucide-react';
import { MatchCard } from '@/components/run-round/MatchCard';
import { RunResults } from '@/components/run-round/RunResults';
import { AutosimConsole } from '@/components/run-round/AutosimConsole';
import type { Warrior } from '@/types/warrior.types';
import type { RivalStableData } from '@/types/game';
import type { useCombatExecution } from '@/hooks/useCombatExecution';

/** A resolved player-vs-rival pairing rendered in the active manifest. */
export interface MatchCardEntry {
  playerWarrior: Warrior;
  rivalWarrior: Warrior;
  rivalStable: RivalStableData;
  isRivalryBout: boolean;
}

interface CombatExecutionPanelProps {
  combat: ReturnType<typeof useCombatExecution>;
  fightReadyCount: number;
  matchCard: MatchCardEntry[];
  crowdMood: string;
}

/**
 * Inline combat-execution panel for the Arena Hub. Renders the engagement
 * console, active manifest / results, and the autosim bridge. Driven entirely
 * by the {@link useCombatExecution} hook state passed via `combat`.
 */
export function CombatExecutionPanel({
  combat,
  fightReadyCount,
  matchCard,
  crowdMood,
}: CombatExecutionPanelProps) {
  const {
    showCombat,
    setShowCombat,
    results,
    setResults,
    running,
    autosimming,
    autosimProgress,
    autosimResult,
    setAutosimResult,
    expandedId,
    setExpandedId,
    handleExecuteCycle,
    handleStartAutosim,
  } = combat;

  if (!showCombat) return null;

  return (
    <div className="space-y-10 border-t-2 border-primary/20 pt-16 animate-in slide-in-from-bottom-10 duration-700 ease-out">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <ImperialRing size="md" variant="blood">
            <Zap className="h-5 w-5 text-primary" />
          </ImperialRing>
          <div className="flex flex-col">
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">
              Engage Mode
            </span>
            <h3 className="font-display font-black text-xl uppercase tracking-tight text-foreground">
              {' '}
              Engagement Console
            </h3>
          </div>
        </div>
        {results.length > 0 && (
          <Button
            variant="outline"
            onClick={() => {
              setShowCombat(false);
              setResults([]);
              setAutosimResult(null);
            }}
            className="text-[10px] font-black uppercase tracking-[0.2em] border-white/10 h-12 px-8 rounded-none hover:bg-white/5 transition-all"
          >
            Seal Results
          </Button>
        )}
      </div>

      <Surface
        variant="glass"
        className="flex items-center gap-12 p-8 border-l-4 border-l-primary shadow-xl"
      >
        <div className="flex flex-col gap-1">
          <span className="text-[9px] font-black uppercase tracking-[0.3em] text-muted-foreground/50">
            Readiness State
          </span>
          <div className="flex items-center gap-4">
            <Activity className="h-5 w-5 text-primary" />
            <span className="font-display font-black text-xl uppercase tracking-tighter">
              Operational
            </span>
          </div>
        </div>
        <div className="h-12 w-px bg-white/5" />
        <div className="flex items-center gap-12">
          <div className="flex flex-col">
            <span className="text-[9px] font-black uppercase text-muted-foreground/40 tracking-[0.2em] mb-1">
              Mission Ready
            </span>
            <span className="font-display font-black text-3xl text-primary leading-none">
              {fightReadyCount}
            </span>
          </div>
          <div className="flex flex-col">
            <span className="text-[9px] font-black uppercase text-muted-foreground/40 tracking-[0.2em] mb-1">
              Combat Pairs
            </span>
            <span className="font-display font-black text-3xl text-arena-gold leading-none">
              {matchCard.length}
            </span>
          </div>
        </div>
        {!autosimming && !autosimResult && results.length === 0 && (
          <div className="ml-auto">
            <Button
              onClick={handleExecuteCycle}
              disabled={running || (matchCard.length === 0 && fightReadyCount < 2)}
              className="h-14 px-12 gap-4 font-black uppercase text-[14px] tracking-[0.3em] bg-primary text-primary-foreground hover:bg-primary/90 hover:shadow-[0_0_30px_rgba(135,34,40,0.4)] transition-all rounded-none"
            >
              <Zap className="h-5 w-5 fill-current" />
              EXECUTE CYLCE
            </Button>
          </div>
        )}
      </Surface>

      {/* Match Card / Results */}
      <div className="max-w-4xl mx-auto space-y-12">
        {results.length > 0 ? (
          <RunResults results={results} expandedId={expandedId} onToggleExpand={setExpandedId} />
        ) : (
          <Surface variant="glass" className="p-0 border-accent/20 overflow-hidden">
            <div className="p-6 border-b border-white/5 bg-white/[0.02] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <ImperialRing size="sm" variant="gold">
                  <Activity className="h-3.5 w-3.5 text-accent" />
                </ImperialRing>
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-foreground/80">
                  Active Manifest
                </span>
              </div>
              <Badge
                variant="outline"
                className="text-[9px] font-black uppercase tracking-[0.2em] border-white/10 rounded-none h-8 px-4"
              >
                {matchCard.length} PAIRINGS
              </Badge>
            </div>
            <div className="p-8">
              {matchCard.length > 0 ? (
                <div className="grid grid-cols-1 gap-6">
                  {matchCard.map((p, i) => (
                    <MatchCard
                      key={i}
                      pairing={{
                        a: p.playerWarrior,
                        d: p.rivalWarrior,
                        rivalStable: p.rivalStable?.owner?.stableName || 'Rival Stable',
                        isRivalry: p.isRivalryBout,
                      }}
                      crowdMood={crowdMood}
                    />
                  ))}
                </div>
              ) : (
                <div className="py-24 text-center">
                  <ImperialRing size="lg" variant="bronze" className="mx-auto mb-6 opacity-10">
                    <Skull className="h-8 w-8" />
                  </ImperialRing>
                  <p className="text-[12px] font-black uppercase tracking-[0.4em] text-muted-foreground/30 leading-relaxed">
                    Zero Engagement Pairs Detected
                  </p>
                </div>
              )}
            </div>
          </Surface>
        )}

        {/* Autosim */}
        <div className="pt-16 border-t border-white/5">
          <SectionDivider label="Autonomous Simulation Bridge" />
          <AutosimConsole
            isSimulating={autosimming}
            progress={autosimProgress}
            result={autosimResult}
            onStart={handleStartAutosim}
            onReset={() => setAutosimResult(null)}
          />
        </div>
      </div>
    </div>
  );
}
