import { Badge } from '@/components/ui/badge';
import { Activity } from 'lucide-react';
import { BookmarkButton } from '@/components/bookmarks/BookmarkButton';
import { STYLE_DISPLAY_NAMES, type FightingStyle, type RivalStableData } from '@/types/game';
import { getAllArenas } from '@/data/arenas';
import type { ArenaTitle } from '@/types/state.types';
import { cn } from '@/lib/utils';

const arenaDisplayName = (arenaId: string): string =>
  getAllArenas().find((a) => a.id === arenaId)?.name ?? arenaId;

/**
 * Title posture for one stable: which crowns its roster holds, and whether a
 * crown campaign is underway — both read from real state, nothing inferred.
 */
function titlePosture(
  rival: RivalStableData,
  arenaChampions: Record<string, ArenaTitle> | undefined
): { kind: 'reigning' | 'campaigning'; arenaId: string } | undefined {
  const rosterIds = new Set(rival.roster.map((w) => w.id));
  const held = Object.entries(arenaChampions ?? {}).find(
    ([, t]) => t.champion && rosterIds.has(t.champion.warriorId)
  );
  if (held) return { kind: 'reigning', arenaId: held[0] };
  if (rival.strategy?.intent === 'CROWN_CAMPAIGN' && rival.strategy.targetArenaId) {
    return { kind: 'campaigning', arenaId: rival.strategy.targetArenaId };
  }
  return undefined;
}

const chipClass =
  'text-[9px] font-black uppercase tracking-widest px-2 py-0.5 border-arena-gold/30 bg-arena-gold/10 text-arena-gold';

function PostureChips({ rival, arenaChampions }: RivalRowProps) {
  const posture = titlePosture(rival, arenaChampions);
  return (
    <>
      {posture && (
        <Badge data-testid="title-posture-chip" variant="outline" className={chipClass}>
          {posture.kind === 'reigning' ? 'Crown held' : 'Crown bid'} ·{' '}
          {arenaDisplayName(posture.arenaId)}
        </Badge>
      )}
      {rival.strategy?.intent === 'TOURNAMENT_CAMPAIGN' && (
        <Badge data-testid="tournament-posture-chip" variant="outline" className={chipClass}>
          Tournament prep
        </Badge>
      )}
    </>
  );
}

function TreasuryStatus({ treasury }: { treasury: number }) {
  const [dot, label] =
    treasury < 150
      ? ['bg-destructive', 'Debt']
      : treasury < 500
        ? ['bg-arena-blood', 'Depleted']
        : treasury < 1200
          ? ['bg-primary', 'Active']
          : ['bg-primary', 'Surplus'];
  return (
    <div className="flex items-center gap-2">
      <div
        className={cn(
          'h-1.5 w-1.5 rounded-full shrink-0 animate-pulse motion-reduce:animate-none',
          dot
        )}
      />
      <span className="text-[10px] font-black uppercase tracking-tight text-foreground/70">
        {label}
      </span>
    </div>
  );
}

function FavoredStyles({ rival }: { rival: RivalStableData }) {
  const styles = rival.owner.favoredStyles as FightingStyle[] | undefined;
  return (
    <div className="flex flex-wrap gap-1">
      {styles && styles.length > 0 ? (
        styles.map((s) => (
          <Badge
            key={s}
            variant="outline"
            className="text-[9px] font-black uppercase tracking-widest py-0.5 px-2 bg-neutral-900 border-white/5"
          >
            {STYLE_DISPLAY_NAMES[s]}
          </Badge>
        ))
      ) : (
        <span className="text-[9px] text-muted-foreground/30 italic">No bias</span>
      )}
    </div>
  );
}

interface RivalRowProps {
  rival: RivalStableData;
  arenaChampions?: Record<string, ArenaTitle>;
}

/** One rival-stable row in the intelligence network list. */
export function RivalIntelligenceRow({ rival, arenaChampions }: RivalRowProps) {
  const dossierCount = Object.keys(rival.agentMemory?.opponentDossiers ?? {}).length;
  return (
    <div className="p-5 hover:bg-white/[0.02] transition-all motion-reduce:transition-none motion-reduce:transform-none group relative overflow-hidden">
      {/* Header row */}
      <RowHeader rival={rival} arenaChampions={arenaChampions} dossierCount={dossierCount} />

      {/* Info grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pl-13">
        {/* Doctrine */}
        <div className="sm:col-span-1 space-y-1">
          <span className="text-[8px] font-black uppercase tracking-widest text-muted-foreground/30 block">
            Doctrine
          </span>
          <p className="text-[10px] leading-relaxed italic border-l-2 border-primary/20 pl-3 text-foreground/60">
            "{rival.philosophy || 'Martial purity above all.'}"
          </p>
        </div>

        {/* Capital + Staff */}
        <div className="space-y-2">
          <span className="text-[8px] font-black uppercase tracking-widest text-muted-foreground/30 block">
            Capital
          </span>
          <TreasuryStatus treasury={rival.treasury} />
          <div className="flex items-center gap-1 text-[9px] text-muted-foreground/40 font-black uppercase tracking-widest">
            <Activity className="h-2.5 w-2.5" /> {rival.trainers?.length || 0} staff
          </div>
        </div>

        {/* Favored styles */}
        <div className="space-y-2">
          <span className="text-[8px] font-black uppercase tracking-widest text-muted-foreground/30 block">
            Favored Classes
          </span>
          <FavoredStyles rival={rival} />
        </div>
      </div>

      <div className="absolute right-0 top-0 h-full w-0.5 bg-primary/20 transform translate-x-full group-hover:translate-x-0 transition-transform duration-500 motion-reduce:transition-none motion-reduce:transform-none" />
    </div>
  );
}

/** Row header: stable monogram, owner/personality, intel + posture + intent chips. */
function RowHeader({
  rival,
  arenaChampions,
  dossierCount,
}: {
  rival: RivalStableData;
  arenaChampions?: Record<string, ArenaTitle>;
  dossierCount: number;
}) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <div className="w-10 h-10 shrink-0 rounded-none bg-neutral-900 border border-white/5 flex items-center justify-center font-display font-black text-xs text-muted-foreground group-hover:text-primary group-hover:border-primary/30 transition-all motion-reduce:transition-none motion-reduce:transform-none">
        {rival.owner.stableName.slice(0, 2).toUpperCase()}
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="font-display font-black uppercase text-sm tracking-tight text-foreground group-hover:text-primary transition-colors truncate motion-reduce:transition-none">
          {rival.owner.stableName}
        </h4>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-[9px] text-muted-foreground/50 font-black uppercase tracking-widest truncate">
            {rival.owner.name}
          </span>
          <span className="h-1 w-1 rounded-full bg-border/50 shrink-0" />
          <span className="text-[9px] text-primary/60 font-black uppercase tracking-widest shrink-0">
            {rival.owner.personality || 'Calculated'}
          </span>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <BookmarkButton entityType="rival" entityId={rival.owner.id} size="sm" />
        <span
          data-testid="intel-quality-chip"
          className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-sm bg-neutral-900 border border-white/5 text-muted-foreground/70 tabular-nums"
        >
          {dossierCount > 0 ? `${dossierCount} dossiers` : 'No intel'}
        </span>
        <PostureChips rival={rival} arenaChampions={arenaChampions} />
        <Badge
          className={cn(
            'text-[9px] font-black border-none uppercase tracking-widest px-2 py-0.5 shrink-0',
            rival.strategy?.intent === 'VENDETTA'
              ? 'bg-destructive/20 text-destructive'
              : rival.strategy?.intent === 'EXPANSION'
                ? 'bg-muted-foreground/20 text-muted-foreground'
                : rival.strategy?.intent === 'RECOVERY'
                  ? 'bg-arena-blood/20 text-arena-blood'
                  : 'bg-primary/20 text-primary'
          )}
        >
          {rival.strategy?.intent || 'STABLE'}
        </Badge>
      </div>
    </div>
  );
}
