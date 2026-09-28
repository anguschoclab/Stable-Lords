/**
 * Year-End Recap — a condensed summary of the season: top warrior, kill count,
 * treasury delta, biggest rivalry, roster turnover, notable memorials.
 * Pulls directly from GameState; no new engine deps.
 */
import { useMemo } from 'react';
import { useGameStore } from '@/state/useGameStore';
import { useShallow } from 'zustand/react/shallow';
import { Surface } from '@/components/ui/Surface';
import { Trophy, Skull, Coins, Swords, Users, Flame } from 'lucide-react';
import { cn } from '@/lib/utils';

function RecapStat({
  label,
  value,
  tone,
  Icon,
}: {
  label: string;
  value: React.ReactNode;
  tone: string;
  Icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <Surface
      variant="glass"
      className={cn('px-5 py-4 border-border/30 flex items-center gap-4', tone)}
    >
      <Icon className="h-5 w-5 opacity-60" />
      <div>
        <div className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/60">
          {label}
        </div>
        <div className="text-sm font-black">{value}</div>
      </div>
    </Surface>
  );
}

/** Top-rivalry callout + memorial roll below the stat grid. */
function RecapCallouts({
  topRivalry,
  memorials,
}: {
  topRivalry: { intensity?: number; stableIdA: string; stableIdB: string } | undefined;
  memorials: { id: string; name: string; fame?: number; career?: { kills?: number } }[];
}) {
  return (
    <>
      {topRivalry && (
        <Surface variant="glass" className="px-5 py-4 border-destructive/30">
          <div className="text-[9px] font-black uppercase tracking-widest text-destructive mb-1">
            Headline Rivalry
          </div>
          <div className="text-sm">
            Intensity {topRivalry.intensity ?? 0} — {topRivalry.stableIdA} vs{' '}
            {topRivalry.stableIdB}
          </div>
        </Surface>
      )}

      {memorials.length > 0 && (
        <Surface variant="glass" className="px-5 py-4 border-border/30">
          <div className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/60 mb-2">
            In Memoriam
          </div>
          <ul className="space-y-1">
            {memorials.map((w) => (
              <li key={w.id} className="text-xs flex items-center gap-2">
                <Skull className="h-3 w-3 text-destructive" />
                <span className="font-black">{w.name}</span>
                <span className="text-muted-foreground/60">
                  — fame {w.fame ?? 0}, {w.career?.kills ?? 0} kills
                </span>
              </li>
            ))}
          </ul>
        </Surface>
      )}
    </>
  );
}

type RecapData = ReturnType<typeof computeRecap>;

/** Fold the year's collections into the headline recap figures. */
function computeRecap(
  rosterFameData: { id: string; name: string; fame: number | undefined; career: Warrior['career'] }[],
  graveyard: Warrior[],
  ledger: { amount: number }[],
  rivalries: { intensity?: number }[] | undefined
) {
  // ⚡ Bolt: Reduced O(N log N) sort to O(N) linear scan for finding max values. Avoids extra array allocations.
  let topWarrior = rosterFameData[0];
  let mostKills = rosterFameData[0];
  for (const w of rosterFameData) {
    if ((w.fame ?? 0) > (topWarrior?.fame ?? 0)) topWarrior = w;
    if ((w.career?.kills ?? 0) > (mostKills?.career?.kills ?? 0)) mostKills = w;
  }

  const totalKills =
    rosterFameData.reduce((s, w) => s + (w.career?.kills ?? 0), 0) +
    graveyard.reduce((s, w) => s + (w.career?.kills ?? 0), 0);
  const net = (ledger ?? []).reduce((s, e) => s + e.amount, 0);
  const memorials = graveyard.slice(-5);

  let topRivalry = rivalries?.[0];
  if (rivalries) {
    for (const r of rivalries) {
      if ((r.intensity ?? 0) > (topRivalry?.intensity ?? 0)) topRivalry = r;
    }
  }

  return { topWarrior, mostKills, totalKills, net, memorials, topRivalry };
}

/** The six headline stat tiles. */
function RecapGrid({
  recap,
  rosterSize,
  retiredCount,
  graveyardCount,
}: {
  recap: RecapData;
  rosterSize: number;
  retiredCount: number;
  graveyardCount: number;
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
      {recap.topWarrior && (
        <RecapStat
          label="Top Warrior"
          value={`${recap.topWarrior.name} · ${recap.topWarrior.fame}G fame`}
          tone="text-arena-gold"
          Icon={Trophy}
        />
      )}
      {recap.mostKills && (
        <RecapStat
          label="Most Lethal"
          value={`${recap.mostKills.name} · ${recap.mostKills.career?.kills ?? 0} kills`}
          tone="text-destructive"
          Icon={Flame}
        />
      )}
      <RecapStat
        label="Total Arena Kills"
        value={recap.totalKills}
        tone="text-destructive"
        Icon={Skull}
      />
      <RecapStat
        label="Net Treasury"
        value={`${recap.net >= 0 ? '+' : ''}${recap.net}G`}
        tone={recap.net >= 0 ? 'text-primary' : 'text-destructive'}
        Icon={Coins}
      />
      <RecapStat
        label="Active Roster"
        value={`${rosterSize} warriors`}
        tone="text-primary"
        Icon={Users}
      />
      <RecapStat
        label="Retired / Fallen"
        value={`${retiredCount} / ${graveyardCount}`}
        tone="text-muted-foreground"
        Icon={Swords}
      />
    </div>
  );
}

/**
 * Year end recap.
 */
export function YearEndRecap() {
  const { roster, graveyard, retired, ledger, rivalries, season, week } = useGameStore(
    useShallow((s) => ({
      roster: s.roster,
      graveyard: s.graveyard,
      retired: s.retired,
      ledger: s.ledger,
      rivalries: s.rivalries,
      season: s.season,
      week: s.week,
    }))
  );

  const rosterFameData = useMemo(
    () => roster.map((w) => ({ id: w.id, name: w.name, fame: w.fame, career: w.career })),
    [roster]
  );

  const recap = useMemo(
    () => computeRecap(rosterFameData, graveyard, ledger, rivalries),
    [rosterFameData, graveyard, ledger, rivalries]
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 px-1">
        <span className="text-[10px] font-black uppercase tracking-[0.4em] text-arena-gold">
          YEAR_END_RECAP · Season {season} · Week {week}
        </span>
        <div className="h-px flex-1 bg-gradient-to-r from-arena-gold/30 via-border/20 to-transparent" />
      </div>

      <RecapGrid
        recap={recap}
        rosterSize={roster.length}
        retiredCount={retired.length}
        graveyardCount={graveyard.length}
      />

      <RecapCallouts topRivalry={recap.topRivalry} memorials={recap.memorials} />
    </div>
  );
}
