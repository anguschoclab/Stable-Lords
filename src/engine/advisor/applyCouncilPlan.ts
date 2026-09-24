/**
 * Council Autopilot Application
 * Applies a StableCouncilReport's action payloads directly onto a GameState —
 * the engine-side counterpart of useStableAdvisor's draft mutations, used by
 * the autosim councilAutoPilot where there is no Zustand store.
 *
 * Callers that mutate state in place (autosim's mutableInput loop) own the
 * state object, so payloads are applied imperatively for speed.
 */
import type { GameState } from '@/types/state.types';
import type { StableCouncilReport, WarriorActionPayload } from './types';
import { respondToBoutOffer } from '@/engine/bout/mutations/contractMutations';
import { resolveImpacts } from '@/engine/impacts';
import { defaultStylePreset } from '@/engine/bout/stylePresets';

/** Apply one warrior's council payload (training, bout response, plan patch). */
export function applyWarriorPayload(state: GameState, payload: WarriorActionPayload): GameState {
  // 1. Training assignment — replace any existing assignment for the warrior.
  const assignments = (state.trainingAssignments ?? []).filter(
    (a) => a.warriorId !== payload.warriorId
  );
  assignments.push(payload.trainingAssignment);
  state.trainingAssignments = assignments;

  // 2. Bout offer acceptance.
  if (payload.boutOfferIdToAccept) {
    const offer = state.boutOffers?.[payload.boutOfferIdToAccept];
    if (offer?.status === 'Proposed') {
      const impact = respondToBoutOffer(
        state,
        payload.boutOfferIdToAccept,
        payload.warriorId,
        'Accepted'
      );
      state = resolveImpacts(state, [impact]);
    }
  }

  // 3. Battle plan tuning.
  if (payload.tacticsPlanPatch) {
    const warrior = state.roster.find((w) => w.id === payload.warriorId);
    if (warrior) {
      const basePlan = warrior.plan ?? defaultStylePreset(warrior.style).plan;
      warrior.plan = { ...basePlan, ...payload.tacticsPlanPatch };
    }
  }

  return state;
}

/** Apply every payload in a council report to the state. */
export function applyCouncilPlan(state: GameState, report: StableCouncilReport): GameState {
  for (const payload of report.summary.allActionPayloads) {
    state = applyWarriorPayload(state, payload);
  }
  return state;
}
