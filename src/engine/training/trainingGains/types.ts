import type { Attributes } from '@/types/shared.types';

/** One resolved week of training — outcome type plus the player-facing message. */
export interface TrainingResult {
  type: 'gain' | 'injury' | 'recovery' | 'blocked';
  warriorId: string;
  message: string;
  attr?: keyof Attributes;
  gain?: number;
}
