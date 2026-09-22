import { Briefcase } from 'lucide-react';
import { ImperialRing } from '@/components/ui/ImperialRing';
import { BookmarkButton } from '@/components/bookmarks/BookmarkButton';
import { cn } from '@/lib/utils';
import type { BoutOffer, PromoterPersonality } from '@/types/state.types';
import type { PersonalityEntry } from '@/data/promoterPersonalityConfig';

interface OfferCardHeaderProps {
  offer: BoutOffer;
  promoter?: { name?: string; tier?: string; personality?: string };
  personality?: PromoterPersonality;
  personalityConfig: PersonalityEntry | null;
}

/**
 * Offer card header: promoter identity + badges (rival challenge, counter,
 * personality), bookmark toggle, and the fight purse.
 */
export function OfferCardHeader({
  offer,
  promoter,
  personality,
  personalityConfig,
}: OfferCardHeaderProps) {
  return (
    <div className="p-6 border-b border-white/5 flex items-start justify-between bg-white/[0.01]">
      <div className="flex items-center gap-4">
        <ImperialRing size="sm" variant="bronze">
          <Briefcase className="h-4 w-4 text-muted-foreground/40" />
        </ImperialRing>
        <div>
          <h3 className="text-[11px] font-black uppercase tracking-widest text-foreground leading-none mb-1">
            {promoter?.name || 'External Syndicate'}
          </h3>
          <div className="flex items-center gap-3">
            <span className="text-[8px] font-black uppercase text-primary tracking-widest">
              {promoter?.tier} PROMOTER
            </span>
            {offer.proposerStableId && (
              <span
                data-testid="rival-challenge-badge"
                className="text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-sm bg-destructive/10 text-destructive border border-destructive/20"
              >
                Rival challenge
              </span>
            )}
            {!!offer.counterPurseBump && (
              <span
                data-testid="counter-offer-badge"
                className="text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-sm bg-arena-gold/10 text-arena-gold border border-arena-gold/20 tabular-nums"
              >
                Countered +{offer.counterPurseBump}G
              </span>
            )}
            {personalityConfig && (
              <span
                className={cn(
                  'text-[8px] font-black uppercase tracking-widest',
                  personalityConfig.color
                )}
              >
                {personality}
              </span>
            )}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <BookmarkButton entityType="boutOffer" entityId={offer.id} size="sm" />
        <div className="text-right">
          <div className="text-xl font-display font-black text-arena-gold leading-none">
            {offer.purse}G
          </div>
          <p className="text-[8px] font-black uppercase text-muted-foreground/20 tracking-tighter mt-1">
            FIGHT PURSE
          </p>
        </div>
      </div>
    </div>
  );
}
