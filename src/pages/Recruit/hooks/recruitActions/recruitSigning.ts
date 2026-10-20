import { type GameStore, useGameStore } from '@/state/useGameStore';
import { SeededRNG, hashStr } from '@/utils/random';
import {
  signWarrior,
  type PoolWarrior,
  type SignWarriorResult,
} from '@/engine/recruitment/recruitment';
import { STYLE_DISPLAY_NAMES } from '@/types/game';
import type { Warrior } from '@/types/game';
import { BASE_ROSTER_CAP } from '@/constants/economy/roster';
import { collectUsedWarriorIds } from '@/engine/core/warriorCollection';
import { deadIdSet, isActive } from '@/engine/warrior/warriorStatus';
import { toast } from 'sonner';

export const BONUS_COST = 50;

/** Active-roster cap for the player stable. */
export function playerRosterCap(state: Pick<GameStore, 'rosterBonus'>): number {
  return BASE_ROSTER_CAP + (state.rosterBonus ?? 0);
}

export const FAILURE_TOAST: Record<string, string> = {
  ROSTER_FULL: 'Roster full! Retire or release a warrior first.',
  INSUFFICIENT_FUNDS: 'Not enough funds!',
  DEAD_IDENTITY: 'That recruit is no longer available.',
  DUPLICATE_ID: 'Signing conflict — please try again.',
};

/**
 * Draft mutation for a signed recruit: the authoritative funnel call —
 * converts, enforces the cap against the draft, drains both shelves, and
 * writes the newsletter entry.
 */
export function applyRecruitDraft(
  draft: GameStore,
  w: PoolWarrior,
  bonus: boolean,
  totalCost: number
) {
  const recruitRng = new SeededRNG(draft.week + hashStr(w.name));
  const result = signWarrior({
    recruit: w,
    roster: draft.roster ?? [],
    maxRoster: playerRosterCap(draft),
    signingBonus: bonus,
    stableId: draft.player?.id,
    rng: recruitRng,
    usedIds: collectUsedWarriorIds(draft),
    deadIds: deadIdSet(draft),
    pool: draft.recruitPool ?? [],
    freeAgents: draft.freeAgents ?? [],
  });
  if (!result.ok) {
    toast.error(FAILURE_TOAST[result.reason] ?? 'Signing failed.');
    return;
  }

  draft.roster.push(result.warrior);
  if (result.updatedPool) draft.recruitPool = result.updatedPool;
  if (result.updatedFreeAgents) draft.freeAgents = result.updatedFreeAgents;

  const items = [
    `${draft.player.stableName} signed ${w.name}, a ${w.tier.toLowerCase()} ${STYLE_DISPLAY_NAMES[w.style]}.`,
  ];
  if (bonus)
    items.push(
      `A 50g signing bonus sealed the deal — ${w.name} arrived eager to prove themselves.`
    );
  draft.newsletter.push({
    id: String(hashStr(`${draft.week}-recruitment-${w.name}`)),
    week: draft.week,
    title: 'Recruitment',
    items,
  });

  toast.success(`${w.name} has joined your stable! (-${totalCost}g)`);
}

/** Gate a signing against live store state before any funds move — the
 *  funnel checks capacity, dead identities, and duplicates. */
export function preflightPoolSigning(w: PoolWarrior, bonus: boolean): SignWarriorResult {
  const live = useGameStore.getState();
  return signWarrior({
    recruit: w,
    roster: live.roster ?? [],
    maxRoster: playerRosterCap(live),
    signingBonus: bonus,
    usedIds: collectUsedWarriorIds(live),
    deadIds: deadIdSet(live),
  });
}

/** In-draft roster-cap re-check used by the custom-create funnel. */
export function draftRosterIsFull(draft: GameStore): boolean {
  const activeCount = (draft.roster ?? []).filter((w: Warrior) => isActive(w)).length;
  return activeCount >= playerRosterCap(draft);
}

interface RecruitFromPoolDeps {
  rosterFull: boolean;
  setState: (fn: (draft: GameStore) => void) => void;
  deductFunds: (amount: number, label: string, category: 'recruit') => boolean;
}

/** Sign a pool recruit: preflight funnel, funds check, then the draft write. */
export function recruitFromPool(deps: RecruitFromPoolDeps, w: PoolWarrior, bonus: boolean): void {
  const { rosterFull, setState, deductFunds } = deps;
  if (rosterFull) {
    toast.error('Roster full! Retire or release a warrior first.');
    return;
  }
  const preflight = preflightPoolSigning(w, bonus);
  if (!preflight.ok) {
    toast.error(FAILURE_TOAST[preflight.reason] ?? 'Signing failed.');
    return;
  }

  const totalCost = w.cost + (bonus ? BONUS_COST : 0);
  const label = `Recruit: ${w.name} (${w.tier})${bonus ? ' + signing bonus' : ''}`;
  if (!deductFunds(totalCost, label, 'recruit')) {
    toast.error(`Not enough funds! Need ${totalCost}g.`);
    return;
  }

  setState((draft: GameStore) => applyRecruitDraft(draft, w, bonus, totalCost));
}
