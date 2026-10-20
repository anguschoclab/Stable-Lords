import type { FightOutcome } from '@/types/combat.types';
import { type FighterState } from '../combat/resolution/types';

type JudgeArchetype = 'Crowd' | 'Technical' | 'Blood';

/** Function signature for a judge archetype scorer. */
type JudgeScorerFn = (fA: FighterState, fD: FighterState) => { scoreA: number; scoreD: number };

/**
 * Strategy map: each judge archetype has its own scoring formula.
 * TypeScript will error if a JudgeArchetype variant is ever added without
 * a corresponding entry here.
 */
const JUDGE_SCORERS: Record<JudgeArchetype, JudgeScorerFn> = {
  // Crowd loves aggression and flashy counters
  Crowd: (fA, fD) => ({
    scoreA: fA.hitsLanded * 1.5 + fA.ripostes * 0.5,
    scoreD: fD.hitsLanded * 1.5 + fD.ripostes * 0.5,
  }),
  // Technical judges reward ripostes and penalize taking hits
  Technical: (fA, fD) => ({
    scoreA: fA.ripostes * 2 - fA.hitsTaken * 0.5,
    scoreD: fD.ripostes * 2 - fD.hitsTaken * 0.5,
  }),
  // Blood judges score by damage dealt (HP stripped from opponent)
  Blood: (fA, fD) => ({
    scoreA: fD.maxHp - fD.hp,
    scoreD: fA.maxHp - fA.hp,
  }),
};

/**
 * Scores a fight from one judge's perspective using their archetype-specific logic.
 *
 * @param archetype - The judge's scoring archetype (Crowd, Technical, or Blood)
 * @param fA - The state of fighter A
 * @param fD - The state of fighter D
 * @returns The label of the fighter favored by the judge ('A' or 'D'), or null for a tie.
 */
function judgeScore(
  archetype: JudgeArchetype,
  fA: FighterState,
  fD: FighterState
): 'A' | 'D' | null {
  const { scoreA, scoreD } = JUDGE_SCORERS[archetype](fA, fD);
  if (scoreA > scoreD + 0.5) return 'A';
  if (scoreD > scoreA + 0.5) return 'D';
  return null;
}

interface DecisionNarrativeArgs {
  _winner: 'A' | 'D';
  _loser: 'A' | 'D';
  winName: string;
  loseName: string;
  fW: FighterState;
  fL: FighterState;
  voteType: 'unanimous' | 'split' | 'overtime';
  dissenter?: string;
}

/**
 * Generates a narrative summary of a judge's decision.
 *
 * @param args._winner -
 * @param args._loser -
 * @param args.winName - The winner's display name
 * @param args.loseName - The loser's display name
 * @param args.fW - The winner's fighter state
 * @param args.fL - The loser's fighter state
 * @param args.voteType - The type of decision (unanimous, split, or overtime)
 * @param args.dissenter -
 * * @returns A formatted narrative string describing the decision
 */
function decisionNarrative(args: DecisionNarrativeArgs): string {
  const { winName, loseName, fW } = args;
  const { fL, voteType, dissenter } = args;
  const hitMargin = fW.hitsLanded - fL.hitsLanded;
  const domination = hitMargin >= 5;
  const close = hitMargin <= 2;
  const dmgDealt = fL.maxHp - fL.hp;
  const dmgTaken = fW.maxHp - fW.hp;

  const prefix = 'Time! ';
  let result: string;

  if (voteType === 'overtime') {
    return `${prefix}After a grinding overtime exchange, ${winName} edges out the win by the slimmest of margins.`;
  }

  if (domination) {
    const verb = voteType === 'unanimous' ? 'dominates' : 'dominates';
    result = `${winName} ${verb} on points — landing ${hitMargin} more strikes than ${loseName}. All three judges are in agreement.`;
    if (voteType === 'split') {
      result = `${winName} dominates on points, landing ${hitMargin} more strikes. The ${dissenter} judge dissented, but the scorecards tell the story.`;
    }
  } else if (close) {
    if (voteType === 'unanimous') {
      result = `${winName} takes a narrow unanimous decision. The margin was razor-thin — ${dmgDealt} damage dealt to ${dmgTaken} taken.`;
    } else {
      result = `${winName} scrapes out a split decision. The ${dissenter} judge saw it for ${loseName}, but the majority sided with ${winName}.`;
    }
  } else {
    if (voteType === 'unanimous') {
      result = `${winName} wins a clear unanimous decision on points, outworking ${loseName} over the distance.`;
    } else {
      result = `${winName} wins a split decision on points. The ${dissenter} judge sided with ${loseName}, but ${winName} controlled enough of the fight.`;
    }
  }

  return prefix + result;
}

interface ResolveOvertimeOrTiebreakerArgs {
  fA: FighterState;
  fD: FighterState;
  nameA: string;
  nameD: string;
  aVotes: number;
  dVotes: number;
  rng?: () => number;
}

/**
 * Resolves a fight that reached the time limit.
 * Three judges with different archetypes score the bout.
 * Close (1-1-1 with ties) triggers an overtime exchange via rng.
 */
/** Rolls the overtime exchange, weighting the winner by remaining HP share. */
function overtimeRoll(args: ResolveOvertimeOrTiebreakerArgs): {
  winner: 'A' | 'D' | null;
  by: FightOutcome['by'];
  narrative: string;
} | null {
  const { fA, fD, nameA, nameD, rng } = args;
  if (!rng) return null;
  const hpA = fA.hp / fA.maxHp;
  const hpD = fD.hp / fD.maxHp;
  const total = hpA + hpD;
  if (total <= 0) return null;
  const aWins = rng() < hpA / total;
  const winner = aWins ? 'A' : 'D';
  return {
    winner,
    by: 'Decision',
    narrative: decisionNarrative({
      _winner: winner,
      _loser: aWins ? 'D' : 'A',
      winName: aWins ? nameA : nameD,
      loseName: aWins ? nameD : nameA,
      fW: aWins ? fA : fD,
      fL: aWins ? fD : fA,
      voteType: 'overtime',
    }),
  };
}

/** Breaks an unresolved contest on raw HP remaining; dead-even HP is a draw. */
function hpTiebreaker(
  fA: FighterState,
  fD: FighterState,
  nameA: string,
  nameD: string
): { winner: 'A' | 'D' | null; by: FightOutcome['by']; narrative: string } {
  if (fA.hp > fD.hp) {
    return {
      winner: 'A',
      by: 'Decision',
      narrative: `Time! ${nameA} wins on the narrowest of margins — bleeding less than their opponent.`,
    };
  }
  if (fD.hp > fA.hp) {
    return {
      winner: 'D',
      by: 'Decision',
      narrative: `Time! ${nameD} wins on the narrowest of margins — bleeding less than their opponent.`,
    };
  }
  return { winner: null, by: 'Draw', narrative: `Time! The Arenamaster declares a draw.` };
}

/**
 * Helper to resolve the overtime exchange or HP-based tiebreaker when judges cannot agree.
 */
function resolveOvertimeOrTiebreaker(args: ResolveOvertimeOrTiebreakerArgs): {
  winner: 'A' | 'D' | null;
  by: FightOutcome['by'];
  narrative: string;
} {
  const { fA, fD, nameA, nameD, aVotes } = args;
  const { dVotes } = args;

  // ── Contested / overtime ──
  const rolled = overtimeRoll(args);
  if (rolled) return rolled;

  // Pure draw fallback
  if (aVotes === 1 && dVotes === 1) {
    return {
      winner: null,
      by: 'Draw',
      narrative: `Time! The judges are divided. The Arenamaster rules a draw.`,
    };
  }

  // Tiebreaker by raw HP remaining
  return hpTiebreaker(fA, fD, nameA, nameD);
}

interface MajorityDecisionArgs {
  winner: 'A' | 'D';
  voteType: 'unanimous' | 'split';
  votes: ('A' | 'D' | null)[];
  archetypes: JudgeArchetype[];
  fA: FighterState;
  fD: FighterState;
  nameA: string;
  nameD: string;
}

/** Emits the verdict for a fighter carrying a majority of the judges' cards. */
function majorityDecision(args: MajorityDecisionArgs): {
  winner: 'A' | 'D' | null;
  by: FightOutcome['by'];
  narrative: string;
} {
  const { winner, voteType, votes, archetypes, fA, fD, nameA, nameD } = args;
  const isA = winner === 'A';
  let dissenter: string | undefined;
  if (voteType === 'split') {
    const other = isA ? 'D' : 'A';
    const dissentIdx = votes.indexOf(other) >= 0 ? votes.indexOf(other) : votes.indexOf(null);
    dissenter = dissentIdx >= 0 ? archetypes[dissentIdx] : 'Blood';
  }
  return {
    winner,
    by: 'Decision',
    narrative: decisionNarrative({
      _winner: winner,
      _loser: isA ? 'D' : 'A',
      winName: isA ? nameA : nameD,
      loseName: isA ? nameD : nameA,
      fW: isA ? fA : fD,
      fL: isA ? fD : fA,
      voteType,
      dissenter,
    }),
  };
}

/**
 * Resolves a fight that reached the time limit.
 * Three judges with different archetypes score the bout.
 * Close (1-1-1 with ties) triggers an overtime exchange via rng.
 */
export function resolveDecision(
  fA: FighterState,
  fD: FighterState,
  nameA: string,
  nameD: string,
  rng?: () => number
): { winner: 'A' | 'D' | null; by: FightOutcome['by']; narrative: string } {
  const archetypes: JudgeArchetype[] = ['Crowd', 'Technical', 'Blood'];
  const votes = archetypes.map((a) => judgeScore(a, fA, fD));

  const { aVotes, dVotes } = votes.reduce(
    (acc, v) => {
      if (v === 'A') acc.aVotes++;
      if (v === 'D') acc.dVotes++;
      return acc;
    },
    { aVotes: 0, dVotes: 0 }
  );

  const base = { votes, archetypes, fA, fD, nameA, nameD };

  // ── Unanimous ──
  if (aVotes === 3) return majorityDecision({ ...base, winner: 'A', voteType: 'unanimous' });
  if (dVotes === 3) return majorityDecision({ ...base, winner: 'D', voteType: 'unanimous' });

  // ── Split 2-1 ──
  if (aVotes === 2) return majorityDecision({ ...base, winner: 'A', voteType: 'split' });
  if (dVotes === 2) return majorityDecision({ ...base, winner: 'D', voteType: 'split' });

  // ── Contested / overtime / HP Tiebreaker ──
  return resolveOvertimeOrTiebreaker({
    fA: fA,
    fD: fD,
    nameA: nameA,
    nameD: nameD,
    aVotes: aVotes,
    dVotes: dVotes,
    rng: rng,
  });
}
