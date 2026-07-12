import { useMemo, useState } from 'react';
import { Crosshair } from 'lucide-react';
import { Surface } from '@/components/ui/Surface';
import type { RivalStableData, Warrior } from '@/types/game';
import { WarriorSelector } from './components/WarriorSelector';
import { ComparisonHeader } from './ComparisonHeader';
import { AttributeComparison } from './components/AttributeComparison';
import { CareerComparison } from './components/CareerComparison';
import { EmptyWarriorState } from './components/EmptyWarriorState';

interface WarriorComparisonProps {
  rivals: RivalStableData[];
  playerRoster: Warrior[];
} /**
 * Warrior comparison.
 * @param - { rivals, player roster }.
 */

/**
 * Warrior comparison.
 * @param - { rivals, player roster }.
 */
export function WarriorComparison({ rivals, playerRoster }: WarriorComparisonProps) {
  const [wIdA, setWIdA] = useState<string | null>(null);
  const [wIdB, setWIdB] = useState<string | null>(null);

  const allWarriors = useMemo(() => {
    const list: { warrior: Warrior; stable: string }[] = [];
    for (const w of playerRoster) {
      if (w.status !== 'Active') continue;
      list.push({ warrior: w, stable: 'User Stable' });
    }
    for (const r of rivals) {
      const stableName = r.owner.stableName;
      for (const w of r.roster) {
        if (w.status !== 'Active') continue;
        list.push({ warrior: w, stable: stableName });
      }
    }
    return list;
  }, [rivals, playerRoster]);

  const warriorMap = useMemo(
    () => new Map(allWarriors.map((e) => [e.warrior.id as string, e])),
    [allWarriors]
  );

  const entryA = useMemo(() => (wIdA ? warriorMap.get(wIdA) : undefined), [warriorMap, wIdA]);
  const entryB = useMemo(() => (wIdB ? warriorMap.get(wIdB) : undefined), [warriorMap, wIdB]);

  if (allWarriors.length < 2) {
    return <EmptyWarriorState />;
  }

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-2 gap-8">
        <WarriorSelector
          warriors={allWarriors}
          selectedId={wIdA}
          otherId={wIdB}
          onSelect={setWIdA}
          label="Challenger"
          colorVariant="primary"
        />
        <WarriorSelector
          warriors={allWarriors}
          selectedId={wIdB}
          otherId={wIdA}
          onSelect={setWIdB}
          label="Defender"
          colorVariant="accent"
        />
      </div>

      {entryA && entryB && (
        <div className="space-y-6">
          <ComparisonHeader kind="warrior" warriorA={entryA?.warrior} warriorB={entryB?.warrior} />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <AttributeComparison warriorA={entryA.warrior} warriorB={entryB.warrior} />

            <CareerComparison warriorA={entryA.warrior} warriorB={entryB.warrior} />
          </div>
        </div>
      )}

      {(!entryA || !entryB) && (
        <Surface
          variant="glass"
          className="py-24 text-center border-dashed border-border/40 flex flex-col items-center gap-4"
        >
          <Crosshair className="h-12 w-12 text-muted-foreground opacity-20" />
          <div className="space-y-1">
            <p className="text-sm font-display font-black uppercase tracking-tight text-muted-foreground">
              Select Fighters
            </p>
            <p className="text-xs text-muted-foreground/60 italic">
              Select two warriors to compare.
            </p>
          </div>
        </Surface>
      )}
    </div>
  );
}
