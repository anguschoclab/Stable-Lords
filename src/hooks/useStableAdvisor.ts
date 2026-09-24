/**
 * useStableAdvisor Hook
 * React hook subscribing to world state and exposing the War Council report,
 * individual setup actions, and stable-wide batch execution.
 */
import { useMemo, useCallback } from 'react';
import { useWorldState, useGameStore } from '@/state/useGameStore';
import type { GameStore } from '@/state/store.types';
import type { GameState, TrainingAssignment } from '@/types/state.types';
import type { WarriorId } from '@/types/shared.types';
import {
  buildStableCouncilReport,
  type StableCouncilReport,
  type CampaignFocus,
  type WarriorActionPayload,
} from '@/engine/advisor';
import { respondToBoutOffer } from '@/engine/bout/mutations/contractMutations';
import { defaultStylePreset } from '@/engine/bout/stylePresets';
import { toast } from 'sonner';

function applySinglePayloadToDraft(draft: GameStore, payload: WarriorActionPayload) {
  // 1. Training Assignment
  draft.trainingAssignments = [
    ...(draft.trainingAssignments ?? []).filter(
      (a: TrainingAssignment) => a.warriorId !== payload.warriorId
    ),
    payload.trainingAssignment,
  ];

  // 2. Bout Offer Acceptance
  if (payload.boutOfferIdToAccept) {
    const next = respondToBoutOffer(
      draft as unknown as GameState,
      payload.boutOfferIdToAccept,
      payload.warriorId,
      'Accepted'
    );
    if (next.boutOffers) {
      draft.boutOffers = next.boutOffers;
    }
  }

  // 3. Battle Plan Tuning
  if (payload.tacticsPlanPatch) {
    const warrior = draft.roster.find((w) => w.id === payload.warriorId);
    if (warrior) {
      const basePlan = warrior.plan ?? defaultStylePreset(warrior.style).plan;
      warrior.plan = {
        ...basePlan,
        ...payload.tacticsPlanPatch,
      };
    }
  }
}

/**
 * Hook to access live War Council intelligence and dispatch campaign actions.
 */
export function useStableAdvisor() {
  const state = useWorldState();
  const setState = useGameStore((s) => s.setState);

  const report: StableCouncilReport = useMemo(() => {
    return buildStableCouncilReport(state);
  }, [state]);

  const applyWarriorSetup = useCallback(
    (warriorId: WarriorId) => {
      const card = report.cards.find((c) => c.warriorId === warriorId);
      if (!card) return;

      setState((draft: GameStore) => {
        applySinglePayloadToDraft(draft, card.actionPayload);
      });

      toast.success(`War Council plan applied for ${card.warriorName}.`);
    },
    [report.cards, setState]
  );

  const applyAllSetups = useCallback(() => {
    if (report.summary.allActionPayloads.length === 0) return;

    setState((draft: GameStore) => {
      for (const payload of report.summary.allActionPayloads) {
        applySinglePayloadToDraft(draft, payload);
      }
    });

    toast.success(
      `War Council executed: ${report.summary.allActionPayloads.length} warrior plans applied.`
    );
  }, [report.summary.allActionPayloads, setState]);

  const setWarriorCampaignFocus = useCallback(
    (warriorId: WarriorId, focus: CampaignFocus) => {
      setState((draft: GameStore) => {
        const warrior = draft.roster.find((w) => w.id === warriorId);
        if (warrior) {
          warrior.campaignFocus = focus;
        }
      });
      toast.success('Campaign focus updated.');
    },
    [setState]
  );

  return {
    report,
    summary: report.summary,
    cards: report.cards,
    applyWarriorSetup,
    applyAllSetups,
    setWarriorCampaignFocus,
  };
}
