import type { GameState, OwnerGrudge } from '@/types/state.types';
import type { WarriorId } from '@/types/shared.types';
import { getRecentFights } from '@/engine/core/historyUtils';
import { PERSONALITY_CLASH } from '@/data/ownerData';
import { addCapped, clamp } from '@/utils/math';

/**
 * Detect and escalate owner-to-owner grudges based on personality clashes
 * and recent kill/loss history between stables.
 */
export function processOwnerGrudges(
  state: GameState,
  existingGrudges: OwnerGrudge[]
): { grudges: OwnerGrudge[]; gazetteItems: string[] } {
  const grudges = existingGrudges.map((g) => ({ ...g }));
  const gazetteItems: string[] = [];
  const rivals = state.rivals || [];

  // Check for personality clashes between stables that have recently fought
  const recentFights = getRecentFights(state.arenaHistory, state.week - 13);

  // ── Single-pass aggregation ────────────────────────────────────────────────
  // Resolve each fight's warriors to their owning roster once, instead of
  // re-scanning all recentFights for every rival pair (O(R²·F)) and again for
  // every rival×player pair (O(R·F)).
  const warriorToRival = new Map<WarriorId, number>();
  rivals.forEach((r, idx) => {
    for (const w of r.roster) {
      if (!warriorToRival.has(w.id)) warriorToRival.set(w.id, idx);
    }
  });
  const playerWarriorIds = new Set((state.roster || []).map((w) => w.id));

  const pairKey = (i: number, j: number) => (i < j ? `${i}|${j}` : `${j}|${i}`);
  const rivalPairAgg = new Map<string, { hasCrossFight: boolean; hasKill: boolean }>();
  const rivalKillVsPlayer = new Set<number>();
  const rivalUpsetVsPlayer = new Set<number>();

  for (const f of recentFights) {
    if (!f) continue;
    const idxA = warriorToRival.get(f.warriorIdA);
    const idxD = warriorToRival.get(f.warriorIdD);

    if (idxA !== undefined && idxD !== undefined) {
      if (idxA === idxD) continue; // intra-stable bout is never a cross-fight
      const key = pairKey(idxA, idxD);
      const agg = rivalPairAgg.get(key) ?? { hasCrossFight: false, hasKill: false };
      agg.hasCrossFight = true;
      if (f.by === 'Kill') agg.hasKill = true;
      rivalPairAgg.set(key, agg);
      continue;
    }

    // Player cross-fight: exactly one side is a current rival warrior and the
    // other a current player-roster warrior.
    const rivalIdx = idxA !== undefined ? idxA : idxD;
    if (rivalIdx === undefined) continue;
    const rivalIsA = idxA !== undefined;
    const otherIsPlayer = rivalIsA
      ? playerWarriorIds.has(f.warriorIdD)
      : playerWarriorIds.has(f.warriorIdA);
    if (!otherIsPlayer) continue;

    if (f.by === 'Kill') {
      rivalKillVsPlayer.add(rivalIdx);
      continue;
    }

    // Upset: the rival's warrior beat a much more famous player warrior.
    const rivalWon = (f.winner === 'A' && rivalIsA) || (f.winner === 'D' && !rivalIsA);
    if (rivalWon) {
      const loserId = rivalIsA ? f.warriorIdD : f.warriorIdA;
      const winnerId = rivalIsA ? f.warriorIdA : f.warriorIdD;
      const loserFame = state.warriorMap?.get(loserId)?.fame ?? 0;
      const winnerFame = state.warriorMap?.get(winnerId)?.fame ?? 0;
      if (loserFame - winnerFame >= 100) rivalUpsetVsPlayer.add(rivalIdx);
    }
  }

  // Order-independent owner-pair lookup replaces the per-pair `grudges.find`
  // scan (was O(R²·G)).
  const ownerPairKey = (a: string, b: string) => (a < b ? `${a}|${b}` : `${b}|${a}`);
  const grudgeByPair = new Map<string, OwnerGrudge>();
  for (const g of grudges) {
    const k = ownerPairKey(g.ownerIdA, g.ownerIdB);
    if (!grudgeByPair.has(k)) grudgeByPair.set(k, g);
  }

  for (let i = 0; i < rivals.length; i++) {
    const rA = rivals[i];
    if (!rA) continue;
    for (let j = i + 1; j < rivals.length; j++) {
      const rB = rivals[j];
      if (!rB) continue;
      const persA = rA.owner.personality;
      const persB = rB.owner.personality;
      if (!persA || !persB) continue;

      // Check if personalities naturally clash
      const clash =
        PERSONALITY_CLASH[persA]?.includes(persB) || PERSONALITY_CLASH[persB]?.includes(persA);
      if (!clash) continue;

      const agg = rivalPairAgg.get(pairKey(i, j));
      if (!agg?.hasCrossFight) continue;
      const hasKill = agg.hasKill;

      const existing = grudgeByPair.get(ownerPairKey(rA.owner.id, rB.owner.id));

      if (existing) {
        if (hasKill && existing.lastEscalation < state.week - 4) {
          const prevIntensity = existing.intensity;
          existing.intensity = addCapped(existing.intensity, 1, 5);
          existing.lastEscalation = state.week;
          existing.reason = `Blood spilled between ${rA.owner.stableName} and ${rB.owner.stableName}`;
          gazetteItems.push(
            `🔥 GRUDGE DEEPENS: ${rA.owner.name} (${persA}) and ${rB.owner.name} (${persB}) — their feud intensifies after another kill!`
          );
          if (prevIntensity < 4 && existing.intensity >= 4) {
            gazetteItems.push(
              `⚡ SEASON FEUD: The rivalry between ${rA.owner.stableName} and ${rB.owner.stableName} has become an all-consuming feud!`
            );
          }
        }
      } else if (hasKill) {
        const created: OwnerGrudge = {
          id: `grudge_${rA.owner.id}_${rB.owner.id}` as import('@/types/shared.types').GrudgeId,
          ownerIdA: rA.owner.id,
          ownerIdB: rB.owner.id,
          intensity: 2,
          reason: `Personality clash: ${persA} vs ${persB} — ignited by bloodshed`,
          startWeek: state.week,
          lastEscalation: state.week,
        };
        grudges.push(created);
        grudgeByPair.set(ownerPairKey(created.ownerIdA, created.ownerIdB), created);
        gazetteItems.push(
          `⚔️ NEW RIVALRY: ${rA.owner.name} the ${persA} and ${rB.owner.name} the ${persB} have declared a blood feud!`
        );
      }
    }
  }

  // ── Player × rival pairs (G5b): kills/upsets against the player's roster
  // create real grudges. Unlike rival×rival pairs these need no personality
  // clash — bloodshed is reason enough.
  if (playerWarriorIds.size > 0) {
    for (let idx = 0; idx < rivals.length; idx++) {
      const r = rivals[idx];
      if (!r) continue;
      const hasKill = rivalKillVsPlayer.has(idx);
      const hasUpset = rivalUpsetVsPlayer.has(idx);

      if (!hasKill && !hasUpset) continue;

      const existing = grudgeByPair.get(ownerPairKey(r.owner.id, state.player.id));

      if (existing) {
        if (hasKill && existing.lastEscalation < state.week - 4) {
          existing.intensity = addCapped(existing.intensity, 1, 5);
          existing.lastEscalation = state.week;
          existing.reason = `Blood spilled between ${r.owner.stableName} and the player's stable`;
          gazetteItems.push(
            `🔥 GRUDGE DEEPENS: ${r.owner.name} vows vengeance on the player's stable after another kill!`
          );
        }
      } else {
        const created: OwnerGrudge = {
          id: `grudge_${r.owner.id}_${state.player.id}` as import('@/types/shared.types').GrudgeId,
          ownerIdA: r.owner.id,
          ownerIdB: state.player.id,
          intensity: hasKill ? 2 : 1,
          reason: hasKill
            ? `${r.owner.stableName} suffered a kill at the player's hands`
            : `${r.owner.stableName} was humiliated by an underdog defeat`,
          startWeek: state.week,
          lastEscalation: state.week,
        };
        grudges.push(created);
        grudgeByPair.set(ownerPairKey(created.ownerIdA, created.ownerIdB), created);
        gazetteItems.push(
          hasKill
            ? `⚔️ BLOOD FEUD: ${r.owner.name} has sworn vengeance on the player's stable!`
            : `😤 SLIGHTED: ${r.owner.name} seethes after an upset loss to the player's stable.`
        );
      }
    }
  }

  // Decay old grudges — after 4 consecutive weeks with no cross-stable fight the
  // intensity drops by 1. This replaces the old 26-week cliff.
  for (const g of grudges) {
    if (state.week - g.lastEscalation > 4 && g.intensity > 1) {
      g.intensity = Math.max(1, g.intensity - 1);
    }
  }

  return { grudges: grudges.filter((g) => g.intensity > 0), gazetteItems };
}

/**
 * Calculate rivalry intensity adjustment based on match outcomes.
 * Base (bouts fought) + Death (+5) + Upset (+3).
 */
export function calculateRivalryScore(
  boutsFought: number,
  deathsCount: number,
  upsetsCount: number
): number {
  let score = 0;
  score += Math.floor(boutsFought / 3);
  score += deathsCount * 5;
  score += upsetsCount * 3;
  return clamp(score, 1, 5);
}
