import { useStableComparison } from '@/hooks/useScoutingStableComparison';
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
 */

/**
 * Stable comparison.
 * @param - { rivals }.
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
          <ComparisonHeader kind="stable" rivalA={rivalA} rivalB={rivalB} />

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

            <AverageAttributesSection statsA={statsA} statsB={statsB} maxAttr={maxAttr} />
          </div>

          <div className="grid grid-cols-2 gap-8">
            <DoctrineSurface
              stableName={rivalA.owner.stableName}
              styleCounts={statsA.styleCounts}
              activeCount={statsA.activeCount}
              colorVariant="primary"
              textAlign="left"
            />
            <DoctrineSurface
              stableName={rivalB.owner.stableName}
              styleCounts={statsB.styleCounts}
              activeCount={statsB.activeCount}
              colorVariant="accent"
              textAlign="right"
            />
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
            topWarriorA={topWarriorShape(statsA.topWarrior)}
            topWarriorB={topWarriorShape(statsB.topWarrior)}
          />

          <HeadToHead rosterA={rivalA.roster} rosterB={rivalB.roster} />
        </div>
      )}

      {(!statsA || !statsB) && <EmptyStateSurface />}
    </div>
  );
}

type StableStats = ReturnType<typeof useStableComparison>['statsA'];

/** Framed doctrine panel for one side of the comparison. */
function DoctrineSurface({
  stableName,
  styleCounts,
  activeCount,
  colorVariant,
  textAlign,
}: {
  stableName: string;
  styleCounts: NonNullable<StableStats>['styleCounts'];
  activeCount: number;
  colorVariant: 'primary' | 'accent';
  textAlign: 'left' | 'right';
}) {
  return (
    <Surface
      variant="glass"
      padding="none"
      className={`${colorVariant === 'primary' ? 'border-primary/20' : 'border-accent/20'} overflow-hidden`}
    >
      <div
        className={`p-4 border-b border-white/5 ${colorVariant === 'primary' ? 'bg-primary/5' : 'bg-accent/5 text-right'}`}
      >
        <h3
          className={`text-[9px] font-black uppercase tracking-[0.2em] ${colorVariant === 'primary' ? 'text-primary' : 'text-accent'}`}
        >
          {stableName} Doctrines
        </h3>
      </div>
      <div className="p-4">
        <DoctrinePanel
          stableName={stableName}
          styleCounts={styleCounts}
          activeCount={activeCount}
          colorVariant={colorVariant}
          textAlign={textAlign}
        />
      </div>
    </Surface>
  );
}

/** Shapes a top-warrior record for DominantCombatantsSection. */
function topWarriorShape(topWarrior: NonNullable<StableStats>['topWarrior']) {
  if (!topWarrior) return null;
  return {
    ...topWarrior,
    isChampion: topWarrior.champion,
    injuryCount: topWarrior.injuries.length,
    isDead: topWarrior.isDead ?? false,
    age: topWarrior.age ?? 0,
  };
}
