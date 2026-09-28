import { MapPin, Swords } from 'lucide-react';
import type { BoutOffer, Warrior } from '@/types/state.types';
import { getArenaById } from '@/data/arenas';
import { describeArenaFit } from '@/engine/matchmaking/arenaFit';
import { COUNTERED_VENUE_CONDITION } from '@/engine/bout/mutations/contractMutations';

interface OfferDetailsGridProps {
  offer: BoutOffer;
  playerWarrior?: Warrior;
}

/** Human-readable labels for rival title-bout verdict reasons. */
const TITLE_VERDICT_LABELS: Record<string, string> = {
  'crown-defense': 'Accepted — defending the crown',
  'title-shot': 'Accepted — taking the shot',
  'title-defense-health': 'Declined defense — hurt',
  'title-defense-threat': 'Declined defense — dangerous challenger',
  'killer-champion': 'Declined shot — known killer champion',
  'title-shot-mismatch': 'Declined shot — style mismatch',
};

/**
 * Offer detail grid: fight week, expected crowd hype, and (when set) the
 * arena with its tags and the fighter's fit assessment.
 */
export function OfferDetailsGrid({ offer, playerWarrior }: OfferDetailsGridProps) {
  const venueCountered = offer.conditions?.includes(COUNTERED_VENUE_CONDITION) ?? false;
  const opponentId = offer.warriorIds.find((id) => id !== playerWarrior?.id);
  const rivalVerdict = opponentId ? offer.responseNotes?.[opponentId] : undefined;

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
        <ArenaDetailRow
          arenaId={offer.arenaId}
          venueCountered={venueCountered}
          playerWarrior={playerWarrior}
        />
      )}
      {rivalVerdict && <RivalVerdictRow verdict={rivalVerdict} />}
    </div>
  );
}

/** Arena row: name + countered badge + tags + the player's fit assessment. */
function ArenaDetailRow({
  arenaId,
  venueCountered,
  playerWarrior,
}: {
  arenaId: NonNullable<BoutOffer['arenaId']>;
  venueCountered: boolean;
  playerWarrior?: Warrior;
}) {
  const arena = getArenaById(arenaId);
  return (
    <div className="col-span-2 pt-4 border-t border-white/5 flex items-start gap-2">
      <MapPin className="h-3 w-3 text-muted-foreground/40 mt-0.5 shrink-0" />
      <div>
        <div className="text-[11px] font-display font-black uppercase text-foreground/80 flex items-center gap-2">
          {arena.name}
          {venueCountered && (
            <span
              data-testid="venue-counter-badge"
              className="text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-sm border border-arena-gold/30 bg-arena-gold/10 text-arena-gold"
            >
              Venue countered
            </span>
          )}
        </div>
        <div className="flex gap-1 mt-1">
          {arena.tags.map((tag) => (
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
              {describeArenaFit(playerWarrior, arenaId, playerWarrior.plan ?? undefined)}
            </div>
            <div className="flex flex-wrap gap-1 mt-1">
              {arena.tags.map((tag) => (
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
  );
}

/** The rival's verdict on a title bout, humanized via TITLE_VERDICT_LABELS. */
function RivalVerdictRow({ verdict }: { verdict: string }) {
  return (
    <div className="col-span-2 pt-4 border-t border-white/5 flex items-start gap-2">
      <Swords className="h-3 w-3 text-muted-foreground/40 mt-0.5 shrink-0" />
      <div>
        <span className="text-[8px] font-black uppercase tracking-widest text-muted-foreground/40 block">
          Rival Verdict
        </span>
        <div
          data-testid="rival-verdict-note"
          className="text-[10px] font-black uppercase tracking-tight text-foreground/70 mt-0.5"
        >
          {TITLE_VERDICT_LABELS[verdict] ?? verdict.replace(/_/g, ' ')}
        </div>
      </div>
    </div>
  );
}
