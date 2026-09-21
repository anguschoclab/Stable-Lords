/**
 * D.0 — Recruitment unification (G9).
 * `processAIRosterManagement` no longer conjures recruits — it flags
 * `needsRecruit` and `aiDraftFromPool` (via processRecruitment) is the sole
 * signing path. `generateAIRecruit` survives only as the pool-empty fallback,
 * gated by the same checkBudget. Roster caps come from one config source.
 */
import { describe, it, expect } from 'vitest';
import { processAIRosterManagement } from '@/engine/owner/roster/management';
import { processRecruitment } from '@/engine/ai/workers/recruitmentWorker';
import { aiRosterMax, aiRosterMin } from '@/constants/ai';
import {
  makeGameState,
  makeRival,
  makeWarrior,
} from '@/test/_fixtures/factories';
import { SeededRNGService } from '@/utils/random';

describe('recruitment unification', () => {
  it('roster management flags needsRecruit instead of signing a warrior directly', () => {
    const thin = makeRival({
      roster: [makeWarrior(), makeWarrior()],
      treasury: 5000,
    });
    const state = makeGameState({ rivals: [thin] });
    const { updatedRivals } = processAIRosterManagement(state, new SeededRNGService(1));
    const updated = updatedRivals[0]!;
    expect(updated.needsRecruit).toBe(true);
    // No recruit was conjured — roster size unchanged
    expect(updated.roster.length).toBe(thin.roster.length);
  });

  it('a full roster clears the needsRecruit flag', () => {
    const full = makeRival({
      roster: Array.from({ length: 8 }, () => makeWarrior()),
      treasury: 5000,
      needsRecruit: true,
    });
    const state = makeGameState({ rivals: [full] });
    const { updatedRivals } = processAIRosterManagement(state, new SeededRNGService(1));
    expect(updatedRivals[0]!.needsRecruit).toBe(false);
  });

  it('needsRecruit drives drafting: processRecruitment signs when flagged', () => {
    const thin = makeRival({
      roster: [makeWarrior()],
      treasury: 5000,
      needsRecruit: true,
    });
    const pool = [
      {
        id: 'pool-1' as never,
        name: 'Recruit A',
        style: 'BASHING ATTACK' as never,
        attributes: { ST: 10, CN: 10, SZ: 10, WT: 10, WL: 10, SP: 10, DF: 10 },
        potential: { ST: 12, CN: 12, SZ: 12, WT: 12, WL: 12, SP: 12, DF: 12 },
        baseSkills: {} as never,
        derivedStats: {} as never,
        tier: 'Promising' as const,
        age: 19,
        addedWeek: 1,
      },
    ];
    const { updatedRival } = processRecruitment(
      thin,
      pool as never,
      5,
      new SeededRNGService(3),
      false,
      undefined
    );
    expect(updatedRival.roster.length).toBe(2);
    expect(updatedRival.needsRecruit).toBe(false);
  });

  it('pool-empty fallback: generateAIRecruit signs only when affordable', () => {
    const broke = makeRival({
      roster: [makeWarrior()],
      treasury: 100,
      needsRecruit: true,
    });
    const { updatedRival } = processRecruitment(
      broke,
      [],
      5,
      new SeededRNGService(5),
      false,
      undefined
    );
    // checkBudget refuses — reserve floor exceeds treasury
    expect(updatedRival.roster.length).toBe(1);
  });

  it('pool-empty fallback signs a generated recruit when affordable', () => {
    const funded = makeRival({
      roster: [makeWarrior()],
      treasury: 5000,
      needsRecruit: true,
    });
    const { updatedRival } = processRecruitment(
      funded,
      [],
      5,
      new SeededRNGService(7),
      false,
      undefined
    );
    expect(updatedRival.roster.length).toBe(2);
    expect(updatedRival.needsRecruit).toBe(false);
  });

  it('roster caps come from a single config source', () => {
    expect(aiRosterMax('Aggressive')).toBe(10);
    expect(aiRosterMax('Pragmatic')).toBe(8);
    expect(aiRosterMin('Aggressive')).toBe(8);
    expect(aiRosterMin('Showman')).toBe(7);
    expect(aiRosterMin('Pragmatic')).toBe(6);
  });
});
