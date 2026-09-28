import { useMemo, useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useWorldState } from '@/state/useGameStore';
import type { Warrior } from '@/types/state.types';
import { Button } from '@/components/ui/button';
import { Dumbbell, Heart, Activity } from 'lucide-react';
import { WarriorTrainingCard } from '@/components/warrior/WarriorTrainingCard';
import { PageHeader } from '@/components/ui/PageHeader';
import { Surface } from '@/components/ui/Surface';
import { PageFrame } from '@/components/ui/PageFrame';
import { SectionDivider } from '@/components/ui/SectionDivider';
import { isActive } from '@/engine/warrior/warriorStatus';
import { useStableAdvisor } from '@/hooks/useStableAdvisor';

import { TrainingReportBanner, TrainingSidebar } from './training/sections';
import { useTrainingAssignments } from './training/useTrainingAssignments';

function HeaderActions({
  trainingPct,
  recoveryCount,
  assignedCount,
  onClearAll,
}: {
  trainingPct: number;
  recoveryCount: number;
  assignedCount: number;
  onClearAll: () => void;
}) {
  return (
    <div className="flex items-center gap-6">
      <div className="hidden sm:flex items-center gap-4 text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/60">
        <div className="flex items-center gap-1.5">
          <Activity className="h-3 w-3 text-primary" />
          <span>Training: {trainingPct}%</span>
        </div>
        <div className="h-3 w-px bg-border/40" />
        <div className="flex items-center gap-1.5">
          <Heart className="h-3 w-3 text-destructive" />
          <span>Recovery: {recoveryCount}</span>
        </div>
      </div>
      {assignedCount > 0 && (
        <Button
          variant="outline"
          size="sm"
          onClick={onClearAll}
          className="h-8 text-[10px] font-black tracking-widest uppercase border-white/5 bg-white/5 hover:bg-white/10 rounded-none"
        >
          Reset All
        </Button>
      )}
    </div>
  );
}

function EmptyRoster({ onNavigate }: { onNavigate: () => void }) {
  return (
    <Surface variant="glass" className="py-24 text-center border-dashed border-white/5">
      <p className="text-[10px] font-black uppercase tracking-[0.4em] text-muted-foreground/40">
        No warriors · Recruit to begin training
      </p>
      <Button
        variant="link"
        className="mt-4 text-xs uppercase tracking-widest font-black text-primary"
        onClick={onNavigate}
      >
        Recruit Warriors ›
      </Button>
    </Surface>
  );
}

/** Grid of active-warrior training cards, wired to assignment handlers. */
function RosterGrid({
  state,
  assignments,
  advisorCardMap,
}: {
  state: ReturnType<typeof useWorldState>;
  assignments: ReturnType<typeof useTrainingAssignments>;
  advisorCardMap: Map<string, ReturnType<typeof useStableAdvisor>['cards'][number]>;
}) {
  const {
    assignmentMap,
    seasonalGainsMap,
    handleAssign,
    handleAssignRecovery,
    handleAssignTraitTraining,
    handleClear,
  } = assignments;

  return (
    <div className="grid gap-6 sm:grid-cols-2">
      {state.roster
        .filter((warrior: Warrior) => isActive(warrior))
        .map((warrior: Warrior) => (
          <WarriorTrainingCard
            key={warrior.id}
            warrior={warrior}
            assignment={assignmentMap.get(warrior.id)}
            seasonalGains={seasonalGainsMap.get(warrior.id) ?? {}}
            trainers={state.trainers ?? []}
            onAssign={(attr) => handleAssign(warrior.id, attr)}
            onAssignRecovery={() => handleAssignRecovery(warrior.id)}
            onClear={() => handleClear(warrior.id)}
            onAssignTraitTraining={(trainerId) =>
              handleAssignTraitTraining(warrior.id, trainerId)
            }
            advisorAdvice={advisorCardMap.get(warrior.id)?.trainingAdvice}
          />
        ))}
    </div>
  );
}

/**
 * Training.
 */
export default function Training() {
  const navigate = useNavigate();
  const state = useWorldState();
  const { cards } = useStableAdvisor();
  const assignments = useTrainingAssignments();
  const { assignedCount, recoveryCount, trainingCount, handleClearAll } = assignments;

  const advisorCardMap = useMemo(() => {
    const map = new Map<string, (typeof cards)[0]>();
    for (const c of cards) map.set(c.warriorId, c);
    return map;
  }, [cards]);

  // Training results from the last week pipeline run
  const trainingReportItems = useMemo(() => {
    return (state.newsletter ?? [])
      .filter((n) => n.title === 'Training Report' && n.week === state.week)
      .flatMap((n) => n.items);
  }, [state.newsletter, state.week]);

  const [dismissedWeek, setDismissedWeek] = useState<number | null>(null);
  const showReport = trainingReportItems.length > 0 && dismissedWeek !== state.week;

  return (
    <PageFrame>
      <PageHeader
        eyebrow="Stable Management"
        title="Training Grounds"
        subtitle="DRILLS · RECOVERY · DEVELOPMENT"
        icon={Dumbbell}
        actions={
          <HeaderActions
            trainingPct={Math.round((trainingCount / (state.roster.length || 1)) * 100)}
            recoveryCount={recoveryCount}
            assignedCount={assignedCount}
            onClearAll={handleClearAll}
          />
        }
      />

      {/* Weekly Training Results Banner */}
      {showReport && (
        <TrainingReportBanner
          items={trainingReportItems}
          onDismiss={() => setDismissedWeek(state.week)}
        />
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
        <TrainingSidebar trainingCount={trainingCount} recoveryCount={recoveryCount} />

        {/* Main: Roster */}
        <div className="lg:col-span-8 space-y-8">
          <SectionDivider label={`Roster [${state.roster.length}]`} variant="primary" />

          {state.roster.length === 0 ? (
            <EmptyRoster onNavigate={() => navigate({ to: '/stable/recruit' })} />
          ) : (
            <RosterGrid
              state={state}
              assignments={assignments}
              advisorCardMap={advisorCardMap}
            />
          )}
        </div>
      </div>
    </PageFrame>
  );
}
