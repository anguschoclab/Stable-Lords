import { useStableComparison } from '@/hooks/scouting/useStableComparison';
import { Surface } from '@/components/ui/Surface';
import type { RivalStableData } from '@/types/game';
import { ComparisonHeader } from './ComparisonHeader';
import { HeadToHead } from './HeadToHead';
import { StableSelector } from './StableSelector';
import { DoctrineIntelligenceSection } from './components/DoctrineIntelligenceSection';
import { KeyMetricsSection } from './components/KeyMetricsSection';
import { AverageAttributesSection } from './components/AverageAttributesSection';
import { DoctrinePanel } from './components/DoctrinePanel';
import { DominantCombatantsSection } from './components/DominantCombatantsSection';
import { EmptyStateSurface } from './components/EmptyStateSurface';

interface StableComparisonProps {
  rivals: RivalStableData[];
}

/**
 * Stable comparison.
 * @param - { rivals }.
 * @returns The result.
 */

/**
 * Stable comparison.
 * @param - { rivals }.
 * @returns The result.
 */
export function StableComparison({ rivals }: StableComparisonProps) {
  const {
    idA,
    setIdA,
    idB,
    setIdB,
    rivalA,
    rivalB,
    statsA,
    statsB,
    grudge,
    clashes,
    modsA,
    modsB,
    maxWins,
    maxKills,
    maxFame,
    maxRoster,
    maxAttr,
  } = useStableComparison(rivals);

  return (
    <div className="space-y-6">
      <StableSelector rivals={rivals} idA={idA} setIdA={setIdA} idB={idB} setIdB={setIdB} />

      {statsA && statsB && rivalA && rivalB && (
        <div className="space-y-6">
          <ComparisonHeader rivalA={rivalA} rivalB={rivalB} />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <KeyMetricsSection
              rivalA={rivalA}
              rivalB={rivalB}
              statsA={statsA}
              statsB={statsB}
              maxWins={maxWins}
              maxKills={maxKills}
              maxFame={maxFame}
              maxActive={maxRoster}
            />

            <AverageAttributesSection
              rivalA={rivalA}
              rivalB={rivalB}
              statsA={statsA}
              statsB={statsB}
              maxAttr={maxAttr}
            />
          </div>

          <div className="grid grid-cols-2 gap-8">
            <Surface variant="glass" padding="none" className="border-primary/20 overflow-hidden">
              <div className="p-4 border-b border-white/5 bg-primary/5">
                <h3 className="text-[9px] font-black uppercase tracking-[0.2em] text-primary">
                  {rivalA.owner.stableName} Doctrines
                </h3>
              </div>
              <div className="p-4">
                <DoctrinePanel
                  stableName={rivalA.owner.stableName}
                  styleCounts={statsA.styleCounts}
                  activeCount={statsA.activeCount}
                  colorVariant="primary"
                  textAlign="left"
                />
              </div>
            </Surface>
            <Surface variant="glass" padding="none" className="border-accent/20 overflow-hidden">
              <div className="p-4 border-b border-white/5 bg-accent/5 text-right">
                <h3 className="text-[9px] font-black uppercase tracking-[0.2em] text-accent">
                  {rivalB.owner.stableName} Doctrines
                </h3>
              </div>
              <div className="p-4">
                <DoctrinePanel
                  stableName={rivalB.owner.stableName}
                  styleCounts={statsB.styleCounts}
                  activeCount={statsB.activeCount}
                  colorVariant="accent"
                  textAlign="right"
                />
              </div>
            </Surface>
          </div>

          <DoctrineIntelligenceSection
            rivalA={rivalA}
            rivalB={rivalB}
            modsA={modsA}
            modsB={modsB}
            clashes={clashes}
            grudge={grudge}
          />

          <DominantCombatantsSection
            topWarriorA={statsA.topWarrior}
            topWarriorB={statsB.topWarrior}
          />

          <HeadToHead rosterA={rivalA.roster} rosterB={rivalB.roster} />
        </div>
      )}

      {(!statsA || !statsB) && <EmptyStateSurface />}
    </div>
  );
}
