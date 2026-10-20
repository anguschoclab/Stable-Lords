import { useWorldState } from '@/state/useGameStore';
import type { Warrior } from '@/types/state.types';
import { Button } from '@/components/ui/button';
import { Heart, Activity } from 'lucide-react';
import { WarriorTrainingCard } from '@/components/warrior/WarriorTrainingCard';
import { Surface } from '@/components/ui/Surface';
import { isActive } from '@/engine/warrior/warriorStatus';
import type { useStableAdvisor } from '@/hooks/useStableAdvisor';
import type { useTrainingAssignments } from './useTrainingAssignments';

export function HeaderActions({
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
      <div className="hidden sm:flex items-center gap-4 text-[10px] font-black uppercase tracking-[0.15em] text-muted-foreground/60">
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

export function EmptyRoster({ onNavigate }: { onNavigate: () => void }) {
  return (
    <Surface variant="glass" className="py-24 text-center border-dashed border-white/5">
      <p className="text-[10px] font-black uppercase tracking-[0.15em] text-muted-foreground/40">
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
export function RosterGrid({
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
            onAssignTraitTraining={(trainerId) => handleAssignTraitTraining(warrior.id, trainerId)}
            advisorAdvice={advisorCardMap.get(warrior.id)?.trainingAdvice}
          />
        ))}
    </div>
  );
}
