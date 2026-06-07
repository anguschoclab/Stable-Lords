/**
 * Combat Utility Functions
 * Provides common operations for combat-related styling and logic
 * Eliminates DRY violations of outcome styling patterns
 */
import type { FightOutcomeBy } from '@/types/combat.types'; /**
 * Defines the shape of outcome style.
 */

/**
 * Defines the shape of outcome style.
 */
export interface OutcomeStyle {
  variant: 'gold' | 'blood' | 'parchment';
  icon?: string;
  label: string;
  bgClasses: string;
  textClass: string;
}

/**
 * Returns style configuration for a fight outcome
 * Eliminates DRY violation of outcome styling switch statements
 */
export function getOutcomeStyles(by: FightOutcomeBy): OutcomeStyle {
  switch (by) {
    case 'Kill':
      return {
        variant: 'blood',
        icon: 'Skull',
        label: 'FATALITY',
        bgClasses: 'bg-arena-blood/20 border-arena-blood/40',
        textClass: 'text-arena-blood',
      };
    case 'KO':
      return {
        variant: 'gold',
        icon: 'Zap',
        label: 'KNOCKOUT',
        bgClasses: 'bg-arena-gold/20 border-arena-gold/40',
        textClass: 'text-arena-gold',
      };
    case 'Stoppage':
      return {
        variant: 'gold',
        icon: 'Shield',
        label: 'STOPPAGE',
        bgClasses: 'bg-primary/10 border-primary/20',
        textClass: 'text-primary',
      };
    case 'Exhaustion':
      return {
        variant: 'parchment',
        icon: 'Activity',
        label: 'EXHAUSTION',
        bgClasses: 'bg-neutral-800 border-white/5',
        textClass: 'text-muted-foreground',
      };
    case 'Draw':
      return {
        variant: 'parchment',
        label: 'DRAW',
        bgClasses: 'bg-neutral-900 border-white/5',
        textClass: 'text-muted-foreground',
      };
    default:
      return {
        variant: 'parchment',
        label: 'UNKNOWN',
        bgClasses: 'bg-neutral-900 border-white/5',
        textClass: 'text-muted-foreground',
      };
  }
}
