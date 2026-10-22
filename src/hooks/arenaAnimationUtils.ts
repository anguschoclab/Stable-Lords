import type { FighterPose, SpeechBubble, ArenaState } from '@/types/arena.types';
import type { MinuteEvent } from '@/types/combat.types';
import { classifyEvent } from '@/lib/boutUtils';

const MIN_DISTANCE = 20; // Minimum distance between fighters

const DEFAULT_POSE_A: FighterPose = {
  x: 25,
  y: 0,
  facing: 'right',
  stance: 'neutral',
};

const DEFAULT_POSE_D: FighterPose = {
  x: 75,
  y: 0,
  facing: 'left',
  stance: 'neutral',
};

/** Fresh arena state: default fighter poses, full health/fatigue, no bubbles. */
export function initialArenaState(maxHpA: number, maxHpD: number): ArenaState {
  return {
    fighterA: { ...DEFAULT_POSE_A },
    fighterD: { ...DEFAULT_POSE_D },
    bubbles: [],
    hpA: maxHpA,
    hpD: maxHpD,
    fpA: 100,
    fpD: 100,
  };
}

/** Apply end-of-bout stances: winner victorious, loser defeated and lowered. */
export function applyVictoryPoses(prev: ArenaState, winner: 'A' | 'D'): ArenaState {
  return {
    ...prev,
    fighterA: {
      ...prev.fighterA,
      stance: winner === 'A' ? 'victorious' : 'defeated',
      y: winner === 'A' ? 0 : 15,
    },
    fighterD: {
      ...prev.fighterD,
      stance: winner === 'D' ? 'victorious' : 'defeated',
      y: winner === 'D' ? 0 : 15,
    },
  };
}

/** Append a speech bubble, assigning it a fresh id. */
export function appendBubble(prev: ArenaState, bubble: Omit<SpeechBubble, 'id'>): ArenaState {
  return {
    ...prev,
    bubbles: [...prev.bubbles, { ...bubble, id: `bubble-${crypto.randomUUID()}` }],
  };
}

/** Drop a speech bubble by id. */
export function removeBubbleById(prev: ArenaState, id: string): ArenaState {
  return { ...prev, bubbles: prev.bubbles.filter((b) => b.id !== id) };
}

/** Merge a partial pose patch onto one fighter. */
export function patchFighterPose(
  prev: ArenaState,
  fighter: 'A' | 'D',
  pose: Partial<FighterPose>
): ArenaState {
  const key = fighter === 'A' ? 'fighterA' : 'fighterD';
  return { ...prev, [key]: { ...prev[key], ...pose } };
}

/**
 *
 */
function getBubbleFromEvent(event: MinuteEvent, index: number): SpeechBubble | null {
  const type = classifyEvent(event);

  // Check for taunt-worthy events
  if (type === 'crit' || type === 'death') {
    const speaker = event.text.toLowerCase().includes('hit') ? 'A' : 'D';
    const isA = speaker === 'A';

    if (type === 'crit') {
      return {
        id: `bubble-${index}`,
        text: isA ? 'A devastating strike!' : 'Incredible counter!',
        speaker,
        duration: 2000,
        type: 'crit',
      };
    }

    if (type === 'death') {
      return {
        id: `bubble-${index}`,
        text: isA ? 'That swing insulted my ancestors!' : 'Pathetic!',
        speaker: isA ? 'D' : 'A', // Taunt from victor
        duration: 3000,
        type: 'death',
      };
    }
  }

  // Taunt lines from certain phrases
  const eventText = event.text.toLowerCase();
  if (eventText.includes('taunt') || eventText.includes('insult')) {
    return {
      id: `bubble-${index}`,
      text: 'You fight like a coward!',
      speaker: 'A',
      duration: 2500,
      type: 'taunt',
    };
  }

  return null;
}

/**
 * Clamp a fighter's movement `amt` pixels in `dir` (+1 right / -1 left),
 * bounded by `cap` (arena edge or midline limit for that side).
 */
function clampMove(x: number, amt: number, dir: 1 | -1, cap: number): number {
  return dir === 1 ? Math.min(x + amt, cap) : Math.max(x - amt, cap);
}

/**
 * Move `mover` `amt` pixels toward the opponent's x, never closer than
 * MIN_DISTANCE. `side` gives the mover's side (A moves right, D moves left).
 */
function toward(x: number, otherX: number, amt: number, side: 'A' | 'D'): number {
  return side === 'A'
    ? Math.min(x + amt, otherX - MIN_DISTANCE)
    : Math.max(x - amt, otherX + MIN_DISTANCE);
}

/** Idle events drift both fighters back toward a neutral 30px separation. */
function driftTowardNeutralSpacing(prev: ArenaState, next: ArenaState): void {
  const targetDist = 30;
  const currentDist = prev.fighterD.x - prev.fighterA.x;
  if (currentDist <= targetDist + 5) return;
  const adjust = (currentDist - targetDist) / 4;
  next.fighterA = {
    ...prev.fighterA,
    x: prev.fighterA.x + adjust * 0.3,
    y: 0,
    stance: prev.fighterA.stance === 'lunging' ? 'neutral' : prev.fighterA.stance,
  };
  next.fighterD = {
    ...prev.fighterD,
    x: prev.fighterD.x - adjust * 0.3,
    y: 0,
    stance: prev.fighterD.stance === 'lunging' ? 'neutral' : prev.fighterD.stance,
  };
}

/**
 * Resolve which fighter acts vs. receives for one event, and build the
 * side-aware patch writer that assigns fighterA/fighterD onto `newState`.
 */
function roleContext(
  prev: ArenaState,
  newState: ArenaState,
  text: string,
  nameA: string,
  nameD: string
) {
  // Determine which fighter is acting
  const isActingA =
    text.includes(nameA?.toLowerCase() ?? '') ||
    (!text.includes(nameD?.toLowerCase() ?? '') &&
      (text.includes('attacks') || text.includes('strikes')));

  const actor: 'A' | 'D' = isActingA ? 'A' : 'D';
  const victim: 'A' | 'D' = actor === 'A' ? 'D' : 'A';
  const dir: 1 | -1 = actor === 'A' ? 1 : -1;

  const att = actor === 'A' ? prev.fighterA : prev.fighterD;
  const vic = actor === 'A' ? prev.fighterD : prev.fighterA;
  const setFighter = (side: 'A' | 'D', patch: Partial<ArenaState['fighterA']>) => {
    if (side === 'A') newState.fighterA = { ...prev.fighterA, ...patch };
    else newState.fighterD = { ...prev.fighterD, ...patch };
  };

  return { actor, victim, dir, att, vic, setFighter };
}

type EventKind = ReturnType<typeof classifyEvent>;
type SetFighter = (side: 'A' | 'D', patch: Partial<FighterPose>) => void;

interface PoseCtx {
  prev: ArenaState;
  event: MinuteEvent;
  text: string;
  nameA: string;
  actor: 'A' | 'D';
  victim: 'A' | 'D';
  dir: 1 | -1;
  att: FighterPose;
  vic: FighterPose;
  setFighter: SetFighter;
}

// Actor lunges forward, victim flinches.
function poseHit(c: PoseCtx) {
  c.setFighter(c.actor, { x: toward(c.att.x, c.vic.x, 8, c.actor), y: -3, stance: 'lunging' });
  c.setFighter(c.victim, {
    x: clampMove(c.vic.x, 2, c.dir, c.dir === 1 ? 95 : 5),
    stance: 'defending',
  });
}

// Actor overextends, victim retreats slightly.
function poseMiss(c: PoseCtx) {
  c.setFighter(c.actor, {
    x: clampMove(c.att.x, 5, c.dir, c.dir === 1 ? 45 : 55),
    stance: 'advancing',
  });
  c.setFighter(c.victim, {
    x: clampMove(c.vic.x, 3, c.dir, c.dir === 1 ? 95 : 5),
    stance: 'retreating',
  });
}

// Both exchange positions — the victim counters back into the actor.
function poseRiposte(c: PoseCtx) {
  c.setFighter(c.actor, { x: toward(c.att.x, c.vic.x, 4, c.actor), stance: 'defending' });
  c.setFighter(c.victim, { x: toward(c.vic.x, c.att.x, 6, c.victim), y: -2, stance: 'lunging' });
}

// Victor stands triumphantly, victim falls.
function poseFinish(c: PoseCtx) {
  c.setFighter(c.victim, { y: 15, stance: 'defeated' });
  c.setFighter(c.actor, { stance: 'victorious' });
}

// Fighter slows down — the named fighter drops to stunned.
function poseExhaust(c: PoseCtx) {
  if (c.text.includes(c.nameA?.toLowerCase() ?? '')) {
    c.setFighter('A', { stance: 'stunned' });
  } else {
    c.setFighter('D', { stance: 'stunned' });
  }
}

// Fighter seizes initiative — advances.
function poseInitiative(c: PoseCtx) {
  c.setFighter(c.actor, { x: toward(c.att.x, c.vic.x, 5, c.actor), stance: 'advancing' });
}

// The named fighter is the one who lost/retrieved the weapon — the disarmed
// drop to a defensive posture; a rearmer darts forward to scoop it back up.
function poseDisarm(c: PoseCtx) {
  const isRearm = c.event.events?.some((e) => e.type === 'REARM');
  c.setFighter(c.actor, isRearm ? { stance: 'advancing' } : { stance: 'defending' });
}

const POSE_HANDLERS: Partial<Record<EventKind, (c: PoseCtx) => void>> = {
  hit: poseHit,
  crit: poseHit,
  miss: poseMiss,
  riposte: poseRiposte,
  death: poseFinish,
  ko: poseFinish,
  exhaust: poseExhaust,
  initiative: poseInitiative,
  disarm: poseDisarm,
};

/**
 * Updates fighter poses for one bout event. The animation is side-mirrored:
 * the actor advances rightward when fighting as A and leftward as D, so each
 * case computes attacker/victim patches via the shared movement helpers and
 * assigns them to fighterA/fighterD by side.
 */
export function processArenaEvent(
  prev: ArenaState,
  event: MinuteEvent,
  index: number,
  nameA: string,
  nameD: string
): ArenaState {
  const type = classifyEvent(event);
  const text = event.text.toLowerCase();
  const newState = { ...prev };
  const roles = roleContext(prev, newState, text, nameA, nameD);

  const handler = POSE_HANDLERS[type];
  if (handler) {
    handler({ prev, event, text, nameA, ...roles });
  } else {
    driftTowardNeutralSpacing(prev, newState);
  }

  // Add speech bubble if appropriate
  const bubble = getBubbleFromEvent(event, index);
  if (bubble) {
    newState.bubbles = [...prev.bubbles, bubble];
  }

  return newState;
}
