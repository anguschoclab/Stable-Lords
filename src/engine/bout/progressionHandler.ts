import type { GameState, NewsletterItem } from '@/types/state.types';
import type { Warrior } from '@/types/warrior.types';
import type { WarriorId } from '@/types/shared.types';
import type { FightOutcome } from '@/types/combat.types';
import type { IRNGService } from '@/engine/core/rng/IRNGService';
import { calculateXP, applyXP } from '@/engine/warrior/progression';
import { checkDiscovery, mergeWeaponChart } from '@/engine/favorites';
import { rollBoutLearns, favoriteLearnOf, LEARN_SKILL_KEYS } from '@/engine/learning';
import { LEARN_SKILL_NAMES } from '@/constants/combat/combat/learn';
import { warriorDisplayName } from '@/utils/warriorDisplay';
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
function isPlayerWarrior(s: GameState, warrior: Warrior): boolean {
  return s.player?.id === warrior.stableId || (s.roster || []).some((w) => w.id === warrior.id);
}

function routeUpdate(
  s: GameState,
  warrior: Warrior,
  partial: Partial<Warrior>,
  rosterUpdates: Map<WarriorId, Partial<Warrior>>,
  rivalWarriorPatches: Map<WarriorId, Partial<Warrior>>
): void {
  const isPlayer = isPlayerWarrior(s, warrior);
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
 *
 */
interface HandleProgressionsArgs {
  s: GameState;
  wA: Warrior;
  wD: Warrior;
  outcome: FightOutcome;
  tags: string[];
  week: number;
  rng?: IRNGService;
  /** Headless bouts keep outcome.log empty — no transcript lines are pushed. */
  headless?: boolean;
}

/** Display names for the skills gained this bout, in fixed learn order. */
function learnedSkillNames(gained: Partial<Record<string, number>>): string {
  return LEARN_SKILL_KEYS.filter((k) => (gained[k] ?? 0) > 0)
    .map((k) => LEARN_SKILL_NAMES[k])
    .join(', ');
}

/**
 * Skill learning (Arena-93): each living fighter rolls WT-gated learn
 * attempts weighted by both combatants' style priorities plus their own
 * hidden favorite learn. The dead learn nothing — mortality ran first.
 * Consumes the bout's shared stream in fixed A-then-D order, after XP
 * draws and before discovery draws.
 */
function rollLearnProgressions(
  args: HandleProgressionsArgs,
  rosterUpdates: Map<WarriorId, Partial<Warrior>>,
  rivalWarriorPatches: Map<WarriorId, Partial<Warrior>>,
  newsletterItems: NewsletterItem[],
  learnedFavorite: Record<'A' | 'D', boolean>
): void {
  const { s, wA, wD, outcome, week, rng } = args;
  const post = outcome.post ?? { xpA: 0, xpD: 0 };
  outcome.post = post;
  for (const { w, opp, side } of [
    { w: wA, opp: wD, side: 'A' as const },
    { w: wD, opp: wA, side: 'D' as const },
  ]) {
    const dead =
      w.isDead === true ||
      post.diedPostBout === side ||
      (outcome.by === 'Kill' && outcome.winner !== side);
    if (dead) continue;

    const { gained, learnedSkills } = rollBoutLearns(w, opp.style, rng);
    if (side === 'A') post.learnsA = gained;
    else post.learnsD = gained;

    const totalGained = Object.values(gained).reduce((sum, v) => sum + (v ?? 0), 0);
    if (totalGained === 0) continue;
    w.learnedSkills = learnedSkills;
    learnedFavorite[side] = (gained[favoriteLearnOf(w)] ?? 0) > 0;
    // Fresh copy in the patch: `w` is the rival diff's `before` snapshot, so
    // routing the same reference we just assigned would compare equal and
    // drop the change (same reason the favorites block below re-wraps).
    routeUpdate(
      s,
      w,
      { learnedSkills: { ...learnedSkills } },
      rosterUpdates,
      rivalWarriorPatches
    );

    // Transcript line — deterministic text built from the stored gains, so
    // it draws nothing from any RNG stream. Headless-gated like every other
    // transcript push: autosim's deferredBoutLogs must stay empty.
    const skillsLearned = learnedSkillNames(gained);
    if (!args.headless) {
      outcome.log.push({
        minute: outcome.minutes,
        text: `${warriorDisplayName(w)} learned well this bout — picks up lessons in ${skillsLearned}.`,
        phase: 'LATE',
      });
    }

    // Gazette: learn write-ups stay player-stable only — rivals' classrooms
    // are their own business.
    if (isPlayerWarrior(s, w)) {
      newsletterItems.push({
        id: rng ? rng.uuid() : generateId(undefined, 'newsletter'),
        week,
        title: 'Training Insight',
        items: [`${warriorDisplayName(w)} learned ${totalGained} skill${totalGained > 1 ? 's' : ''} this bout (${skillsLearned}).`],
      });
    }
  }
}

/**
 * Compute per-bout progressions for both warriors and rival stables after a fight resolves.
 */
export function handleProgressions(args: HandleProgressionsArgs): StateImpact {
  const { s, wA, wD, outcome, tags } = args;
  const { week, rng } = args;
  const rosterUpdates = new Map<WarriorId, Partial<Warrior>>();
  const rivalWarriorPatches = new Map<WarriorId, Partial<Warrior>>();
  const newsletterItems: NewsletterItem[] = [];

  // XP for both fighters — routed to the right roster regardless of ownership
  const updatedA = applyXP(wA, calculateXP(outcome, 'A', tags, wA, wD), rng).warrior;
  routeUpdate(s, wA, updatedA, rosterUpdates, rivalWarriorPatches);

  const updatedD = applyXP(wD, calculateXP(outcome, 'D', tags, wD, wA), rng).warrior;
  routeUpdate(s, wD, updatedD, rosterUpdates, rivalWarriorPatches);

  outcome.post = outcome.post ?? { xpA: 0, xpD: 0 };
  const learnedFavorite: Record<'A' | 'D', boolean> = { A: false, D: false };
  rollLearnProgressions(args, rosterUpdates, rivalWarriorPatches, newsletterItems, learnedFavorite);

  // Favorites discovery — also for both fighters (was player-only).
  // The bout's per-weapon tally merges into the persistent charting ledger
  // first, so players can deduce the favorite from crit rates before the
  // epiphany/symmetry rolls formally reveal it.
  const discRng = rng;
  for (const w of [wA, wD]) {
    const tally = w === wA ? outcome.post?.weaponChartA : outcome.post?.weaponChartD;
    const mergedFav = mergeWeaponChart(w.favorites, tally);
    if (mergedFav) w.favorites = mergedFav;

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
      },
      {
        weaponId: w.equipment?.weapon,
        oe: w.plan?.OE,
        al: w.plan?.AL,
        learnedFavorite: learnedFavorite[w === wA ? 'A' : 'D'],
      }
    );
    if ((disc.updated || mergedFav) && w.favorites) {
      // checkDiscovery mutates w.favorites in place; route a fresh copy so the
      // rival patch diff (by reference) sees the change. Shard workers hold
      // clones, so without a patch the discovery would be lost off-thread.
      const favorites = {
        ...w.favorites,
        discovered: { ...w.favorites.discovered },
        chart: w.favorites.chart ? { ...w.favorites.chart } : undefined,
      };
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
