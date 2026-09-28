import { useMemo, useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useGameStore, useWorldState, type GameStore } from '@/state/useGameStore';
import { ATTRIBUTE_LABELS, type TrainingAssignment, type Attributes } from '@/types/game';
import type { WarriorId } from '@/types/shared.types';
import type { Warrior } from '@/types/state.types';
import { Button } from '@/components/ui/button';
import { Dumbbell, Heart, Activity } from 'lucide-react';
import { toast } from 'sonner';
import { WarriorTrainingCard } from '@/components/warrior/WarriorTrainingCard';
import { PageHeader } from '@/components/ui/PageHeader';
import { Surface } from '@/components/ui/Surface';
import { PageFrame } from '@/components/ui/PageFrame';
import { SectionDivider } from '@/components/ui/SectionDivider';
import { TRAIT_TRAIN_WEEKS } from '@/engine/training/trainingGains/traitTraining';
import { isActive } from '@/engine/warrior/warriorStatus';
import { useStableAdvisor } from '@/hooks/useStableAdvisor';

import { TrainingReportBanner, TrainingSidebar } from './training/sections';
/**
 * Training.
 */
export default function Training() {
  const navigate = useNavigate();
  const state = useWorldState();
  const setState = useGameStore((s) => s.setState);
  const { cards } = useStableAdvisor();

  const advisorCardMap = useMemo(() => {
    const map = new Map<string, (typeof cards)[0]>();
    for (const c of cards) map.set(c.warriorId, c);
    return map;
  }, [cards]);

  const assignmentMap = useMemo(() => {
    const map = new Map<string, TrainingAssignment>();
    for (const a of state.trainingAssignments ?? []) map.set(a.warriorId, a);
    return map;
  }, [state.trainingAssignments]);

  const seasonalGainsMap = useMemo(() => {
    const map = new Map<string, Partial<Record<keyof Attributes, number>>>();
    for (const sg of state.seasonalGrowth ?? []) {
      if (sg.season === state.season) {
        map.set(sg.warriorId, sg.gains);
      }
    }
    return map;
  }, [state.seasonalGrowth, state.season]);

  const assignments = state.trainingAssignments ?? [];

  const rosterNameMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const w of state.roster ?? []) {
      map.set(w.id, w.name);
    }
    return map;
  }, [state.roster]);

  const handleAssign = (warriorId: WarriorId, attribute: keyof Attributes) => {
    if (attribute === 'SZ') return;
    const name = rosterNameMap.get(warriorId);
    setState((s: GameStore) => {
      s.trainingAssignments = [
        ...(s.trainingAssignments ?? []).filter(
          (a: TrainingAssignment) => a.warriorId !== warriorId
        ),
        { warriorId: warriorId as WarriorId, type: 'attribute', attribute },
      ];
    });
    toast.success(`${name ?? 'Warrior'} assigned to train ${ATTRIBUTE_LABELS[attribute]}`);
  };

  const handleAssignRecovery = (warriorId: WarriorId) => {
    const name = rosterNameMap.get(warriorId);
    setState((s: GameStore) => {
      s.trainingAssignments = [
        ...(s.trainingAssignments ?? []).filter(
          (a: TrainingAssignment) => a.warriorId !== warriorId
        ),
        { warriorId: warriorId as WarriorId, type: 'recovery' },
      ];
    });
    toast.success(`${name ?? 'Warrior'} assigned to active recovery`);
  };

  const handleAssignTraitTraining = (warriorId: WarriorId, trainerId: string) => {
    setState((s: GameStore) => {
      s.trainingAssignments = [
        ...(s.trainingAssignments ?? []).filter(
          (a: TrainingAssignment) => a.warriorId !== warriorId
        ),
        { warriorId, type: 'trait' as const, trainerId, weeksRemaining: TRAIT_TRAIN_WEEKS },
      ];
    });
    toast.success('Trait training assigned — outcome in a few weeks.');
  };

  const handleClear = (warriorId: WarriorId) => {
    setState((s: GameStore) => {
      s.trainingAssignments = (s.trainingAssignments ?? []).filter(
        (a: TrainingAssignment) => a.warriorId !== warriorId
      );
    });
  };

  const handleClearAll = () => {
    setState((s: GameStore) => {
      s.trainingAssignments = [];
    });
    toast('All training assignments cleared.');
  };

  const assignedCount = assignments.length;
  const recoveryCount = assignments.filter((a: TrainingAssignment) => a.type === 'recovery').length;
  const trainingCount = assignedCount - recoveryCount;

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
          <div className="flex items-center gap-6">
            <div className="hidden sm:flex items-center gap-4 text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/60">
              <div className="flex items-center gap-1.5">
                <Activity className="h-3 w-3 text-primary" />
                <span>
                  Training: {Math.round((trainingCount / (state.roster.length || 1)) * 100)}%
                </span>
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
                onClick={handleClearAll}
                className="h-8 text-[10px] font-black tracking-widest uppercase border-white/5 bg-white/5 hover:bg-white/10 rounded-none"
              >
                Reset All
              </Button>
            )}
          </div>
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
            <Surface variant="glass" className="py-24 text-center border-dashed border-white/5">
              <p className="text-[10px] font-black uppercase tracking-[0.4em] text-muted-foreground/40">
                No warriors · Recruit to begin training
              </p>
              <Button
                variant="link"
                className="mt-4 text-xs uppercase tracking-widest font-black text-primary"
                onClick={() => navigate({ to: '/stable/recruit' })}
              >
                Recruit Warriors ›
              </Button>
            </Surface>
          ) : (
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
          )}
        </div>
      </div>
    </PageFrame>
  );
}
