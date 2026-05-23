import type { FightingStyle } from './game';/**
                                             * Defines the shape of fighter pose.
                                             */


/**
 * Defines the shape of fighter pose.
 */
export interface FighterPose {
  /** Position 0-100 across the arena (left to right) */
  x: number;
  /** Vertical offset for lunges/jumps (-10 to 10) */
  y: number;
  /** Facing direction */
  facing: 'left' | 'right';
  /** Current combat stance */
  stance:
    | 'neutral'
    | 'advancing'
    | 'retreating'
    | 'lunging'
    | 'defending'
    | 'stunned'
    | 'victorious'
    | 'defeated';
}/**
  * Defines the shape of speech bubble.
  */


/**
 * Defines the shape of speech bubble.
 */
export interface SpeechBubble {
  id: string;
  text: string;
  speaker: 'A' | 'D';
  duration: number;
  type: 'taunt' | 'hit' | 'crit' | 'death' | 'victory';
}/**
  * Defines the shape of arena state.
  */


/**
 * Defines the shape of arena state.
 */
export interface ArenaState {
  fighterA: FighterPose;
  fighterD: FighterPose;
  bubbles: SpeechBubble[];
  hpA: number;
  hpD: number;
  fpA: number;
  fpD: number;
}/**
  * Defines the shape of fighter stats.
  */


/**
 * Defines the shape of fighter stats.
 */
export interface FighterStats {
  maxHp: number;
  currentHp: number;
  maxFp: number;
  currentFp: number;
}/**
  * Defines the shape of arena fighter data.
  */


/**
 * Defines the shape of arena fighter data.
 */
export interface ArenaFighterData {
  name: string;
  style: FightingStyle;
  stats: FighterStats;
  isWinner: boolean;
  isDead: boolean;
}
