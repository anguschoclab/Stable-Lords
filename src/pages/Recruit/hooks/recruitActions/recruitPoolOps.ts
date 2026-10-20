import type { GameStore } from '@/state/useGameStore';
import { SeededRNG, hashStr } from '@/utils/random';
import { fullRefreshPool, REFRESH_COST } from '@/engine/recruitment/recruitment';
import { computeMetaDrift } from '@/engine/analytics/metaDrift';
import { collectUsedWarriorNames } from '@/engine/core/warriorCollection';
import { makeWarrior } from '@/engine/factories/warriorFactory';
import { collectUsedWarriorIds } from '@/engine/core/warriorCollection';
import { deadIdSet } from '@/engine/warrior/warriorStatus';
import type { FightingStyle, Attributes, WarriorId, Warrior } from '@/types/game';
import { toast } from 'sonner';
import { draftRosterIsFull } from './recruitSigning';

export const CUSTOM_COST = 200;

/** Draft mutation for a paid pool refresh: non-destructive — protected
 *  entries (claims, apprentices, free agents) carry over; the shortfall is
 *  regenerated avoiding every known name. */
export function applyPoolRefreshDraft(draft: GameStore) {
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
export function applyCustomCreateDraft(
  draft: GameStore,
  data: { name: string; style: FightingStyle; attributes: Attributes; avatarSeed?: number },
  navigate: (opts: { to: string }) => void
) {
  // In-draft cap enforcement — the authoritative roster may have grown since
  // the pre-flight check.
  if (draftRosterIsFull(draft)) {
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

/** Paid pool refresh: funds check, then the non-destructive refresh draft. */
export function refreshPool(
  deps: Pick<CustomCreateDeps, 'setState'> & {
    deductFunds: (amount: number, label: string, category: 'other') => boolean;
  }
): void {
  const { setState, deductFunds } = deps;
  if (!deductFunds(REFRESH_COST, 'Pool refresh', 'other')) {
    toast.error(`Not enough gold! Need ${REFRESH_COST}g to refresh.`);
    return;
  }
  setState(applyPoolRefreshDraft);
}

interface CustomCreateDeps {
  rosterFull: boolean;
  setState: (fn: (draft: GameStore) => void) => void;
  deductFunds: (amount: number, label: string, category: 'recruit') => boolean;
  navigate: (opts: { to: string }) => void;
}

/** Custom-build flow: cap gate, funds check, then the minting draft write. */
export function customCreate(
  deps: CustomCreateDeps,
  data: { name: string; style: FightingStyle; attributes: Attributes; avatarSeed?: number }
): void {
  const { rosterFull, setState, deductFunds, navigate } = deps;
  if (rosterFull) {
    toast.error('Roster full!');
    return;
  }
  if (!deductFunds(CUSTOM_COST, `Custom Build: ${data.name}`, 'recruit')) {
    toast.error(`Not enough gold! Need ${CUSTOM_COST}g for custom build.`);
    return;
  }

  setState((draft: GameStore) => applyCustomCreateDraft(draft, data, navigate));
}
