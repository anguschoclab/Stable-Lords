import { useNavigate } from '@tanstack/react-router';
import { useWorldState } from '@/state/useGameStore';
import { Dumbbell } from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { PageFrame } from '@/components/ui/PageFrame';
import { SectionDivider } from '@/components/ui/SectionDivider';

import { TrainingReportBanner, TrainingSidebar } from './training/sections';
import { useTrainingAssignments } from './training/useTrainingAssignments';
import { HeaderActions, EmptyRoster, RosterGrid } from './training/rosterGrid';
import { useTrainingPageData } from './training/useTrainingPageData';

/**
 * Training.
 */
export default function Training() {
  const navigate = useNavigate();
  const state = useWorldState();
  const assignments = useTrainingAssignments();
  const { assignedCount, recoveryCount, trainingCount, handleClearAll } = assignments;
  const { advisorCardMap, trainingReportItems, showReport, setDismissedWeek } =
    useTrainingPageData(state);

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
            <RosterGrid state={state} assignments={assignments} advisorCardMap={advisorCardMap} />
          )}
        </div>
      </div>
    </PageFrame>
  );
}
