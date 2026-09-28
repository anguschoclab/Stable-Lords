import type { CampaignFocus } from '@/engine/advisor/types';

/** Display label and badge classes per campaign-focus directive. */
export const FOCUS_LABELS: Record<CampaignFocus, { label: string; color: string }> = {
  TOURNAMENT_PUSH: { label: 'Tournament Push', color: 'border-arena-gold/40 text-arena-gold bg-arena-gold/10' },
  PROSPECT_DEV: { label: 'Prospect Dev', color: 'border-arena-pop/40 text-arena-pop bg-arena-pop/10' },
  PURSE_HUNTER: { label: 'Purse Hunter', color: 'border-primary/40 text-primary bg-primary/10' },
  REHABILITATION: { label: 'Rehab / Rest', color: 'border-destructive/40 text-destructive bg-destructive/10' },
  VETERAN_TWILIGHT: { label: 'Twilight Legacy', color: 'border-purple-400/40 text-purple-400 bg-purple-400/10' },
  CROWN_BID: { label: 'Crown Bid', color: 'border-amber-400/40 text-amber-400 bg-amber-400/10' },
};
