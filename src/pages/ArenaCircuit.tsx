import { useMemo } from 'react';
import { Link } from '@tanstack/react-router';
import { useShallow } from 'zustand/react/shallow';
import { useGameStore } from '@/state/useGameStore';
import { getAllArenas } from '@/data/arenas';
import {
  CHAMPIONSHIP_EXCLUDED_ARENAS,
  getArenaChampion,
  owningStableOf,
} from '@/engine/championship/arenaChampionship';
import { findWarriorById } from '@/engine/core/warriorLookup';
import type { GameState, ArenaTitle } from '@/types/state.types';
import { Surface } from '@/components/ui/Surface';
import { PageFrame } from '@/components/ui/PageFrame';
import { PageHeader } from '@/components/ui/PageHeader';
import { Badge } from '@/components/ui/badge';
import { Crown, MapPin, Swords } from 'lucide-react';
import { cn } from '@/lib/utils';

const SIZE_LABELS: Record<string, string> = {
  cramped: 'CRAMPED',
  standard: 'STANDARD',
  open: 'OPEN',
};

type TitleBadge = { label: string; className: string };

function statusBadge(title: ArenaTitle | undefined): TitleBadge {
  if (!title?.champion) {
    return { label: 'TITLE VACANT', className: 'border-white/15 text-muted-foreground/70' };
  }
  if (title.status === 'dormant') {
    return { label: 'DORMANT', className: 'border-accent/30 text-accent/80' };
  }
  if (title.status === 'pendingReengagement') {
    return { label: 'RE-ENGAGING', className: 'border-arena-gold/40 text-arena-gold' };
  }
  return { label: 'CHAMPION', className: 'border-arena-gold/40 text-arena-gold' };
}

/**
 * The arena circuit — every venue, its reigning champion (or title status),
 * and a link into the arena card. Titles derive live from arenaChampions.
 */
export default function ArenaCircuit() {
  const { arenaChampions, roster, rivals, player } = useGameStore(
    useShallow((s) => ({
      arenaChampions: s.arenaChampions,
      roster: s.roster,
      rivals: s.rivals,
      player: s.player,
    }))
  );
  const state = { arenaChampions, roster, rivals, player } as unknown as GameState;
  const arenas = useMemo(() => getAllArenas(), []);

  return (
    <PageFrame>
      <PageHeader
        title="The Arena Circuit"
        subtitle="Every venue in the realm — its crown, its record books, and its effects"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {arenas.map((arena) => {
          const title = arenaChampions[arena.id];
          const reign = getArenaChampion(state, arena.id);
          const excluded = CHAMPIONSHIP_EXCLUDED_ARENAS.has(arena.id);
          const badge = statusBadge(title);
          const champWarrior = reign ? findWarriorById(state, reign.warriorId) : undefined;
          const stable = reign ? owningStableOf(state, reign.warriorId) : null;

          return (
            <Link
              key={arena.id}
              to="/world/arenas/$arenaId"
              params={{ arenaId: arena.id }}
              className="group"
            >
              <Surface
                variant="glass"
                className="p-5 h-full transition-colors group-hover:border-primary/30"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2 min-w-0">
                    <MapPin className="h-4 w-4 text-muted-foreground/40 shrink-0" />
                    <div className="min-w-0">
                      <div className="text-sm font-display font-black uppercase text-foreground truncate">
                        {arena.name}
                      </div>
                      <div className="text-[8px] font-black uppercase tracking-widest text-muted-foreground/50 mt-0.5">
                        {SIZE_LABELS[arena.size]} · TIER {arena.tier}
                      </div>
                    </div>
                  </div>
                  <Badge
                    variant="outline"
                    className={cn('text-[8px] font-black tracking-widest shrink-0', badge.className)}
                  >
                    {badge.label}
                  </Badge>
                </div>

                <div className="mt-4 pt-3 border-t border-white/5 flex items-center gap-2 min-h-[28px]">
                  {excluded ? (
                    <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/40">
                      Neutral tournament grounds — no crown is held here
                    </span>
                  ) : reign ? (
                    <>
                      <Crown className="h-3.5 w-3.5 text-arena-gold shrink-0" />
                      <span className="text-[10px] font-bold text-foreground/90 truncate">
                        {champWarrior?.name ?? reign.warriorId}
                      </span>
                      {stable && (
                        <span className="text-[9px] text-muted-foreground/50 italic truncate">
                          {stable.isPlayer ? `${player.stableName}` : stable.stableName}
                        </span>
                      )}
                      <span className="ml-auto text-[8px] font-black text-muted-foreground/40 shrink-0">
                        {reign.defenses} DEF
                      </span>
                    </>
                  ) : (
                    <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/40 flex items-center gap-2">
                      <Swords className="h-3 w-3" /> The crown waits for a claimant
                    </span>
                  )}
                </div>
              </Surface>
            </Link>
          );
        })}
      </div>
    </PageFrame>
  );
}
