import { Crown, Skull, Swords, Trophy, Building2 } from 'lucide-react';
import type { ReactNode } from 'react';
import type { WarriorId } from '@/types/shared.types';
// eslint-disable-next-line no-restricted-imports -- grandfathered pre-boundary-fix import
import type {
  calculateArenaLeaderboard,
  calculateArenaStyleLeaders,
  calculateArenaStableStandings,
} from '@/engine/core/leaderboards';
import { WarriorNameTag } from '@/components/ui/WarriorBadges';
import { RecordTable, type RecordRow } from './RecordTable';

type Leaderboard = NonNullable<ReturnType<typeof calculateArenaLeaderboard>>;
type StyleLeaders = ReturnType<typeof calculateArenaStyleLeaders>;
type StableStandings = ReturnType<typeof calculateArenaStableStandings>;

type TableRow = RecordRow;

const StableCell = ({ name }: { name: string }) => (
  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60 italic">
    {name}
  </span>
);

/** Shared W / L / K ledger cells in a given order. */
function RecordCells({
  wins,
  losses,
  kills,
  killsFirst,
}: {
  wins: number;
  losses: number;
  kills: number;
  killsFirst?: boolean;
}) {
  return (
    <span className="font-mono text-[10px]">
      {killsFirst && (
        <>
          <span className="text-arena-blood font-black">{kills}</span>
          <span className="mx-1 opacity-20">/</span>
        </>
      )}
      <span className="text-primary font-bold">{wins}</span>
      <span className="mx-1 opacity-20">/</span>
      <span className="text-destructive font-bold">{losses}</span>
      {!killsFirst && (
        <>
          <span className="mx-1 opacity-20">/</span>
          <span className="text-arena-blood font-black">{kills}</span>
        </>
      )}
    </span>
  );
}

type WarriorEntry = NonNullable<Leaderboard>['topWarriors'][number];
type KillerEntry = NonNullable<Leaderboard>['topKillers'][number];
type StyleLeaderEntry = NonNullable<StyleLeaders[keyof StyleLeaders]>;
type StableEntry = StableStandings[number];

/**
 * Shared warrior-leaderboard row shape: name tag → stable → W/L/K (with the
 * kill-count order flip for executioners) → a trailing stat cell.
 */
const warriorRows = (
  entries: (WarriorEntry | KillerEntry)[] | undefined,
  champId: WarriorId | undefined,
  opts: { killsFirst?: boolean; tail: (e: WarriorEntry | KillerEntry) => ReactNode }
): TableRow[] =>
  (entries ?? []).map((e, i) => ({
    key: e.warriorId,
    rank: i + 1,
    cells: [
      <WarriorNameTag
        key="n"
        id={e.warriorId}
        name={e.name}
        epithet={e.epithet}
        isChampion={e.warriorId === champId}
      />,
      <StableCell key="s" name={e.stableName} />,
      <RecordCells
        key="r"
        wins={e.wins}
        losses={e.losses}
        kills={e.kills}
        killsFirst={opts.killsFirst}
      />,
      opts.tail(e),
    ],
    isPlayer: e.isPlayer,
  }));

const topWarriorRows = (lb: Leaderboard | undefined, champId: WarriorId | undefined): TableRow[] =>
  warriorRows(lb?.topWarriors, champId, {
    tail: (e) => (
      <span key="w" className="font-mono font-black text-[11px] text-arena-gold">
        {((e as WarriorEntry).winRate * 100).toFixed(0)}%
      </span>
    ),
  });

const topKillerRows = (lb: Leaderboard | undefined, champId: WarriorId | undefined): TableRow[] =>
  warriorRows(lb?.topKillers, champId, {
    killsFirst: true,
    tail: (e) => (
      <span key="k" className="font-mono font-black text-[11px] text-arena-blood">
        {e.kills}
      </span>
    ),
  });

const styleLeaderRows = (styleLeaders: StyleLeaders, champId: WarriorId | undefined): TableRow[] =>
  Object.entries(styleLeaders).flatMap(([style, e], i) =>
    e
      ? [
          {
            key: style,
            rank: i + 1,
            cells: [
              <span
                key="st"
                className="text-[9px] font-black uppercase tracking-widest text-primary/80"
              >
                {style}
              </span>,
              <WarriorNameTag
                key="n"
                id={(e as StyleLeaderEntry).warriorId}
                name={(e as StyleLeaderEntry).name}
                epithet={(e as StyleLeaderEntry).epithet}
                isChampion={(e as StyleLeaderEntry).warriorId === champId}
              />,
              <StableCell key="s" name={(e as StyleLeaderEntry).stableName} />,
              <RecordCells
                key="r"
                wins={(e as StyleLeaderEntry).wins}
                losses={(e as StyleLeaderEntry).losses}
                kills={(e as StyleLeaderEntry).kills}
              />,
            ],
            isPlayer: (e as StyleLeaderEntry).isPlayer,
          },
        ]
      : []
  );

const stableRows = (stableStandings: StableStandings): TableRow[] =>
  stableStandings.map((e: StableEntry, i) => ({
    key: e.stableId,
    rank: i + 1,
    cells: [
      <span key="s" className="text-[10px] font-bold uppercase tracking-wider text-foreground/80">
        {e.stableName}
      </span>,
      <span key="c" className="text-center">
        {e.champions > 0 ? (
          <Crown className="h-3.5 w-3.5 text-arena-gold inline" />
        ) : (
          <span className="text-muted-foreground/20">—</span>
        )}
      </span>,
      <RecordCells key="r" wins={e.wins} losses={e.losses} kills={e.kills} />,
      <span key="w" className="font-mono font-black text-[11px] text-arena-gold">
        {e.wins}
      </span>,
    ],
    isPlayer: e.isPlayer,
  }));

/** The four arena record boards: wins, kills, best-in-class, best stable. */
export function RecordBoards({
  lb,
  styleLeaders,
  stableStandings,
  champId,
}: {
  lb: Leaderboard | undefined;
  styleLeaders: StyleLeaders;
  stableStandings: StableStandings;
  champId: WarriorId | undefined;
}) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <RecordTable
        title="Top Warriors"
        icon={<Trophy className="h-4 w-4 text-arena-gold" />}
        head={['WARRIOR', 'STABLE', 'W / L / K', 'WIN %']}
        rows={topWarriorRows(lb, champId)}
      />
      <RecordTable
        title="Top Executioners"
        icon={<Skull className="h-4 w-4 text-arena-blood" />}
        head={['WARRIOR', 'STABLE', 'K / W / L', 'KILLS']}
        rows={topKillerRows(lb, champId)}
      />
      <RecordTable
        title="Best in Class"
        icon={<Swords className="h-4 w-4 text-primary" />}
        head={['STYLE', 'WARRIOR', 'STABLE', 'W / L / K']}
        rows={styleLeaderRows(styleLeaders, champId)}
      />
      <RecordTable
        title="Best Stable"
        icon={<Building2 className="h-4 w-4 text-accent" />}
        head={['STABLE', 'CROWN', 'W / L / K', 'WINS']}
        rows={stableRows(stableStandings)}
      />
    </div>
  );
}
