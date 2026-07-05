import { useCallback } from 'react';
import { Link } from '@tanstack/react-router';
import { PageHeader } from '@/components/ui/PageHeader';
import { PageFrame } from '@/components/ui/PageFrame';
import { SectionDivider } from '@/components/ui/SectionDivider';
import { Surface } from '@/components/ui/Surface';
import { ImperialRing } from '@/components/ui/ImperialRing';
import { Dumbbell, Target } from 'lucide-react';
import { useTrainingPlanner } from './hooks/useTrainingPlanner';
import { WarriorSelector } from './components/WarriorSelector';
import PlanBuilder from '@/components/PlanBuilder';
import { defaultPlanForWarrior } from '@/engine/simulate';
import type { FightPlan, Warrior } from '@/types/game';

export default function TrainingPlanner() {
  const { activeWarriors, selectedId, setSelectedId, selectedWarrior, setState, plansSetCount } =
    useTrainingPlanner();

  const handlePlanChange = useCallback(
    (newPlan: FightPlan) => {
      if (!selectedWarrior) return;
      setState((draft) => {
        const index = draft.roster.findIndex((w: Warrior) => w.id === selectedWarrior.id);
        const found = draft.roster[index];
        if (found) found.plan = newPlan;
      });
    },
    [selectedWarrior, setState]
  );

  return (
    <PageFrame>
      <PageHeader
        title="Battle Plans"
        subtitle="STABLE · STRATEGY"
        actions={
          <div className="flex items-center gap-6">
            <div className="flex flex-col items-end">
              <span className="text-[8px] font-black uppercase tracking-widest text-muted-foreground/40">
                Plans Set
              </span>
              <span className="text-sm font-display font-black text-primary">
                {plansSetCount} of {activeWarriors.length}
              </span>
            </div>
            <div className="flex flex-col items-end border-l border-white/5 pl-6">
              <span className="text-[8px] font-black uppercase tracking-widest text-muted-foreground/40">
                Unassigned
              </span>
              <span className="text-sm font-display font-black text-foreground">
                {activeWarriors.length - plansSetCount} warriors
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
          />
        </aside>

        <div className="lg:col-span-3">
          {selectedWarrior ? (
            <PlanBuilder
              warrior={selectedWarrior}
              plan={selectedWarrior.plan ?? defaultPlanForWarrior(selectedWarrior)}
              onPlanChange={handlePlanChange}
            />
          ) : (
            <Surface
              variant="glass"
              className="py-48 text-center border-dashed border-white/10 flex flex-col items-center gap-6"
            >
              <ImperialRing size="lg" variant="bronze" className="opacity-20">
                <Target className="h-8 w-8" />
              </ImperialRing>
              <div className="space-y-2">
                <p className="text-[12px] font-black uppercase tracking-[0.4em] text-muted-foreground/40">
                  No Warrior Selected
                </p>
                <p className="text-[9px] text-muted-foreground/20 uppercase tracking-widest italic">
                  Select a warrior from the roster to configure battle plans.
                </p>
              </div>
            </Surface>
          )}
        </div>
      </div>
    </PageFrame>
  );
}
