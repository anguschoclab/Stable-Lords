/**
 * Training System — attribute improvement between rounds
 *
 * Each warrior assigned to training has a chance to gain +1 in their
 * selected attribute when the week advances. Gains are capped at
 * ATTRIBUTE_MAX (25), the per-warrior potential ceiling, and the total
 * across all attributes stays ≤ 80.
 *
 * Diminishing returns apply as attributes approach their potential ceiling.
 */
import type { GameState, TrainingAssignment } from "@/types/game";
import { ATTRIBUTE_KEYS, ATTRIBUTE_MAX } from "@/types/game";
import { computeWarriorStats } from "@/engine/skillCalc";
import { canGrow, diminishingReturnsFactor } from "@/engine/potential";

const TOTAL_CAP = 80; // max sum of all attributes after training
const BASE_GAIN_CHANCE = 0.55; // 55% chance per week

/** Process all training assignments at week-end. Returns updated state with cleared assignments. */
export function processTraining(state: GameState): GameState {
  if (!state.trainingAssignments || state.trainingAssignments.length === 0) return state;

  const gains: { warriorId: string; attr: string; newVal: number; nearCeiling?: boolean }[] = [];
  let roster = [...state.roster];

  for (const assignment of state.trainingAssignments) {
    const wIdx = roster.findIndex((w) => w.id === assignment.warriorId);
    if (wIdx === -1) continue;

    const warrior = roster[wIdx];
    const currentVal = warrior.attributes[assignment.attribute];
    const potentialVal = warrior.potential?.[assignment.attribute];
    const total = ATTRIBUTE_KEYS.reduce((sum, k) => sum + warrior.attributes[k], 0);

    // Can't train beyond caps or potential ceiling
    if (currentVal >= ATTRIBUTE_MAX || total >= TOTAL_CAP) continue;
    if (!canGrow(currentVal, potentialVal)) continue;

    // Apply diminishing returns near potential ceiling
    const drFactor = diminishingReturnsFactor(currentVal, potentialVal);
    const effectiveChance = BASE_GAIN_CHANCE * drFactor;

    // Roll for gain
    if (Math.random() < effectiveChance) {
      const newAttrs = { ...warrior.attributes, [assignment.attribute]: currentVal + 1 };
      const { baseSkills, derivedStats } = computeWarriorStats(newAttrs, warrior.style);

      roster = roster.map((w, i) =>
        i === wIdx ? { ...w, attributes: newAttrs, baseSkills, derivedStats } : w
      );

      const nearCeiling = potentialVal !== undefined && (currentVal + 1) >= potentialVal;
      gains.push({ warriorId: warrior.id, attr: assignment.attribute, newVal: currentVal + 1, nearCeiling });
    }
  }

  // Build newsletter items for gains
  const trainingNews = gains.map((g) => {
    const w = roster.find((w) => w.id === g.warriorId);
    const ceilingNote = g.nearCeiling ? " (reached potential ceiling)" : "";
    return `${w?.name ?? "A warrior"} improved ${g.attr} to ${g.newVal} through training.${ceilingNote}`;
  });

  const newsletter = trainingNews.length > 0
    ? [
        ...state.newsletter,
        {
          week: state.week,
          title: "Training Report",
          items: trainingNews,
        },
      ]
    : state.newsletter;

  return {
    ...state,
    roster,
    newsletter,
    trainingAssignments: [], // Clear after processing
  };
}
