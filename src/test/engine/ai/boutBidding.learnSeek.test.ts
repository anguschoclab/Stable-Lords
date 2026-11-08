/**
 * Learn-seek teach bonus — "How To Make a Loser Win" matchmaking: a warrior
 * whose learn ledger shows a suspected favorite should seek opponents whose
 * STYLE teaches that skill (the opponent is the textbook).
 */
import { describe, it, expect } from 'vitest';
import { learningSeekBonus } from '@/engine/ai/workers/competitionWorker/boutBidding/conversion';
import { makeWarrior, makeRival, makeOwner } from '@/test/_fixtures/factories';
import { FightingStyle } from '@/types/shared.types';
import { STYLE_LEARN_WEIGHTS } from '@/data/learnPriorities';
import { AI_LEARN_TEACH_BONUS, AI_LEARN_TEACH_WEIGHT_MIN } from '@/constants/ai';

const studious = () => makeRival({ owner: makeOwner({ personality: 'Methodical' }) });

describe('learningSeekBonus — teach matchup', () => {
  it('adds a bonus when the candidate teaches the suspected favorite learn', () => {
    // This warrior keeps learning INI (4 ≥ LEARN_SUSPECT_MIN) → suspected INI.
    const proposer = makeWarrior({
      career: { wins: 2, losses: 3, kills: 0 },
      learnedSkills: { INI: 4 },
    });
    // Lunging Attack's INI weight is 6 — a natural INI teacher.
    expect(STYLE_LEARN_WEIGHTS[FightingStyle.LungingAttack].INI).toBeGreaterThanOrEqual(
      AI_LEARN_TEACH_WEIGHT_MIN
    );
    const teacher = makeWarrior({
      style: FightingStyle.LungingAttack,
      career: { wins: 8, losses: 4, kills: 0 },
    });
    const bystander = makeWarrior({
      style: FightingStyle.AimedBlow, // INI weight 1 — teaches it poorly
      career: { wins: 8, losses: 4, kills: 0 },
    });

    const teach = learningSeekBonus(proposer, teacher, studious());
    const noTeach = learningSeekBonus(proposer, bystander, studious());
    expect(teach - noTeach).toBe(AI_LEARN_TEACH_BONUS);
  });

  it('adds nothing when the warrior has no suspected favorite learn', () => {
    const proposer = makeWarrior({
      career: { wins: 2, losses: 3, kills: 0 },
      learnedSkills: { INI: 1 }, // below suspicion threshold
    });
    const teacher = makeWarrior({
      style: FightingStyle.LungingAttack,
      career: { wins: 8, losses: 4, kills: 0 },
    });
    const base = learningSeekBonus(
      { ...proposer, learnedSkills: { INI: 0 } },
      teacher,
      studious()
    );
    expect(learningSeekBonus(proposer, teacher, studious())).toBe(base);
  });
});
