import { Link } from '@tanstack/react-router';
import { PageHeader } from '@/components/ui/PageHeader';
import { PageFrame } from '@/components/ui/PageFrame';
import { SectionDivider } from '@/components/ui/SectionDivider';
import { Surface } from '@/components/ui/Surface';
import { ImperialRing } from '@/components/ui/ImperialRing';
import { Button } from '@/components/ui/button';
import { Check, Dumbbell, RotateCcw, Target } from 'lucide-react';
import { useTrainingPlanner } from './hooks/useTrainingPlanner';
import { WarriorSelector } from './components/WarriorSelector';
import PlanBuilder from '@/components/PlanBuilder';

/** Plans-set / unassigned counters for the header actions slot. */
function HeaderStats({ plansSet, total }: { plansSet: number; total: number }) {
  return (
    <div className="flex items-center gap-6">
      <div className="flex flex-col items-end">
        <span className="text-[8px] font-black uppercase tracking-widest text-muted-foreground/40">
          Plans Set
        </span>
        <span className="text-sm font-display font-black text-primary">
          {plansSet} of {total}
        </span>
      </div>
      <div className="flex flex-col items-end border-l border-white/5 pl-6">
        <span className="text-[8px] font-black uppercase tracking-widest text-muted-foreground/40">
          Unassigned
        </span>
        <span className="text-sm font-display font-black text-foreground">
          {total - plansSet} warriors
        </span>
      </div>
    </div>
  );
}

/** Training ↔ Battle Plans switcher strip. */
function SectionTabStrip() {
  return (
    <div className="flex items-center h-16 bg-white/[0.02] border border-white/5 p-1 rounded-none mb-12">
      <Link
        to="/stable/training"
        className="flex-1 h-full flex items-center justify-center gap-3 font-black uppercase text-[10px] tracking-[0.15em] text-muted-foreground hover:text-foreground transition-all motion-reduce:transition-none"
      >
        <Dumbbell className="h-3.5 w-3.5" />
        Training
      </Link>
      <div className="flex-1 h-full flex items-center justify-center gap-3 font-black uppercase text-[10px] tracking-[0.15em] bg-primary text-primary-foreground">
        <Target className="h-3.5 w-3.5" />
        Battle Plans
      </div>
    </div>
  );
}

/** PlanBuilder for the selected warrior, or the empty-select state. */
function PlanColumn({
  selectedWarrior,
  draft,
}: {
  selectedWarrior: ReturnType<typeof useTrainingPlanner>['selectedWarrior'];
  draft: {
    draftPlan: ReturnType<typeof useTrainingPlanner>['draftPlan'];
    isDirty: boolean;
    onPlanChange: ReturnType<typeof useTrainingPlanner>['handlePlanChange'];
    onCommit: ReturnType<typeof useTrainingPlanner>['commitPlan'];
    onReset: ReturnType<typeof useTrainingPlanner>['resetPlan'];
  };
}) {
  if (!selectedWarrior || !draft.draftPlan) {
    return (
      <Surface
        variant="glass"
        className="py-24 md:py-32 text-center border-dashed border-white/10 flex flex-col items-center gap-6"
      >
        <ImperialRing size="lg" variant="bronze" className="opacity-20">
          <Target className="h-8 w-8" />
        </ImperialRing>
        <div className="space-y-2">
          <p className="text-[12px] font-black uppercase tracking-[0.15em] text-muted-foreground/40">
            No Warrior Selected
          </p>
          <p className="text-[9px] text-muted-foreground/20 uppercase tracking-widest italic">
            Select a warrior from the roster to configure battle plans.
          </p>
        </div>
      </Surface>
    );
  }
  return (
    <div className="space-y-4">
      <PlanBuilder
        warrior={selectedWarrior}
        plan={draft.draftPlan}
        onPlanChange={draft.onPlanChange}
      />
      <Surface
        variant="glass"
        aria-live="polite"
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 border-white/10"
      >
        <div className="space-y-1">
          <p className="text-[10px] font-black uppercase tracking-[0.15em] text-muted-foreground">
            {draft.isDirty ? 'Unsaved plan changes' : 'Committed orders active'}
          </p>
          <p className="text-[9px] uppercase tracking-widest text-muted-foreground/50">
            Review the draft, then commit it to the roster.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={draft.onReset} disabled={!draft.isDirty}>
            <RotateCcw className="h-3.5 w-3.5" /> Discard Draft
          </Button>
          <Button onClick={draft.onCommit} disabled={!draft.isDirty}>
            <Check className="h-3.5 w-3.5" /> Commit Plan
          </Button>
        </div>
      </Surface>
    </div>
  );
}

/**
 *
 */
export default function TrainingPlanner() {
  const {
    activeWarriors,
    selectedId,
    setSelectedId,
    selectedWarrior,
    plansSetCount,
    draftPlan,
    isDirty,
    handlePlanChange,
    commitPlan,
    resetPlan,
  } = useTrainingPlanner();

  return (
    <PageFrame>
      <PageHeader
        title="Battle Plans"
        subtitle="STABLE · STRATEGY"
        actions={<HeaderStats plansSet={plansSetCount} total={activeWarriors.length} />}
      />

      <SectionTabStrip />

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
          <PlanColumn
            selectedWarrior={selectedWarrior}
            draft={{
              draftPlan,
              isDirty,
              onPlanChange: handlePlanChange,
              onCommit: commitPlan,
              onReset: resetPlan,
            }}
          />
        </div>
      </div>
    </PageFrame>
  );
}
