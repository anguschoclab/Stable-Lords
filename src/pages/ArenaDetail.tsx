import { useMemo, useState } from 'react';
import { useParams } from '@tanstack/react-router';
import { useShallow } from 'zustand/react/shallow';
import { useGameStore } from '@/state/useGameStore';
import { getAllArenas } from '@/data/arenas';
import { describeArenaEffects } from '@/engine/narrative/arenaNarrative';
import {
  CHAMPIONSHIP_EXCLUDED_ARENAS,
  owningStableOf,
  topContenders,
} from '@/engine/championship/arenaChampionship';
import { findWarriorById } from '@/engine/core/warriorLookup';
import {
  calculateArenaLeaderboard,
  calculateArenaStyleLeaders,
  calculateArenaStableStandings,
} from '@/engine/core/leaderboards';
import { getFightsForArena } from '@/engine/core/historyUtils';
import type { GameState, ArenaTitle } from '@/types/state.types';
import { Surface } from '@/components/ui/Surface';
import { PageFrame } from '@/components/ui/PageFrame';
import { ConfirmDestructiveDialog } from '@/components/ui/ConfirmDestructiveDialog';
import { PageHeader } from '@/components/ui/PageHeader';
import { Badge } from '@/components/ui/badge';
import { ScrollText } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ChampionBlock } from './arenaDetail/ChampionBlock';
import { RecordBoards } from './arenaDetail/RecordBoards';
import { RecentBouts, TitleHistory, UnknownArena } from './arenaDetail/sections';

function statusBadge(title: ArenaTitle | undefined): { label: string; className: string } {
  if (!title?.champion)
    return { label: 'TITLE VACANT', className: 'border-white/15 text-muted-foreground/70' };
  if (title.status === 'dormant')
    return { label: 'DORMANT', className: 'border-accent/30 text-accent/80' };
  if (title.status === 'pendingReengagement')
    return { label: 'RE-ENGAGING', className: 'border-arena-gold/40 text-arena-gold' };
  return { label: 'REIGNING CHAMPION', className: 'border-arena-gold/40 text-arena-gold' };
}

/**
 * Arena card — the venue's lore and real effects, its reigning champion and
 * title history, and the four record boards (wins, kills, best-in-class,
 * best stable).
 */
export default function ArenaDetail() {
  const { arenaId } = useParams({ strict: false }) as { arenaId: string };
  const [confirmRelinquish, setConfirmRelinquish] = useState(false);

  const arena = useMemo(
    () => getAllArenas().find((a) => a.id === arenaId),
    [arenaId]
  );

  const store = useGameStore(
    useShallow((s) => ({
      arenaChampions: s.arenaChampions,
      roster: s.roster,
      rivals: s.rivals,
      player: s.player,
      arenaHistory: s.arenaHistory,
      relinquishArenaTitle: s.relinquishArenaTitle,
    }))
  );
  const state = store as unknown as GameState;

  const title = store.arenaChampions[arenaId];
  const reign = title?.champion ?? null;
  const champWarrior = reign ? findWarriorById(state, reign.warriorId) : undefined;
  const champStable = reign ? owningStableOf(state, reign.warriorId) : null;
  const isExcluded = CHAMPIONSHIP_EXCLUDED_ARENAS.has(arenaId);
  const badge = statusBadge(title);
  const effects = useMemo(
    () => (arena ? describeArenaEffects(arenaId) : []),
    [arena, arenaId]
  );

  const lb = useMemo(
    () =>
      arena
        ? calculateArenaLeaderboard(arenaId, store.roster, store.player.stableName, store.rivals)
        : undefined,
    [arena, arenaId, store.roster, store.rivals, store.player.stableName]
  );
  const styleLeaders = useMemo(
    () =>
      arena
        ? calculateArenaStyleLeaders(arenaId, store.roster, store.player.stableName, store.rivals)
        : {},
    [arena, arenaId, store.roster, store.rivals, store.player.stableName]
  );
  const stableStandings = useMemo(
    () => (arena ? calculateArenaStableStandings(state, arenaId) : []),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [arena, arenaId, store.roster, store.rivals, store.arenaChampions]
  );

  const recentBouts = useMemo(
    () => getFightsForArena(store.arenaHistory, arenaId).slice(-8).reverse(),
    [store.arenaHistory, arenaId]
  );

  // The queue behind the throne — the same eligibility ordering the
  // championship pass books title bouts from.
  const ladder = useMemo(
    () => (arena && !isExcluded ? topContenders(state, arenaId, 5) : []),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [arena, arenaId, isExcluded, store.roster, store.rivals, store.arenaChampions]
  );

  const history = useMemo(() => [...(title?.history ?? [])].reverse(), [title]);
  const champId = reign?.warriorId;

  if (!arena) {
    return (
      <PageFrame>
        <PageHeader title="Unknown Arena" subtitle={`No venue answers to “${arenaId}”`} />
        <UnknownArena />
      </PageFrame>
    );
  }

  return (
    <PageFrame>
      <PageHeader
        title={arena.name}
        subtitle={`Tier ${arena.tier} · ${arena.size.toUpperCase()} · ${arena.tags.join(' · ')}`}
        actions={
          <Badge variant="outline" className={cn('text-[9px] font-black tracking-widest', badge.className)}>
            {badge.label}
          </Badge>
        }
      />

      {/* Lore + real effects */}
      <Surface variant="glass" className="p-5 mb-6">
        <div className="flex items-center gap-2 mb-3">
          <ScrollText className="h-3.5 w-3.5 text-arena-gold/70" />
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-foreground/80">
            The Ground Itself
          </span>
        </div>
        <div className="space-y-1.5">
          {effects.map((line, i) => (
            <p key={i} className="text-[10px] text-muted-foreground/70 leading-relaxed">
              {line}
            </p>
          ))}
        </div>
      </Surface>

      {/* Champion block */}
      {!isExcluded && (
        <ChampionBlock
          state={state}
          reign={reign}
          champWarrior={champWarrior}
          champStableName={champStable?.stableName}
          champStableIsPlayer={champStable?.isPlayer ?? false}
          ladder={ladder}
          onRelinquish={() => setConfirmRelinquish(true)}
        />
      )}

      <RecordBoards
        lb={lb}
        styleLeaders={styleLeaders}
        stableStandings={stableStandings}
        champId={champId}
      />

      <TitleHistory history={history} />
      <RecentBouts bouts={recentBouts} arenaId={arenaId} />

      <ConfirmDestructiveDialog
        open={confirmRelinquish}
        onOpenChange={setConfirmRelinquish}
        title="Relinquish the Crown?"
        description={
          <>
            {champWarrior?.name ?? 'Your champion'} will give up the {arena.name} title. The
            crown falls vacant, and they cannot contend here again for{' '}
            <span className="text-arena-gold font-black">26 weeks</span>.
          </>
        }
        cancelLabel="Keep the Crown"
        confirmLabel="Relinquish"
        onConfirm={() => store.relinquishArenaTitle(arenaId)}
        contentClassName="bg-neutral-900 border-arena-gold/20"
        titleClassName="font-display font-black text-2xl uppercase tracking-tighter text-arena-gold"
      />
    </PageFrame>
  );
}
