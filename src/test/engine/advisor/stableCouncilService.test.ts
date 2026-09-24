import { describe, it, expect } from 'vitest';
import {
  buildStableCouncilReport,
  computeStableCouncilReport,
} from '@/engine/advisor/stableCouncilService';
import { FightingStyle } from '@/types/shared.types';
import type { Warrior } from '@/types/warrior.types';
import type { GameState, BoutOffer } from '@/types/state.types';

const mkWarrior = (id: string, over: Partial<Warrior> = {}): Warrior => ({
  id: id as any,
  name: `Warrior_${id}`,
  style: FightingStyle.LungingAttack,
  attributes: { ST: 14, CN: 14, SZ: 11, WT: 12, WL: 11, SP: 14, DF: 11 },
  fame: 50,
  popularity: 20,
  titles: [],
  injuries: [],
  flair: [],
  career: { wins: 4, losses: 1, kills: 0 },
  champion: false,
  status: 'Active',
  traits: [],
  ...over,
});

const mkOffer = (id: string, widA: string, widB: string, purse = 200): BoutOffer => ({
  id: id as any,
  promoterId: 'p1' as any,
  warriorIds: [widA as any, widB as any],
  boutWeek: 6,
  createdAbsoluteWeek: 5,
  expirationWeek: 6,
  purse,
  hype: 10,
  status: 'Proposed',
  responses: { [widA]: 'Pending', [widB]: 'Pending' } as any,
});

describe('buildStableCouncilReport', () => {
  it('aggregates roster into complete council cards and stable summary', () => {
    const w1 = mkWarrior('w1', { style: FightingStyle.AimedBlow });
    const w2 = mkWarrior('w2', {
      injuries: [
        {
          id: 'i1' as any,
          name: 'Fracture',
          description: '',
          severity: 'Moderate',
          weeksRemaining: 2,
          penalties: {},
        },
      ],
    });
    const rival = mkWarrior('r1', { style: FightingStyle.WallOfSteel });
    const offer = mkOffer('off_1', 'w1', 'r1', 220);

    const state = {
      week: 5,
      absoluteWeek: 5,
      year: 1,
      season: 'Spring',
      weather: 'Clear',
      roster: [w1, w2],
      rivals: [{ id: 'rival_stable', roster: [rival], owner: { stableName: 'Rivals' } }],
      boutOffers: { off_1: offer },
      trainingAssignments: [],
      realmRankings: {
        w1: { overallRank: 40, classRank: 3, compositeScore: 180 },
      },
      tournaments: [],
      isTournamentWeek: false,
    } as unknown as GameState;

    const report = buildStableCouncilReport(state);

    expect(report.cards).toHaveLength(2);
    expect(report.summary.totalWarriors).toBe(2);
    expect(report.summary.combatReadyCount).toBe(1); // w1 has offer
    expect(report.summary.rehabCount).toBe(1); // w2 is injured
    expect(report.summary.tournamentContenderCount).toBe(1); // w1 is rank 40
    expect(report.summary.unassignedTrainingCount).toBe(2);
    expect(report.summary.projectedPurseGold).toBe(220);
    expect(report.summary.projectedTrainingCost).toBe(40); // 2 * 20
    expect(report.summary.stableDirectives.length).toBeGreaterThan(0);
    expect(report.summary.allActionPayloads).toHaveLength(2);

    // Verify action payload for w1 — a warrior booked to fight is NOT given a
    // training assignment: the bout is their week, and holding an assignment
    // would make them unbookable (isBookable excludes assigned warriors).
    const p1 = report.summary.allActionPayloads.find((p) => p.warriorId === 'w1');
    expect(p1).toBeDefined();
    expect(p1!.boutOfferIdToAccept).toBe('off_1');
    expect(p1!.trainingAssignment).toBeUndefined();
    expect(p1!.tacticsPlanPatch?.offensiveTactic).toBeDefined();
    expect(p1!.tacticsPlanPatch?.defensiveTactic).toBeDefined();

    // Verify action payload for w2 (rehab warrior)
    const p2 = report.summary.allActionPayloads.find((p) => p.warriorId === 'w2');
    expect(p2).toBeDefined();
    expect(p2!.boutOfferIdToAccept).toBeUndefined(); // no bout accepted for injured
    expect(p2!.trainingAssignment?.type).toBe('recovery');
    expect(p2!.tacticsPlanPatch?.fallbackCondition).toBe('YIELD');
  });

  it('keeps suggestedCampaignFocus independent when a pin diverges from auto-detection', () => {
    // Pinned REHABILITATION on an otherwise healthy prime warrior (age 24,
    // 10 career bouts, unranked, week 5 of season) — auto-detect would pick
    // PURSE_HUNTER, so the card must surface the divergence.
    const w = mkWarrior('w3', {
      campaignFocus: 'REHABILITATION',
      age: 24,
      career: { wins: 6, losses: 4, kills: 0 },
    });

    const state = {
      week: 5,
      absoluteWeek: 5,
      year: 1,
      season: 'Spring',
      weather: 'Clear',
      roster: [w],
      rivals: [],
      boutOffers: {},
      trainingAssignments: [],
      realmRankings: {},
      tournaments: [],
      isTournamentWeek: false,
    } as unknown as GameState;

    const report = buildStableCouncilReport(state);
    const card = report.cards[0]!;

    expect(card.campaignFocus).toBe('REHABILITATION');
    expect(card.suggestedCampaignFocus).toBe('PURSE_HUNTER');
  });

  it('memoizes reports per state snapshot so concurrent subscribers share one computation', () => {
    const w = mkWarrior('w9');
    const state = {
      week: 5,
      absoluteWeek: 5,
      year: 1,
      season: 'Spring',
      weather: 'Clear',
      roster: [w],
      rivals: [],
      boutOffers: {},
      trainingAssignments: [],
      realmRankings: {},
      tournaments: [],
      isTournamentWeek: false,
    } as unknown as GameState;

    const first = buildStableCouncilReport(state);
    const second = buildStableCouncilReport(state);
    expect(second).toBe(first); // same state ref → same report object

    // A fresh snapshot (any store change mints a new GameState via
    // reconstructGameState) must recompute rather than serve the cache.
    const next = buildStableCouncilReport({ ...state });
    expect(next).not.toBe(first);
    expect(next.summary.totalWarriors).toBe(1);
  });

  it('computeStableCouncilReport is uncached and safe for in-place mutated state', () => {
    // Autosim advances weeks via mutableInput — the same GameState object is
    // mutated in place, so engine-side callers must bypass the ref-keyed cache.
    const w = mkWarrior('w10');
    const state = {
      week: 5,
      absoluteWeek: 5,
      year: 1,
      season: 'Spring',
      weather: 'Clear',
      roster: [w],
      rivals: [],
      boutOffers: {},
      trainingAssignments: [],
      realmRankings: {},
      tournaments: [],
      isTournamentWeek: false,
    } as unknown as GameState;

    const before = computeStableCouncilReport(state);
    expect(before.summary.rehabCount).toBe(0);

    (state.roster[0] as Warrior).fatigue = 55; // in-place mutation, same refs
    const after = computeStableCouncilReport(state);
    expect(after.summary.rehabCount).toBe(1);
  });

  it('surfaces treasury solvency — directives and warning when projected costs exceed funds', () => {
    const roster = [mkWarrior('s1'), mkWarrior('s2'), mkWarrior('s3')];
    const state = {
      week: 5,
      absoluteWeek: 5,
      year: 1,
      season: 'Spring',
      weather: 'Clear',
      roster,
      rivals: [],
      boutOffers: {},
      trainingAssignments: [],
      realmRankings: {},
      tournaments: [],
      isTournamentWeek: false,
      treasury: 10, // projected training = 3 * 20 = 60
    } as unknown as GameState;

    const report = buildStableCouncilReport(state);
    expect(report.summary.treasury).toBe(10);
    expect(report.summary.solvencyWarning).toBeDefined();
    expect(
      report.summary.stableDirectives.some((d) => /treasury|insolven|afford/i.test(d))
    ).toBe(true);
  });

  describe('unresolvedDirectives — pre-advance checklist', () => {
    const mkBase = (over: Record<string, unknown> = {}): GameState =>
      ({
        week: 5,
        absoluteWeek: 5,
        year: 1,
        season: 'Spring',
        weather: 'Clear',
        roster: [],
        rivals: [],
        boutOffers: {},
        trainingAssignments: [],
        realmRankings: {},
        tournaments: [],
        isTournamentWeek: false,
        treasury: 5000,
        ...over,
      }) as unknown as GameState;

    it('flags a recommended offer whose player signature is still pending', () => {
      const w = mkWarrior('w1', { style: FightingStyle.AimedBlow });
      const rival = mkWarrior('r1', { style: FightingStyle.WallOfSteel });
      const offer = mkOffer('off_1', 'w1', 'r1', 220); // boutWeek 6 = absWeek+1, w1 Pending
      const state = mkBase({
        roster: [w],
        rivals: [{ id: 'rs', roster: [rival] }],
        boutOffers: { off_1: offer },
      });

      const report = computeStableCouncilReport(state);
      const item = report.unresolvedDirectives.find(
        (d) => d.kind === 'unsigned-offer' && d.warriorId === 'w1'
      );
      expect(item).toBeDefined();
      expect(item!.label).toContain('Warrior_r1');
    });

    it('clears the unsigned-offer item once the player response is Accepted', () => {
      const w = mkWarrior('w1', { style: FightingStyle.AimedBlow });
      const rival = mkWarrior('r1', { style: FightingStyle.WallOfSteel });
      const offer = mkOffer('off_1', 'w1', 'r1', 220);
      offer.responses = { w1: 'Accepted', r1: 'Accepted' } as any;
      offer.status = 'Signed';
      const state = mkBase({
        roster: [w],
        rivals: [{ id: 'rs', roster: [rival] }],
        boutOffers: { off_1: offer },
      });

      const report = computeStableCouncilReport(state);
      expect(
        report.unresolvedDirectives.some((d) => d.kind === 'unsigned-offer')
      ).toBe(false);
    });

    it('flags warriors with a recommended assignment not yet on the board', () => {
      const w = mkWarrior('w2', { age: 19, career: { wins: 1, losses: 0, kills: 0 } });
      const state = mkBase({ roster: [w] });

      const report = computeStableCouncilReport(state);
      expect(
        report.unresolvedDirectives.some(
          (d) => d.kind === 'unassigned-training' && d.warriorId === 'w2'
        )
      ).toBe(true);

      const withAssignment = mkBase({
        roster: [w],
        trainingAssignments: [
          { warriorId: 'w2' as any, type: 'attribute', attribute: 'ST' },
        ],
      });
      const resolved = computeStableCouncilReport(withAssignment);
      expect(
        resolved.unresolvedDirectives.some(
          (d) => d.kind === 'unassigned-training' && d.warriorId === 'w2'
        )
      ).toBe(false);
    });

    it('flags unapplied tactics only for warriors fighting this week', () => {
      // w1 has an accepted offer → fight week; w3 is a dev prospect with no bout.
      const w = mkWarrior('w1', { style: FightingStyle.AimedBlow });
      const w3 = mkWarrior('w3', { age: 19, career: { wins: 1, losses: 0, kills: 0 } });
      const rival = mkWarrior('r1', { style: FightingStyle.WallOfSteel });
      const offer = mkOffer('off_1', 'w1', 'r1', 220);
      offer.responses = { w1: 'Accepted', r1: 'Accepted' } as any;
      offer.status = 'Signed';
      const state = mkBase({
        roster: [w, w3],
        rivals: [{ id: 'rs', roster: [rival] }],
        boutOffers: { off_1: offer },
      });

      const report = computeStableCouncilReport(state);
      const fighting = report.unresolvedDirectives.filter(
        (d) => d.kind === 'unapplied-tactics'
      );
      expect(fighting.some((d) => d.warriorId === 'w1')).toBe(true);
      expect(fighting.some((d) => d.warriorId === 'w3')).toBe(false);
    });
  });

  describe('lookahead — multi-week campaign horizon', () => {
    const mkBase = (over: Record<string, unknown> = {}): GameState =>
      ({
        week: 5,
        absoluteWeek: 5,
        year: 1,
        season: 'Spring',
        weather: 'Clear',
        roster: [],
        rivals: [],
        boutOffers: {},
        trainingAssignments: [],
        realmRankings: {},
        tournaments: [],
        isTournamentWeek: false,
        treasury: 5000,
        ...over,
      }) as unknown as GameState;

    it('lists signed bouts committed beyond the upcoming week', () => {
      const w = mkWarrior('w1');
      const rival = mkWarrior('r1');
      const future = mkOffer('off_future', 'w1', 'r1', 300);
      future.boutWeek = 8; // absoluteWeek 8 vs current 5 → beyond next week
      future.status = 'Signed';
      future.responses = { w1: 'Accepted', r1: 'Accepted' } as any;
      const state = mkBase({
        roster: [w],
        rivals: [{ id: 'rs', roster: [rival] }],
        boutOffers: { off_future: future },
      });

      const report = computeStableCouncilReport(state);
      expect(report.lookahead.futureCommitments).toHaveLength(1);
      const c = report.lookahead.futureCommitments[0]!;
      expect(c.warriorId).toBe('w1');
      expect(c.opponentName).toBe('Warrior_r1');
      expect(c.absoluteWeek).toBe(8);
      expect(c.purse).toBe(300);
    });

    it('ignores rival-only bouts and offers already resolved this week', () => {
      const w = mkWarrior('w1');
      const rival = mkWarrior('r1');
      const rival2 = mkWarrior('r2');
      const rivalOnly = mkOffer('off_rv', 'r1', 'r2', 100);
      rivalOnly.boutWeek = 9;
      rivalOnly.status = 'Signed';
      const thisWeek = mkOffer('off_now', 'w1', 'r1', 100);
      thisWeek.boutWeek = 6; // absWeek+1 — the imminent bout, not a lookahead item
      thisWeek.status = 'Signed';
      const state = mkBase({
        roster: [w],
        rivals: [{ id: 'rs', roster: [rival, rival2] }],
        boutOffers: { off_rv: rivalOnly, off_now: thisWeek },
      });

      const report = computeStableCouncilReport(state);
      expect(report.lookahead.futureCommitments).toHaveLength(0);
    });

    it('projects injury recovery ETAs in absolute weeks', () => {
      const w = mkWarrior('w1', {
        injuries: [
          {
            id: 'i1' as any,
            name: 'Fracture',
            description: '',
            severity: 'Severe',
            weeksRemaining: 3,
            penalties: {},
          },
        ],
      });
      const state = mkBase({ roster: [w] });

      const report = computeStableCouncilReport(state);
      expect(report.lookahead.recoveryEtas).toHaveLength(1);
      expect(report.lookahead.recoveryEtas[0]!.warriorId).toBe('w1');
      expect(report.lookahead.recoveryEtas[0]!.weeksRemaining).toBe(3);
      expect(report.lookahead.recoveryEtas[0]!.returnsAbsoluteWeek).toBe(8); // 5 + 3
    });

    it('counts down to the seasonal tournament and lists projected contenders', () => {
      const w = mkWarrior('w1');
      const state = mkBase({
        roster: [w],
        realmRankings: { w1: { overallRank: 40, classRank: 3, compositeScore: 180 } },
      });

      const report = computeStableCouncilReport(state);
      // Week 5 of a 13-week season → 8 weeks until the week-13 bracket
      expect(report.lookahead.weeksUntilTournament).toBe(8);
      expect(report.lookahead.projectedContenders).toHaveLength(1);
      expect(report.lookahead.projectedContenders[0]!.warriorId).toBe('w1');
      expect(report.lookahead.projectedContenders[0]!.tierName).toBeTruthy();
    });

    it('reports 0 weeks during a live tournament week regardless of calendar week', () => {
      const w = mkWarrior('w1');
      // Tournament weeks advance day-by-day; isTournamentWeek is authoritative
      // (matching evaluateTournamentAdvice) even when the calendar week isn't 13.
      const state = mkBase({ week: 31, absoluteWeek: 31, roster: [w], isTournamentWeek: true });

      const report = computeStableCouncilReport(state);
      expect(report.lookahead.weeksUntilTournament).toBe(0);
    });
  });

  describe('bookability-aware training payloads', () => {
    // isBookable() excludes warriors holding any trainingAssignment — so a
    // council that assigns training to everyone every week makes the roster
    // permanently unchallengable. Fight-focused warriors with no viable offer
    // must stay unassigned so promoters/challengers can book them next week.
    const bareState = (warriors: Warrior[]): GameState =>
      ({
        week: 5,
        absoluteWeek: 5,
        year: 1,
        season: 'Spring',
        weather: 'Clear',
        roster: warriors,
        rivals: [],
        boutOffers: {},
        trainingAssignments: [],
        realmRankings: {},
        tournaments: [],
        isTournamentWeek: false,
        treasury: 5000,
      }) as unknown as GameState;

    it('omits the training assignment for a PURSE_HUNTER with no viable offers', () => {
      // age 24 + 10 career bouts + unranked → PURSE_HUNTER
      const w = mkWarrior('ph1', { age: 24, career: { wins: 6, losses: 4, kills: 0 } });
      const report = computeStableCouncilReport(bareState([w]));
      const card = report.cards[0]!;
      expect(card.campaignFocus).toBe('PURSE_HUNTER');
      expect(card.fightAdvice.action).toBe('NO_VIABLE_OFFERS');
      expect(card.actionPayload.trainingAssignment).toBeUndefined();
    });

    it('still assigns attribute training to a PROSPECT_DEV warrior with no offers', () => {
      // young + <5 career bouts → PROSPECT_DEV (development is the week's purpose)
      const w = mkWarrior('pd1', { age: 19, career: { wins: 1, losses: 0, kills: 0 } });
      const report = computeStableCouncilReport(bareState([w]));
      const card = report.cards[0]!;
      expect(card.campaignFocus).toBe('PROSPECT_DEV');
      expect(card.actionPayload.trainingAssignment?.type).toBe('attribute');
    });

    it('keeps recovery assignment for injured warriors regardless of focus', () => {
      const w = mkWarrior('inj1', {
        age: 24,
        career: { wins: 6, losses: 4, kills: 0 },
        injuries: [
          {
            id: 'i1' as any,
            name: 'Fracture',
            description: '',
            severity: 'Severe',
            weeksRemaining: 2,
            penalties: {},
          },
        ],
      });
      const report = computeStableCouncilReport(bareState([w]));
      const card = report.cards[0]!;
      expect(card.campaignFocus).toBe('REHABILITATION');
      expect(card.actionPayload.trainingAssignment?.type).toBe('recovery');
    });
  });
});
