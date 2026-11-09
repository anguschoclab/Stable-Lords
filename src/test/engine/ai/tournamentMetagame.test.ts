// @vitest-environment node
import { describe, it, expect } from 'vitest';
import {
  planTournamentEntries,
  processTournamentPrep,
} from '@/engine/ai/workers/tournamentWorker';
import {
  makeTournamentRival,
  makeTournamentWarrior,
  makeTournamentBaseState,
  TOURNEY_RIVAL_ID,
} from '@/test/_fixtures/tournamentState';
import { STABLE_CLASS_ENTRY_CAP } from '@/engine/matchmaking/tournamentSelection/classes';

const w = (id: string, fe: number) =>
  makeTournamentWarrior(id, `Warrior ${id}`, undefined, TOURNEY_RIVAL_ID, {
    fightEquivalents: fe,
  });

const campaignRival = (roster: ReturnType<typeof w>[]) => ({
  ...makeTournamentRival(roster),
  strategy: { intent: 'TOURNAMENT_CAMPAIGN' as const, planWeeksRemaining: 4 },
  trainingAssignments: [],
});

describe('planTournamentEntries — AI declarations', () => {
  it('declares up to the stable cap per class, spread across classes', () => {
    const roster = [
      ...Array.from({ length: 6 }, (_, i) => w(`rk${i}`, 0)), // 6 rookies
      ...Array.from({ length: 3 }, (_, i) => w(`ap${i}`, 2)), // 3 apprentices
    ];
    const rival = campaignRival(roster);
    const state = makeTournamentBaseState(9);
    const { updatedRival } = planTournamentEntries(rival, 10, state);
    const ids = updatedRival.tournamentEntryIds ?? [];
    const declared = new Set(ids);
    // ≤4 declared per class
    const rookieDecl = roster.filter((x) => x.id.startsWith('rk') && declared.has(x.id));
    const apprenticeDecl = roster.filter((x) => x.id.startsWith('ap') && declared.has(x.id));
    expect(rookieDecl.length).toBeLessThanOrEqual(STABLE_CLASS_ENTRY_CAP);
    expect(rookieDecl.length).toBeGreaterThan(0);
    expect(apprenticeDecl.length).toBeLessThanOrEqual(STABLE_CLASS_ENTRY_CAP);
    expect(apprenticeDecl.length).toBeGreaterThan(0);
  });

  it('is deterministic — identical inputs declare identical warriors', () => {
    const roster = Array.from({ length: 6 }, (_, i) => w(`rk${i}`, 0));
    const state = makeTournamentBaseState(9);
    const a = planTournamentEntries(campaignRival(roster), 10, state).updatedRival;
    const b = planTournamentEntries(campaignRival(roster), 10, state).updatedRival;
    expect(a.tournamentEntryIds).toEqual(b.tournamentEntryIds);
  });

  it('no-ops outside the entry window (calendar gate)', () => {
    const roster = [w('rk0', 0)];
    const state = makeTournamentBaseState(2); // no tournament within the prep window
    const { updatedRival } = planTournamentEntries(campaignRival(roster), 3, state);
    expect(updatedRival.tournamentEntryIds ?? []).toHaveLength(0);
  });
});

describe('processTournamentPrep — calendar gating', () => {
  it('does NOT rest contenders when no tournament is near (prep must be calendar-gated)', () => {
    const roster = [w('a', 0), w('b', 0)];
    const state = makeTournamentBaseState(3); // week 3 — seasonal is at week 10
    const { updatedRival } = processTournamentPrep(campaignRival(roster), 3, state);
    expect(updatedRival.trainingAssignments).toHaveLength(0);
  });

  it('rests top contenders inside the taper window', () => {
    const roster = [w('a', 0), w('b', 0)];
    const state = makeTournamentBaseState(9);
    const { updatedRival } = processTournamentPrep(campaignRival(roster), 9, state);
    expect(updatedRival.trainingAssignments.length).toBeGreaterThan(0);
  });
});
