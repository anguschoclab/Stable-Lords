import type { GameState, NewsletterItem } from '@/types/state.types';
import type { Warrior } from '@/types/warrior.types';
import type { WarriorId } from '@/types/shared.types';
import type { FightOutcome } from '@/types/combat.types';
import type { IRNGService } from '@/engine/core/rng/IRNGService';
import { calculateXP, applyXP } from '@/engine/warrior/progression';
import { checkDiscovery } from '@/engine/favorites';
import { generateId } from '@/utils/idUtils';
import { StateImpact } from '@/engine/impacts';
import { patchRivalWarrior } from './warriorRouting';

/**
 * Routes a per-warrior update to either the player's rosterUpdates map or to
 * a per-warrior rivalWarriorPatches entry. Resolves ownership by:
 *   1. warrior.stableId (set on rival warriors by recruitment / aging)
 *   2. presence in state.roster (player)
 *   3. fallback: scan rivals.roster for warrior.id
 *
 * Pre-2026-04 the entire progression handler only wrote to rosterUpdates,
 * which silently dropped every update for rival warriors — meaning rival
 * warriors NEVER gained XP and NEVER discovered favorites. All progression
 * was player-only. World bouts produced zero rival progression. The
 * follow-up routed them through whole-roster rivalsUpdates writes, which
 * later bout impacts clobbered, so rival progression was still lost.
 */
function routeUpdate(
  s: GameState,
  warrior: Warrior,
  partial: Partial<Warrior>,
  rosterUpdates: Map<WarriorId, Partial<Warrior>>,
  rivalWarriorPatches: Map<WarriorId, Partial<Warrior>>
): void {
  const isPlayer =
    s.player?.id === warrior.stableId || (s.roster || []).some((w) => w.id === warrior.id);
  if (isPlayer) {
    const existing = rosterUpdates.get(warrior.id) ?? {};
    rosterUpdates.set(warrior.id, { ...existing, ...partial });
    return;
  }
  // Rival-owned: per-warrior patch of just the changed fields. The old
  // whole-roster rivalsUpdates write was clobbered by later bout impacts.
  patchRivalWarrior(rivalWarriorPatches, warrior, partial);
}

/**
 * Compute per-bout progressions for both warriors and rival stables after a fight resolves.
 */
export function handleProgressions(
  s: GameState,
  wA: Warrior,
  wD: Warrior,
  outcome: FightOutcome,
  tags: string[],
  week: number,
  rng?: IRNGService
): StateImpact {
  const rosterUpdates = new Map<WarriorId, Partial<Warrior>>();
  const rivalWarriorPatches = new Map<WarriorId, Partial<Warrior>>();
  const newsletterItems: NewsletterItem[] = [];

  // XP for both fighters — routed to the right roster regardless of ownership
  const updatedA = applyXP(wA, calculateXP(outcome, 'A', tags), rng).warrior;
  routeUpdate(s, wA, updatedA, rosterUpdates, rivalWarriorPatches);

  const updatedD = applyXP(wD, calculateXP(outcome, 'D', tags), rng).warrior;
  routeUpdate(s, wD, updatedD, rosterUpdates, rivalWarriorPatches);

  // Favorites discovery — also for both fighters (was player-only)
  const discRng = rng;
  for (const w of [wA, wD]) {
    const disc = checkDiscovery(
      w,
      discRng ?? {
        next: () => 0.5,
        uuid: () => 'uuid',
        pick: <T>(arr: T[]) => arr[0] as T,
        roll: (min: number) => min,
        shuffle: <T>(arr: T[]) => arr,
        rollWeighted: <K extends string>(weights: Partial<Record<K, number>>): K =>
          Object.keys(weights)[0] as K,
        chance: () => false,
      }
    );
    if (disc.updated && w.favorites) {
      // checkDiscovery mutates w.favorites in place; route a fresh copy so the
      // rival patch diff (by reference) sees the change. Shard workers hold
      // clones, so without a patch the discovery would be lost off-thread.
      const favorites = { ...w.favorites, discovered: { ...w.favorites.discovered } };
      routeUpdate(s, w, { favorites }, rosterUpdates, rivalWarriorPatches);
      if (disc.hints.length > 0) {
        newsletterItems.push({
          id: discRng ? discRng.uuid() : generateId(undefined, 'newsletter'),
          week,
          title: 'Training Insight',
          items: disc.hints,
        });
      }
    }
  }

  // Upset / Giant Killer Flair — also routed
  if (outcome.winner) {
    const winner = outcome.winner === 'A' ? wA : wD;
    const loser = outcome.winner === 'A' ? wD : wA;
    if (
      loser.fame >= (winner.fame || 0) + 10 &&
      (loser.fame || 0) >= (winner.fame || 0) * 2 &&
      !winner.flair.includes('Giant Killer')
    ) {
      routeUpdate(
        s,
        winner,
        { flair: [...(winner.flair || []), 'Giant Killer'] },
        rosterUpdates,
        rivalWarriorPatches
      );
    }
  }

  const impact: StateImpact = { rosterUpdates, rivalWarriorPatches };
  if (newsletterItems.length > 0) impact.newsletterItems = newsletterItems;
  return impact;
}
