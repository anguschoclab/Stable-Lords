import { PageHeader } from '@/components/ui/PageHeader';
import { PageFrame } from '@/components/ui/PageFrame';
import { Shield } from 'lucide-react';
import { useStableEquipment } from './hooks/useStableEquipment';
import { ArmorySidebar } from './components/ArmorySidebar';
import { LoadoutCard } from './components/LoadoutCard';

/**
 *
 */
export default function StableEquipment() {
  const {
    activeWarriors,
    selectedStyle,
    targetWarriorId,
    targetWarrior,
    carryCap,
    recs,
    tips,
    styleEntries,
    handleStyleChange,
    setTargetWarriorId,
    handleApply,
  } = useStableEquipment();

  return (
    <PageFrame maxWidth="lg" className="space-y-8 pb-20">
      <PageHeader title="The Armory" subtitle="ARMORY · LOADOUTS" icon={Shield} />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <ArmorySidebar
          selectedStyle={selectedStyle}
          styleEntries={styleEntries}
          tips={tips}
          onStyleChange={handleStyleChange}
          championWarriors={activeWarriors.filter((w) => w.style === selectedStyle)}
          targetWarriorId={targetWarriorId}
          onSelectWarrior={setTargetWarriorId}
        />

        {/* Right Column: Recommendations (span-8) */}
        <div className="lg:col-span-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {recs.map((rec, i) => (
              <LoadoutCard
                key={i}
                rec={rec}
                index={i}
                carryCap={carryCap}
                targetWarrior={targetWarrior}
                onApply={handleApply}
                disabled={!targetWarriorId}
              />
            ))}
          </div>
        </div>
      </div>
    </PageFrame>
  );
}
