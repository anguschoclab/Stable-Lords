import { Activity } from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { PageFrame } from '@/components/ui/PageFrame';
import { FighterConfigCard } from '@/components/stable/FighterConfigCard';
import { SimulatorResults } from '@/components/stable/SimulatorResults';
import { usePhysicalsSim } from './physicals/usePhysicalsSim';
import { WarriorPickerRail } from './physicals/WarriorPickerRail';

/**
 * Physicals simulator.
 */
export default function PhysicalsSimulator() {
  const sim = usePhysicalsSim();

  return (
    <PageFrame maxWidth="lg" className="space-y-8 pb-20">
      <PageHeader
        icon={Activity}
        title="Physicals Simulator"
        subtitle="TOOLS · SIMULATION · NO RECORDS KEPT"
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Archetype D: Left Rail Roster Pickers (span-3) */}
        <WarriorPickerRail
          warriors={sim.activeWarriors}
          fighterAId={sim.fighterAId}
          fighterBId={sim.fighterBId}
          onSelect={sim.handleSelectWarrior}
        />

        <main className="lg:col-span-9 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FighterConfigCard
              label="Fighter A"
              style={sim.styleA}
              setStyle={sim.setStyleA}
              stats={sim.statsA}
              setStats={sim.setStatsA}
            />
            <FighterConfigCard
              label="Fighter B"
              style={sim.styleB}
              setStyle={sim.setStyleB}
              stats={sim.statsB}
              setStats={sim.setStatsB}
            />
          </div>

          <SimulatorResults simulation={sim.simulation} />
        </main>
      </div>
    </PageFrame>
  );
}
