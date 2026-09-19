import type { GameState, OwnerGrudge } from '@/types/state.types';
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

      // Check if they've had kills against each other recently
      const aIdsSet = new Set(rA.roster.map((w) => w.id));
      const bIdsSet = new Set(rB.roster.map((w) => w.id));

      let hasCrossFight = false;
      let hasKill = false;

      for (let k = 0; k < recentFights.length; k++) {
        const f = recentFights[k];
        if (!f) continue;
        const isCrossFight =
          (aIdsSet.has(f.warriorIdA) && bIdsSet.has(f.warriorIdD)) ||
          (bIdsSet.has(f.warriorIdA) && aIdsSet.has(f.warriorIdD));

        if (isCrossFight) {
          hasCrossFight = true;
          if (f.by === 'Kill') {
            hasKill = true;
            break;
          }
        }
      }

      if (!hasCrossFight) continue;

      const existing = grudges.find(
        (g) =>
          (g.ownerIdA === rA.owner.id && g.ownerIdB === rB.owner.id) ||
          (g.ownerIdB === rA.owner.id && g.ownerIdA === rB.owner.id)
      );

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
        grudges.push({
          id: `grudge_${rA.owner.id}_${rB.owner.id}` as import('@/types/shared.types').GrudgeId,
          ownerIdA: rA.owner.id,
          ownerIdB: rB.owner.id,
          intensity: 2,
          reason: `Personality clash: ${persA} vs ${persB} — ignited by bloodshed`,
          startWeek: state.week,
          lastEscalation: state.week,
        });
        gazetteItems.push(
          `⚔️ NEW RIVALRY: ${rA.owner.name} the ${persA} and ${rB.owner.name} the ${persB} have declared a blood feud!`
        );
      }
    }
  }

  // ── Player × rival pairs (G5b): kills/upsets against the player's roster
  // create real grudges. Unlike rival×rival pairs these need no personality
  // clash — bloodshed is reason enough.
  const playerWarriorIds = new Set((state.roster || []).map((w) => w.id));
  if (playerWarriorIds.size > 0) {
    for (const r of rivals) {
      const rIds = new Set(r.roster.map((w) => w.id));
      let hasKill = false;
      let hasUpset = false;

      for (const f of recentFights) {
        const crossFight =
          (rIds.has(f.warriorIdA) && playerWarriorIds.has(f.warriorIdD)) ||
          (rIds.has(f.warriorIdD) && playerWarriorIds.has(f.warriorIdA));
        if (!crossFight) continue;

        if (f.by === 'Kill') {
          hasKill = true;
          break;
        }

        // Upset: the rival's warrior beat a much more famous player warrior.
        const rivalWon =
          (f.winner === 'A' && rIds.has(f.warriorIdA)) ||
          (f.winner === 'D' && rIds.has(f.warriorIdD));
        if (rivalWon) {
          const loserId = rIds.has(f.warriorIdA) ? f.warriorIdD : f.warriorIdA;
          const winnerId = rIds.has(f.warriorIdA) ? f.warriorIdA : f.warriorIdD;
          const loserFame = state.warriorMap?.get(loserId)?.fame ?? 0;
          const winnerFame = state.warriorMap?.get(winnerId)?.fame ?? 0;
          if (loserFame - winnerFame >= 100) hasUpset = true;
        }
      }

      if (!hasKill && !hasUpset) continue;

      const existing = grudges.find(
        (g) =>
          (g.ownerIdA === r.owner.id && g.ownerIdB === state.player.id) ||
          (g.ownerIdB === r.owner.id && g.ownerIdA === state.player.id)
      );

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
        grudges.push({
          id: `grudge_${r.owner.id}_${state.player.id}` as import('@/types/shared.types').GrudgeId,
          ownerIdA: r.owner.id,
          ownerIdB: state.player.id,
          intensity: hasKill ? 2 : 1,
          reason: hasKill
            ? `${r.owner.stableName} suffered a kill at the player's hands`
            : `${r.owner.stableName} was humiliated by an underdog defeat`,
          startWeek: state.week,
          lastEscalation: state.week,
        });
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
