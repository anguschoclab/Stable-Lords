import { Link } from '@tanstack/react-router';
import { PageHeader } from '@/components/ui/PageHeader';
import { PageFrame } from '@/components/ui/PageFrame';
import { SectionDivider } from '@/components/ui/SectionDivider';
import { Surface } from '@/components/ui/Surface';
import { ImperialRing } from '@/components/ui/ImperialRing';
import { Dumbbell, Target } from 'lucide-react';
import { useTrainingPlanner } from './hooks/useTrainingPlanner';
import { WarriorSelector } from './components/WarriorSelector';
import { WarriorPlannerCard } from './components/WarriorPlannerCard';

export default function TrainingPlanner() {
  const {
    activeWarriors,
    selectedId,
    setSelectedId,
    selectedWarrior,
    currentTrainers,
    seasonalGainsMap,
    avgTrainability,
  } = useTrainingPlanner();

  return (
    <PageFrame>
      <PageHeader
        title="Training Logistics"
        subtitle="STABLE · DEVELOPMENT_PLANNER"
        actions={
          <div className="flex items-center gap-6">
            <div className="flex flex-col items-end">
              <span className="text-[8px] font-black uppercase tracking-widest text-muted-foreground/40">
                Stable Trainability
              </span>
              <span className="text-sm font-display font-black text-primary">
                {avgTrainability}% Aggregate
              </span>
            </div>
            <div className="flex flex-col items-end border-l border-white/5 pl-6">
              <span className="text-[8px] font-black uppercase tracking-widest text-muted-foreground/40">
                Active Trainers
              </span>
              <span className="text-sm font-display font-black text-foreground">
                {currentTrainers.filter((t) => t.contractWeeksLeft > 0).length} Staff
              </span>
            </div>
          </div>
        }
      />

      <div className="flex items-center h-16 bg-white/[0.02] border border-white/5 p-1 rounded-none mb-12">
        <Link
          to="/stable/training"
          className="flex-1 h-full flex items-center justify-center gap-3 font-black uppercase text-[10px] tracking-[0.3em] text-muted-foreground hover:text-foreground transition-all"
        >
          <Dumbbell className="h-3.5 w-3.5" />
          Training
        </Link>
        <div className="flex-1 h-full flex items-center justify-center gap-3 font-black uppercase text-[10px] tracking-[0.3em] bg-primary text-primary-foreground">
          <Target className="h-3.5 w-3.5" />
          Battle Plans
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-12">
        <aside className="space-y-8">
          <SectionDivider label="Warriors" />
          <WarriorSelector
            warriors={activeWarriors}
            selectedId={selectedId}
            onSelect={setSelectedId}
            trainers={currentTrainers}
          />
        </aside>

        <div className="lg:col-span-3">
          {selectedWarrior ? (
            <WarriorPlannerCard
              warrior={selectedWarrior}
              trainers={currentTrainers}
              seasonalGains={seasonalGainsMap.get(selectedWarrior.id) ?? {}}
            />
          ) : (
            <Surface
              variant="glass"
              className="py-48 text-center border-dashed border-white/10 flex flex-col items-center gap-6"
            >
              <ImperialRing size="lg" variant="bronze" className="opacity-20">
                <Dumbbell className="h-8 w-8" />
              </ImperialRing>
              <div className="space-y-2">
                <p className="text-[12px] font-black uppercase tracking-[0.4em] text-muted-foreground/40">
                  Zero Assets Selected
                </p>
                <p className="text-[9px] text-muted-foreground/20 uppercase tracking-widest italic">
                  Select a combat asset from the registry to initialize planning.
                </p>
              </div>
            </Surface>
          )}
        </div>
      </div>
    </PageFrame>
  );
}
