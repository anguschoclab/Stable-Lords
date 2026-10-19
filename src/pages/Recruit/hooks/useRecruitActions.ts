import { useState, useCallback } from 'react';
import { type GameStore, useGameStore } from '@/state/useGameStore';
import { makeWarrior } from '@/engine/factories/warriorFactory';
import { SeededRNG, hashStr } from '@/utils/random';
import {
  fullRefreshPool,
  type PoolWarrior,
  REFRESH_COST,
  signWarrior,
  type SignWarriorResult,
} from '@/engine/recruitment/recruitment';
import {
  revealRecruitPotential,
  type PotentialScoutReport,
} from '@/engine/recruitment/recruitScouting';
import { STYLE_DISPLAY_NAMES } from '@/types/game';
import type { FightingStyle, Attributes, WarriorId, Warrior } from '@/types/game';
import type { LedgerEntry } from '@/types/state.types';
import { computeMetaDrift } from '@/engine/analytics/metaDrift';
import { BASE_ROSTER_CAP } from '@/constants/economy/roster';
import { collectUsedWarriorIds, collectUsedWarriorNames } from '@/engine/core/warriorCollection';
import { deadIdSet, isActive } from '@/engine/warrior/warriorStatus';
import { toast } from 'sonner';

const CUSTOM_COST = 200;
const BONUS_COST = 50;
const SCOUT_COST = 25;

interface UseRecruitActionsParams {
  rosterFull: boolean;
  setState: (fn: (draft: GameStore) => void) => void;
  deductFunds: (amount: number, label: string, category: LedgerEntry['category']) => boolean;
  week: number;
  navigate: (opts: { to: string }) => void;
}

/** Active-roster cap for the player stable. */
function playerRosterCap(state: Pick<GameStore, 'rosterBonus'>): number {
  return BASE_ROSTER_CAP + (state.rosterBonus ?? 0);
}

const FAILURE_TOAST: Record<string, string> = {
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
function applyRecruitDraft(draft: GameStore, w: PoolWarrior, bonus: boolean, totalCost: number) {
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

/** Draft mutation for a paid pool refresh: non-destructive — protected
 *  entries (claims, apprentices, free agents) carry over; the shortfall is
 *  regenerated avoiding every known name. */
function applyPoolRefreshDraft(draft: GameStore) {
  const newPool = fullRefreshPool({
    week: draft.week,
    usedNames: collectUsedWarriorNames(draft),
    rng: new SeededRNG(draft.week * 1337 + 7),
    currentPool: draft.recruitPool ?? [],
    stableCount: draft.rivals?.length,
    meta: computeMetaDrift(draft.arenaHistory ?? []),
    legacyCandidates: [...(draft.graveyard ?? []), ...(draft.retired ?? [])].filter(
      (w: Warrior) => (w.fame ?? 0) > 1000
    ),
  });
  draft.recruitPool = newPool;
  toast.success(`Scout pool refreshed! (-${REFRESH_COST}g)`);
}

/** Draft mutation for a custom-built recruit; navigates to the new warrior. */
function applyCustomCreateDraft(
  draft: GameStore,
  data: { name: string; style: FightingStyle; attributes: Attributes; avatarSeed?: number },
  navigate: (opts: { to: string }) => void
) {
  // In-draft cap enforcement — the authoritative roster may have grown since
  // the pre-flight check.
  const activeCount = (draft.roster ?? []).filter((w: Warrior) => isActive(w)).length;
  if (activeCount >= playerRosterCap(draft)) {
    toast.error('Roster full!');
    return;
  }

  // Re-roll the minted id while it collides with a live or dead identity.
  const rng = new SeededRNG(draft.week + hashStr(data.name));
  const usedIds = collectUsedWarriorIds(draft);
  const deadIds = deadIdSet(draft);
  let id = rng.uuid('warrior') as WarriorId;
  while (usedIds.has(id) || deadIds.has(id)) id = rng.uuid('warrior') as WarriorId;

  const warrior = makeWarrior({
    id,
    name: data.name,
    style: data.style,
    attrs: data.attributes,
    overrides: {
      avatarSeed: data.avatarSeed ?? hashStr(`avatar:${data.name}`),
      stableId: draft.player?.id,
    },
  });

  draft.roster.push(warrior);

  toast.success(`${data.name} has joined your stable! (-${CUSTOM_COST}g)`);
  setTimeout(() => navigate({ to: `/warrior/${id}` }), 0);
}

/** Charge `amount` through deductFunds, toasting `failMsg` when declined. */
function chargeOrToast(
  deductFunds: UseRecruitActionsParams['deductFunds'],
  amount: number,
  label: string,
  category: LedgerEntry['category'],
  failMsg: string
): boolean {
  if (deductFunds(amount, label, category)) return true;
  toast.error(failMsg);
  return false;
}

/** Gate a signing against live store state before any funds move — the
 *  funnel checks capacity, dead identities, and duplicates. */
function preflightPoolSigning(w: PoolWarrior, bonus: boolean): SignWarriorResult {
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

/**
 *
 */
export function useRecruitActions({
  rosterFull,
  setState,
  deductFunds,
  week,
  navigate,
}: UseRecruitActionsParams) {
  const [scoutedIds, setScoutedIds] = useState<Set<string>>(new Set());
  const [scoutReports, setScoutReports] = useState<Record<string, PotentialScoutReport>>({});

  const handleRecruit = useCallback(
    (w: PoolWarrior, bonus: boolean = false) => {
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
      if (!chargeOrToast(deductFunds, totalCost, label, 'recruit', `Not enough funds! Need ${totalCost}g.`))
        return;

      setState((draft: GameStore) => applyRecruitDraft(draft, w, bonus, totalCost));
    },
    [rosterFull, setState, deductFunds]
  );

  const handleScout = useCallback(
    (w: PoolWarrior) => {
      if (!chargeOrToast(deductFunds, SCOUT_COST, `Scout Potential: ${w.name}`, 'other', 'Not enough gold to scout potential (need 25g).'))
        return;
      setScoutedIds((s) => new Set(s).add(w.id));
      const report = revealRecruitPotential(w.id, week, w.potential);
      setScoutReports((prev) => ({ ...prev, [w.id]: report }));
      toast.success(`Scouted potential for ${w.name}! (-25g)`);
    },
    [deductFunds, week]
  );

  const handleRefresh = useCallback(() => {
    if (!chargeOrToast(deductFunds, REFRESH_COST, 'Pool refresh', 'other', `Not enough gold! Need ${REFRESH_COST}g to refresh.`))
      return;
    setState(applyPoolRefreshDraft);
  }, [deductFunds, setState]);

  const handleCustomCreate = useCallback(
    (data: { name: string; style: FightingStyle; attributes: Attributes; avatarSeed?: number }) => {
      if (rosterFull) {
        toast.error('Roster full!');
        return;
      }
      if (!deductFunds(CUSTOM_COST, `Custom Build: ${data.name}`, 'recruit')) {
        toast.error(`Not enough gold! Need ${CUSTOM_COST}g for custom build.`);
        return;
      }

      setState((draft: GameStore) => applyCustomCreateDraft(draft, data, navigate));
    },
    [setState, navigate, rosterFull, deductFunds]
  );

  return {
    scoutedIds,
    scoutReports,
    handleRecruit,
    handleScout,
    handleRefresh,
    handleCustomCreate,
  };
}
