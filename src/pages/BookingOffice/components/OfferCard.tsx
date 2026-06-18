import { Button } from '@/components/ui/button';
import { Surface } from '@/components/ui/Surface';
import { cn } from '@/lib/utils';
import { ImperialRing } from '@/components/ui/ImperialRing';
import type { BoutOffer, PromoterPersonality } from '@/types/state.types';
import type { Warrior } from '@/types/state.types';
import { PERSONALITY_CONFIG } from '@/data/promoterPersonalityConfig';
import { getArenaById } from '@/data/arenas';
import { describeArenaFit } from '@/engine/matchmaking/arenaFit';
import { Briefcase, CheckCircle2, Ban, Zap, MapPin } from 'lucide-react';
import { BookmarkButton } from '@/components/bookmarks/BookmarkButton';
import { isExhausted } from '@/engine/core/fatigueUtils';
import { getFatigueStatus, getInjuryBadge, type RivalWarriorMap } from '../hooks/useBookingOffice';
import { buildFightForecast } from '@/engine/narrative/fightForecast';
import { FightForecastPanel } from '@/components/bout-viewer/FightForecastPanel';

interface OfferCardProps {
  offer: BoutOffer;
  promoters: Record<string, { name?: string; tier?: string; personality?: string }>;
  roster: Warrior[];
  rivalWarriorMap: RivalWarriorMap;
  signedOfferIds: Set<string>;
  onResponse: (
    offerId: string,
    warriorId: string | undefined,
    response: 'Accepted' | 'Declined'
  ) => void;
}

export function OfferCard({
  offer,
  promoters,
  roster,
  rivalWarriorMap,
  signedOfferIds,
  onResponse,
}: OfferCardProps) {
  const promoter = promoters[offer.promoterId];
  const playerWarrior = roster.find((w) => offer.warriorIds.includes(w.id));
  const playerWarriorId = playerWarrior?.id;
  const opponentId = offer.warriorIds.find((id) => id !== playerWarriorId);
  const opponent = opponentId ? (rivalWarriorMap[opponentId] ?? null) : null;
  const personality = promoter?.personality as PromoterPersonality;
  const personalityConfig = personality ? PERSONALITY_CONFIG[personality] : null;
  const fatigue = playerWarrior?.fatigue ?? 0;
  const fatigueStatus = getFatigueStatus(fatigue);
  const injuryBadge = getInjuryBadge(playerWarrior?.injuries || []);
  const isSigned = signedOfferIds.has(offer.id);

  const forecast = playerWarrior ? buildFightForecast(playerWarrior, opponent ?? null) : undefined;

  return (
    <Surface
      variant="glass"
      className={cn(
        'border-white/5 overflow-hidden group hover:border-primary/20 transition-all duration-500',
        isSigned && 'opacity-60 grayscale-[0.5]'
      )}
    >
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
              ALLOCATED PURSE
            </p>
          </div>
        </div>
      </div>

      <div className="p-8 space-y-8">
        <div className="flex items-center justify-between gap-6">
          <div className="flex-1 text-center space-y-2">
            <span className="text-[8px] font-black uppercase tracking-[0.3em] text-primary/40">
              DEPLOYMENT
            </span>
            <div className="text-xs font-display font-black uppercase text-foreground">
              {playerWarrior?.name}
            </div>
            <div className="flex items-center justify-center gap-2">
              <span
                className={cn(
                  'text-[8px] font-black uppercase tracking-widest',
                  fatigueStatus.color
                )}
              >
                {fatigueStatus.label} [{100 - fatigue}%]
              </span>
              {injuryBadge && (
                <span
                  className={cn(
                    'text-[8px] font-black uppercase tracking-widest',
                    injuryBadge.color
                  )}
                >
                  / {injuryBadge.label}
                </span>
              )}
            </div>
          </div>

          <div className="flex flex-col items-center gap-1 opacity-20">
            <Zap className="h-4 w-4" />
            <div className="h-8 w-px bg-white/20" />
          </div>

          <div className="flex-1 text-center space-y-2">
            <span className="text-[8px] font-black uppercase tracking-[0.3em] text-muted-foreground/20">
              TARGET
            </span>
            <div className="text-xs font-display font-black uppercase text-muted-foreground/80">
              {opponent?.name || 'CLASSIFIED'}
            </div>
            <div className="text-[8px] font-black uppercase text-muted-foreground/40 tracking-widest">
              {opponent?.stableName || 'UNKNOWN STABLE'}
            </div>
          </div>
        </div>

        <FightForecastPanel
          forecast={forecast}
          nameA={playerWarrior?.name ?? 'Your fighter'}
          nameD={opponent?.name ?? 'Opponent'}
        />

        <div className="grid grid-cols-2 gap-8 py-6 border-y border-white/5">
          <div className="space-y-1">
            <span className="text-[8px] font-black uppercase tracking-widest text-muted-foreground/40">
              Temporal Window
            </span>
            <div className="text-[11px] font-display font-black uppercase">
              Operation Week {offer.boutWeek}
            </div>
          </div>
          <div className="space-y-1 text-right">
            <span className="text-[8px] font-black uppercase tracking-widest text-muted-foreground/40">
              Projection Index
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
                {playerWarrior && (
                  <div className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/40 mt-0.5">
                    {describeArenaFit(
                      playerWarrior,
                      offer.arenaId,
                      playerWarrior.plan ?? undefined
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="p-4 bg-white/[0.02] flex gap-2">
        {isSigned ? (
          <div className="flex-1 h-12 flex items-center justify-center gap-3 border border-primary/20 bg-primary/5 text-primary font-black uppercase text-[10px] tracking-[0.2em]">
            <CheckCircle2 className="h-4 w-4" /> Execution Confirmed
          </div>
        ) : (
          <>
            <Button
              className="flex-1 h-12 bg-primary text-primary-foreground rounded-none gap-3 font-black uppercase text-[10px] tracking-[0.2em] hover:bg-primary/90 transition-all"
              onClick={() => onResponse(offer.id, playerWarriorId, 'Accepted')}
              disabled={!!injuryBadge || isExhausted(fatigue)}
            >
              Sign Protocol
            </Button>
            <Button
              variant="outline"
              className="w-12 h-12 rounded-none border-white/5 hover:bg-destructive/10 hover:text-destructive hover:border-destructive/20 p-0 transition-all"
              onClick={() => onResponse(offer.id, playerWarriorId, 'Declined')}
            >
              <Ban className="h-4 w-4" />
            </Button>
          </>
        )}
      </div>
    </Surface>
  );
}
