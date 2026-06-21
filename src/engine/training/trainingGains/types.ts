import type { Attributes } from '@/types/shared.types';

/**
 *
 */
export interface TrainingResult {
  type: 'gain' | 'injury' | 'recovery' | 'blocked';
  warriorId: string;
  message: string;
  attr?: keyof Attributes;
  gain?: number;
}
