import { MapPin } from 'lucide-react';
import type { BoutOffer, Warrior } from '@/types/state.types';
import { getArenaById } from '@/data/arenas';
import { describeArenaFit } from '@/engine/matchmaking/arenaFit';

interface OfferDetailsGridProps {
  offer: BoutOffer;
  playerWarrior?: Warrior;
}

/**
 * Offer detail grid: fight week, expected crowd hype, and (when set) the
 * arena with its tags and the fighter's fit assessment.
 */
export function OfferDetailsGrid({ offer, playerWarrior }: OfferDetailsGridProps) {
  return (
    <div className="grid grid-cols-2 gap-8 py-6 border-y border-white/5">
      <div className="space-y-1">
        <span className="text-[8px] font-black uppercase tracking-widest text-muted-foreground/40">
          Fight Week
        </span>
        <div className="text-[11px] font-display font-black uppercase">Week {offer.boutWeek}</div>
      </div>
      <div className="space-y-1 text-right">
        <span className="text-[8px] font-black uppercase tracking-widest text-muted-foreground/40">
          Crowd Hype
        </span>
        <div className="text-[11px] font-display font-black uppercase text-arena-gold">
          {offer.hype}% Expected Hype
        </div>
      </div>
      {offer.arenaId && (
        <div className="col-span-2 pt-4 border-t border-white/5 flex items-start gap-2">
          <MapPin className="h-3 w-3 text-muted-foreground/40 mt-0.5 shrink-0" />
          <div>
            <div className="text-[11px] font-display font-black uppercase text-foreground/80">
              {getArenaById(offer.arenaId).name}
            </div>
            <div className="flex gap-1 mt-1">
              {getArenaById(offer.arenaId).tags.map((tag) => (
                <span
                  key={tag}
                  className="text-[8px] font-black tracking-widest uppercase px-1.5 py-0.5 rounded-sm border border-white/10 bg-white/5 text-muted-foreground"
                >
                  {tag}
                </span>
              ))}
            </div>

            {playerWarrior && (
              <>
                <div className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/40 mt-0.5">
                  {describeArenaFit(
                    playerWarrior,
                    offer.arenaId,
                    playerWarrior.plan ?? undefined
                  )}
                </div>
                <div className="flex flex-wrap gap-1 mt-1">
                  {getArenaById(offer.arenaId).tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-1.5 py-0.5 rounded-none bg-primary/10 text-primary text-[8px] uppercase tracking-wider font-bold"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
