/**
 * Onboarding quests — a checklist of early-game milestones derived entirely
 * from GameState. No persistence needed: completion is computed, and the
 * widget hides itself once every quest is done or the player dismisses it
 * (coachDismissed sentinel).
 */
import type { GameState } from '@/types/state.types';

/** The state slice the quest evaluator actually reads. */
export type QuestState = Pick<
  GameState,
  | 'arenaHistory'
  | 'roster'
  | 'scoutReports'
  | 'trainingAssignments'
  | 'absoluteWeek'
  | 'coachDismissed'
>;

/** A single onboarding quest definition. */
export interface OnboardingQuest {
  id: string;
  label: string;
  hint: string;
  done: (s: QuestState) => boolean;
}

/** Sentinel id in GameState.coachDismissed that hides the quest widget. */
export const QUESTS_DISMISSED = 'onboarding-quests-dismissed';

export const ONBOARDING_QUESTS: OnboardingQuest[] = [
  {
    id: 'first-bout',
    label: 'Fight your first bout',
    hint: 'Run a week — your warriors are matched automatically.',
    done: (s) => s.arenaHistory.length > 0,
  },
  {
    id: 'armed',
    label: 'Arm a warrior',
    hint: 'Issue a weapon on the Equipment page.',
    done: (s) => s.roster.some((w) => !!w.equipment?.weapon),
  },
  {
    id: 'scouted',
    label: 'Scout a rival',
    hint: 'Buy a scout report from the Scouting page.',
    done: (s) => (s.scoutReports?.length ?? 0) > 0,
  },
  {
    id: 'trained',
    label: 'Assign training',
    hint: 'Send a warrior to train on the Training page.',
    done: (s) => (s.trainingAssignments?.length ?? 0) > 0,
  },
  {
    id: 'second-week',
    label: 'Survive two weeks',
    hint: 'Advance the calendar twice.',
    done: (s) => s.absoluteWeek >= 2,
  },
];

/** A quest plus its evaluated completion state. */
export interface QuestStatus {
  id: string;
  label: string;
  hint: string;
  complete: boolean;
}

/**
 * Evaluate quests.
 */
export function evaluateQuests(state: QuestState): QuestStatus[] {
  return ONBOARDING_QUESTS.map((q) => ({
    id: q.id,
    label: q.label,
    hint: q.hint,
    complete: q.done(state),
  }));
}

/**
 * Whether the quest widget should surface at all: still showing while any
 * quest is incomplete and the player hasn't dismissed it.
 */
export function questsVisible(state: QuestState): boolean {
  if ((state.coachDismissed ?? []).includes(QUESTS_DISMISSED)) return false;
  return evaluateQuests(state).some((q) => !q.complete);
}
