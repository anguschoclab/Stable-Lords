import React, { lazy, Suspense, useState } from 'react';
import { useGameStore } from '@/state/useGameStore';
import { findWarrior } from '@/engine/core/historyResolver';
import type { WarriorId } from '@/types/shared.types';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
const WarriorRadarChart = lazy(() =>
  import('@/components/charts/WarriorRadarChart').then((m) => ({ default: m.WarriorRadarChart }))
);

// Child components
import { WarriorDossierHeader } from './warrior/dossier/WarriorDossierHeader';
import { WarriorDossierTraits } from './warrior/dossier/WarriorDossierTraits';
import WarriorDossierStats from './warrior/dossier/WarriorDossierStats';
import WarriorDossierTabs from './warrior/dossier/WarriorDossierTabs';
import WarriorDossierSoulBond from './warrior/dossier/WarriorDossierSoulBond';
import { WarriorDossierMedicalReport } from './warrior/dossier/WarriorDossierMedicalReport';

interface WarriorDossierProps {
  warriorId: WarriorId;
}

/**
 * Renders a comprehensive dossier for a specific warrior.
 * Includes header information, traits, stats, soul bond status, and medical reports.
 * Searches across active roster, graveyard, retired, and rival rosters to find the warrior.
 *
 * @param {WarriorDossierProps} props - The component props.
 * @param {string} props.warriorId - The unique ID of the warrior to display.
 * @returns {JSX.Element} The rendered warrior dossier or a "not found" message.
 */
export const WarriorDossier = React.memo(function WarriorDossier({
  warriorId,
}: WarriorDossierProps) {
  const [activeTab, setActiveTab] = useState('overview');

  // ⚡ Bolt: Use targeted selectors to prevent excessive re-renders when large
  // arrays like graveyard/retired change but the specific warrior doesn't.
  const warrior = useGameStore((s) => findWarrior(s, warriorId));
  const rankings = useGameStore((s) => s.realmRankings?.[warriorId]);
  const isPlayerOwned = useGameStore((s) => s.roster.some((w) => w.id === warriorId));

  if (!warrior)
    return <div className="p-8 text-center text-muted-foreground">Warrior not found.</div>;

  const record = `${warrior.career.wins}W - ${warrior.career.losses}L - ${warrior.career.kills}K`;

  return (
    <ScrollArea className="h-full pr-4">
      <div className="space-y-6 pb-20">
        <div className="space-y-4">
          <WarriorDossierHeader
            warrior={warrior}
            record={record}
            rankings={rankings}
            isPlayerOwned={isPlayerOwned}
          />
          <WarriorDossierTraits warrior={warrior} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <WarriorDossierStats warrior={warrior} />
          <WarriorDossierTabs activeTab={activeTab} setActiveTab={setActiveTab} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="bg-glass/5">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs uppercase tracking-widest text-muted-foreground font-bold">
                Physical Polygon
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Suspense
                fallback={
                  <div className="w-full aspect-square max-w-md mx-auto animate-pulse motion-reduce:animate-none rounded-none bg-white/5" />
                }
              >
                <WarriorRadarChart warrior={warrior} />
              </Suspense>
            </CardContent>
          </Card>
          <WarriorDossierSoulBond warrior={warrior} />
        </div>

        <WarriorDossierMedicalReport warrior={warrior} />
      </div>
    </ScrollArea>
  );
});
