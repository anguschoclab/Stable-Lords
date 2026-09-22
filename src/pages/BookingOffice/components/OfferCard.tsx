import { Surface } from '@/components/ui/Surface';
import { cn } from '@/lib/utils';
import type { BoutOffer, PromoterPersonality } from '@/types/state.types';
import type { Warrior } from '@/types/state.types';
import { PERSONALITY_CONFIG } from '@/data/promoterPersonalityConfig';
import { isExhausted } from '@/engine/core/fatigueUtils';
import { getFatigueStatus, getInjuryBadge, type RivalWarriorMap } from '../hooks/useBookingOffice';
import { buildFightForecast } from '@/engine/narrative/fightForecast';
import { FightForecastPanel } from '@/components/bout-viewer/FightForecastPanel';
import { OfferCardHeader } from './OfferCardHeader';
import { OfferMatchupPanel } from './OfferMatchupPanel';
import { OfferDetailsGrid } from './OfferDetailsGrid';
import { OfferActions } from './OfferActions';

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

/**
 *
 */
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
      <OfferCardHeader
        offer={offer}
        promoter={promoter}
        personality={personality}
        personalityConfig={personalityConfig}
      />

      <div className="p-8 space-y-8">
        <OfferMatchupPanel
          playerWarrior={playerWarrior}
          fatigueStatus={fatigueStatus}
          injuryBadge={injuryBadge}
          opponent={opponent}
        />

        <FightForecastPanel
          forecast={forecast}
          nameA={playerWarrior?.name ?? 'Your fighter'}
          nameD={opponent?.name ?? 'Opponent'}
        />

        <OfferDetailsGrid offer={offer} playerWarrior={playerWarrior} />
      </div>

      <OfferActions
        isSigned={isSigned}
        acceptDisabled={!!injuryBadge || isExhausted(fatigue)}
        onAccept={() => onResponse(offer.id, playerWarriorId, 'Accepted')}
        onDecline={() => onResponse(offer.id, playerWarriorId, 'Declined')}
      />
    </Surface>
  );
}
