import { useState } from 'react';
import { useParams } from '@tanstack/react-router';
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
import { useArenaDetail } from './arenaDetail/useArenaDetail';

/**
 * Arena card — the venue's lore and real effects, its reigning champion and
 * title history, and the four record boards (wins, kills, best-in-class,
 * best stable).
 */
export default function ArenaDetail() {
  const { arenaId } = useParams({ strict: false }) as { arenaId: string };
  const [confirmRelinquish, setConfirmRelinquish] = useState(false);

  const {
    arena,
    state,
    store,
    reign,
    champWarrior,
    champStable,
    isExcluded,
    badge,
    effects,
    lb,
    styleLeaders,
    stableStandings,
    recentBouts,
    ladder,
    history,
    champId,
  } = useArenaDetail(arenaId);

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
