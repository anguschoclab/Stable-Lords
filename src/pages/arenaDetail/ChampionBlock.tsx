import { Crown } from 'lucide-react';
import { displayWeek } from '@/engine/core/absoluteWeek';
import {
  owningStableOf,
  topContenders,
} from '@/engine/championship/arenaChampionship';
import type { GameState, ArenaTitle } from '@/types/state.types';
import type { Warrior } from '@/types/warrior.types';
import { Surface } from '@/components/ui/Surface';
import { Badge } from '@/components/ui/badge';
import { WarriorNameTag } from '@/components/ui/WarriorBadges';
import { cn } from '@/lib/utils';

interface ChampionBlockProps {
  state: GameState;
  reign: ArenaTitle['champion'] | null;
  champWarrior: Warrior | undefined;
  champStableName: string | undefined;
  champStableIsPlayer: boolean;
  ladder: ReturnType<typeof topContenders>;
  onRelinquish: () => void;
}

/** Arena champion panel: reigning crown + the contender eligibility ladder. */
export function ChampionBlock({
  state,
  reign,
  champWarrior,
  champStableName,
  champStableIsPlayer,
  ladder,
  onRelinquish,
}: ChampionBlockProps) {
  return (
    <Surface variant="glass" className="p-5 mb-6 border-l-4 border-l-arena-gold/50">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Crown
            className={cn('h-5 w-5', reign ? 'text-arena-gold' : 'text-muted-foreground/20')}
          />
          <div>
            <div className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/50">
              Arena Champion
            </div>
            {reign ? (
              <ReignSummary
                reign={reign}
                champWarrior={champWarrior}
                champStableName={champStableName}
              />
            ) : (
              <div className="text-[10px] text-muted-foreground/60 mt-0.5">
                The crown is vacant — the two leading contenders will fight for it.
              </div>
            )}
          </div>
        </div>
        {reign && champStableIsPlayer && (
          <button
            onClick={onRelinquish}
            className="px-4 py-2 text-[9px] font-black uppercase tracking-[0.2em] border border-destructive/30 text-destructive/80 hover:bg-destructive/10 transition-colors motion-reduce:transition-none"
          >
            Relinquish Crown
          </button>
        )}
      </div>

      {/* Contender queue — the real eligibility ladder */}
      {ladder.length > 0 && <ContenderLadder state={state} ladder={ladder} />}
    </Surface>
  );
}

/** Reigning-crown line: warrior tag, stable, reign length, defenses. */
function ReignSummary({
  reign,
  champWarrior,
  champStableName,
}: {
  reign: NonNullable<ArenaTitle['champion']>;
  champWarrior: Warrior | undefined;
  champStableName: string | undefined;
}) {
  return (
    <div className="flex items-center gap-2 mt-0.5">
      <WarriorNameTag
        id={reign.warriorId}
        name={champWarrior?.name ?? reign.warriorId}
        epithet={champWarrior?.epithet}
        isChampion
      />
      <span className="text-[9px] text-muted-foreground/50 italic">
        {champStableName ?? 'Unknown stable'}
      </span>
      <span className="text-[8px] font-mono text-muted-foreground/40">
        since wk {displayWeek(reign.startedAbsoluteWeek)} · {reign.defenses} defenses
      </span>
    </div>
  );
}

/** Contender queue — the real eligibility ladder. */
function ContenderLadder({
  state,
  ladder,
}: {
  state: GameState;
  ladder: ReturnType<typeof topContenders>;
}) {
  return (
    <div className="mt-4 pt-4 border-t border-white/5">
      <div className="text-[8px] font-black uppercase tracking-[0.2em] text-muted-foreground/40 mb-2">
        Next in line
      </div>
      <div className="flex flex-wrap gap-x-6 gap-y-1.5">
        {ladder.map((c, i) => {
          const owner = owningStableOf(state, c.warrior.id);
          const isPlayerContender = owner?.isPlayer ?? false;
          return (
            <div key={c.warrior.id} className="flex items-center gap-2 text-[10px]">
              <span className="font-mono font-black text-arena-gold/70 w-4 text-right">
                {i + 1}
              </span>
              <WarriorNameTag id={c.warrior.id} name={c.warrior.name} epithet={c.warrior.epithet} />
              <span className="text-muted-foreground/40 italic">
                {owner?.stableName ?? '—'}
              </span>
              <span className="font-mono text-muted-foreground/50 tabular-nums">
                {c.wins}W {c.losses}L
              </span>
              {isPlayerContender && (
                <Badge
                  variant="outline"
                  className="text-[7px] font-black tracking-widest border-primary/40 text-primary"
                >
                  YOURS
                </Badge>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
