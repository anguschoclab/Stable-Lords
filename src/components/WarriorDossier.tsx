import React, { useMemo } from 'react';
import { useWorldState } from '@/state/useGameStore';
import { findWarrior } from '@/utils/historyResolver';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { WarriorRadarChart } from '@/components/charts/WarriorRadarChart';

// Child components
import { WarriorDossierHeader } from './warrior/dossier/WarriorDossierHeader';
import { WarriorDossierTraits } from './warrior/dossier/WarriorDossierTraits';
import WarriorDossierStats from './warrior/dossier/WarriorDossierStats';
import WarriorDossierTabs from './warrior/dossier/WarriorDossierTabs';
import WarriorDossierSoulBond from './warrior/dossier/WarriorDossierSoulBond';
import { WarriorDossierMedicalReport } from './warrior/dossier/WarriorDossierMedicalReport';

interface WarriorDossierProps {
  warriorId: string;
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
  const state = useWorldState();

  // Use fine-grained selector to find the warrior
  const warrior = useMemo(() => findWarrior(state, warriorId), [state, warriorId]);

  // Also select rankings separately
  const rankings = state.realmRankings?.[warriorId];

  if (!warrior)
    return <div className="p-8 text-center text-muted-foreground">Warrior not found.</div>;

  const record = `${warrior.career.wins}W - ${warrior.career.losses}L - ${warrior.career.kills}K`;
  const fatigue = warrior.fatigue ?? 0;
  const condition = 100 - fatigue;

  return (
    <ScrollArea className="h-full pr-4">
      <div className="space-y-6 pb-20">
        <div className="space-y-4">
          <WarriorDossierHeader warrior={warrior} record={record} rankings={rankings} />
          <WarriorDossierTraits warrior={warrior} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <WarriorDossierStats warrior={warrior} condition={condition} />
          <WarriorDossierTabs warrior={warrior} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="bg-glass/5">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs uppercase tracking-widest text-muted-foreground font-bold">
                Physical Polygon
              </CardTitle>
            </CardHeader>
            <CardContent>
              <WarriorRadarChart warrior={warrior} />
            </CardContent>
          </Card>
          <WarriorDossierSoulBond warrior={warrior} />
        </div>

        <WarriorDossierMedicalReport warrior={warrior} />
      </div>
    </ScrollArea>
  );
});
