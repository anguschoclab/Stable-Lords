/**
 * V26 — AI Turnaround Consumer
 *
 * `diagnoseTurnaround` (the player's "How To Make a Loser Win" advisor) is
 * pure and returns structured `TurnaroundAction[]`; rival stables get the
 * same diagnosis mapped onto the surfaces they own — one shared doctrine:
 *
 *  - `applyTurnaroundDiagnosis` appends `trainingAssignments` for
 *    confidently-diagnosed losers: a `drill` action becomes a skillDrill
 *    assignment on the win condition, a `train` action becomes the WT
 *    attribute assignment the advisor prescribes. Assignments suppress
 *    bout bids through `bookableRoster`, so a resting assignment is free
 *    rest enforcement — no separate "sit out" plumbing needed.
 *  - `turnaroundMatchupBias` is a bid-steering nudge — positive toward the
 *    matrix's best foe, negative toward the worst — so a losing stable
 *    seeks winnable fights instead of repeating losing ones.
 *
 * Evidence gating mirrors the advisor's honesty: ≥2 identical
 * `recentLossFactors` means a repeated pattern worth acting on; thin
 * records stay advisory-only and churn nothing.
 */
import type { RivalStableData, TrainingAssignment } from '@/types/state.types';
import type { Warrior } from '@/types/warrior.types';
import type { FightingStyle } from '@/types/shared.types';
import { diagnoseTurnaround } from '@/engine/advisor/turnaroundAdvisor';
import { getMatchupBonus } from '@/constants/combat/combat';
import { clamp } from '@/utils/math';

/**
 * A confident diagnosis needs a REPEATED cause: at least two recent loss
 * factors naming the same thing. One bad week is noise — a pattern is
 * actionable. Advisory-only below that.
 */
function confidentlyDiagnosed(w: Warrior): boolean {
  const factors = w.strategyMemory?.recentLossFactors ?? [];
  if (factors.length < 2) return false;
  const counts = new Map<string, number>();
  for (const f of factors) counts.set(f, (counts.get(f) ?? 0) + 1);
  return Math.max(...counts.values()) >= 2;
}

const isLosing = (w: Warrior): boolean =>
  (w.career?.losses ?? 0) > (w.career?.wins ?? 0) && (w.career?.losses ?? 0) > 0;

/**
 * Append training assignments for confidently-diagnosed losers — the same
 * prescriptions the player's advisor writes, mapped onto AI surfaces.
 * Warriors already carrying ANY assignment are left alone (the training
 * pass, a recovery, or a previous diagnosis owns their week).
 */
export function applyTurnaroundDiagnosis(rival: RivalStableData): RivalStableData {
  const assigned = new Set(
    (rival.trainingAssignments ?? []).map((a) => a.warriorId as string)
  );
  const additions: TrainingAssignment[] = [];

  for (const w of rival.roster) {
    if (assigned.has(w.id as string)) continue;
    const report = diagnoseTurnaround(w);
    if (!report || !confidentlyDiagnosed(w)) continue;
    const before = additions.length;
    for (const action of report.actions) {
      if (action.kind === 'drill') {
        additions.push({
          warriorId: w.id,
          type: 'skillDrill',
          skill: report.winCondition.skill,
        });
      } else if (action.kind === 'train') {
        // The advisor's only train prescription targets the learn bottleneck.
        additions.push({ warriorId: w.id, type: 'attribute', attribute: 'WT' });
      }
    }
    if (additions.length > before) assigned.add(w.id as string);
  }

  if (additions.length === 0) return rival;
  return { ...rival, trainingAssignments: [...(rival.trainingAssignments ?? []), ...additions] };
}

/**
 * Bid-steering nudge for a losing warrior: seek the matrix's winnable foes,
 * shy from the worst. Bounded ±2 — a steer, not a swamp of the ordinary
 * matchup scoring (the bid pipeline adds it to its pairwise modifier).
 * Returns 0 for non-losers and same-style foes — no turnaround case, no
 * steer; mirror bouts teach nothing about matchup edges.
 */
export function turnaroundMatchupBias(w: Warrior, foeStyle: FightingStyle): number {
  if (!isLosing(w) || foeStyle === w.style) return 0;
  return clamp(getMatchupBonus(w.style, foeStyle), -2, 2);
}
