import { isAIDebugEnabled } from '@/engine/ai/debug';
import type { ExchangeLogEntry } from '@/types/combat.types';
import type { RivalStableData, ScoutReportData } from '@/types/state.types';
import type { Warrior } from '@/types/warrior.types';
import { matchesScoutTarget } from '@/engine/scouting/scouting';
import { useGameStore } from '@/state/useGameStore';

interface AIDebugDrawerProps {
  exchangeLog: ExchangeLogEntry[] | undefined;
  /** Committed plans + mask flags, when the caller has the fighter objects. */
  warriorA?: Warrior;
  warriorD?: Warrior;
  /** Player scout reports — paired with each fighter's committed plan to show
   *  believed-vs-committed plan intel. */
  scoutReports?: ScoutReportData[];
}

function PlanLine({
  testId,
  label,
  warrior,
  scoutReports,
}: {
  testId: string;
  label: string;
  warrior: Warrior | undefined;
  scoutReports: ScoutReportData[] | undefined;
}) {
  if (!warrior?.plan) return null;
  const p = warrior.plan as { OE?: number; AL?: number; killDesire?: number };
  const belief = scoutReports?.filter((r) => matchesScoutTarget(r, warrior)).at(-1);
  return (
    <div data-testid={testId} className="px-3 py-1 flex gap-3 border-b border-white/5">
      <span className="text-muted-foreground/40 w-10 shrink-0">{label}</span>
      <span className="tabular-nums">
        OE {p.OE ?? '?'} · AL {p.AL ?? '?'}
        {p.killDesire != null ? ` · KD ${p.killDesire}` : ''}
        {warrior.planMasked ? ' · masked' : ''}
        {belief?.suspectedOE || belief?.suspectedAL
          ? ` — scouted OE ${belief.suspectedOE ?? '?'} / AL ${belief.suspectedAL ?? '?'}`
          : ''}
      </span>
    </div>
  );
}

/** What the rival owning `viewer` believes about `opponent` — its filed
 *  scout reports plus the matching dossier. Dev-only surface for the AI
 *  scouting loop (V16/F3). */
function RivalIntelLine(props: {
  testId: string;
  label: string;
  viewer: Warrior | undefined;
  opponent: Warrior | undefined;
  world: { rivals: RivalStableData[] | undefined; playerId: string | undefined };
}) {
  const { testId, label, viewer, opponent, world } = props;
  const { rivals, playerId } = world;
  if (!viewer || !opponent) return null;
  const owner =
    (rivals ?? []).find(
      (r) => r.id === (viewer as { stableId?: string }).stableId
    ) ?? (rivals ?? []).find((r) => r.roster?.some((w) => w.id === viewer.id));
  const memory = owner?.agentMemory;
  if (!owner || !memory) return null;

  const latestReport = (memory.scoutReports ?? [])
    .filter((r) => matchesScoutTarget(r, opponent))
    .at(-1);
  const dossierKey =
    (opponent as { stableId?: string }).stableId ?? playerId ?? '';
  const dossier = memory.opponentDossiers?.[dossierKey];
  if (!latestReport && !dossier) return null;

  const reportCount = (memory.scoutReports ?? []).length;
  return (
    <div
      data-testid={testId}
      className="px-3 py-1 flex gap-3 border-b border-white/5 text-primary/70"
    >
      <span className="text-muted-foreground/40 w-10 shrink-0">{label}</span>
      <span className="tabular-nums">
        {owner.owner?.stableName ?? 'rival'} intel · {reportCount} reports
        {latestReport
          ? ` · scouted ${latestReport.quality} wk${latestReport.week}` +
            (latestReport.suspectedOE || latestReport.suspectedAL
              ? ` OE ${latestReport.suspectedOE ?? '?'} / AL ${latestReport.suspectedAL ?? '?'}`
              : '') +
            (latestReport.possiblyMaskedPlan ? ' (masked?)' : '')
          : ''}
        {dossier?.planIntel
          ? ` · planIntel OE ${dossier.planIntel.suspectedOE ?? '?'} / AL ${dossier.planIntel.suspectedAL ?? '?'}`
          : ''}
        {dossier?.suspectedCompetence ? ` · owner ${dossier.suspectedCompetence}` : ''}
        {dossier?.knownStyles?.length
          ? ` · styles ${dossier.knownStyles.length}`
          : ''}
      </span>
    </div>
  );
}

/**
 * Dev-only telemetry dump for the bout viewer. Renders the per-exchange
 * reason codes verbatim — only when the dev AI debug flag is set on
 * globalThis, so production pays nothing.
 */
export function AIDebugDrawer({
  exchangeLog,
  warriorA,
  warriorD,
  scoutReports,
}: AIDebugDrawerProps) {
  const rivals = useGameStore((s) => s.rivals);
  const playerId = useGameStore((s) => s.player?.id);
  if (!isAIDebugEnabled()) return null;

  const rows = (exchangeLog ?? []).filter((e) => (e.reasonCodes?.length ?? 0) > 0);

  return (
    <div
      data-testid="ai-debug-drawer"
      className="border border-primary/20 bg-black/60 font-mono text-[10px] text-primary/80"
    >
      <div className="px-3 py-1.5 border-b border-primary/10 text-[8px] font-black uppercase tracking-widest text-primary/50">
        AI debug · exchange reason codes
      </div>
      {(warriorA?.plan || warriorD?.plan) && (
        <div className="border-b border-primary/10">
          <PlanLine
            testId="ai-plan-a"
            label="side A"
            warrior={warriorA}
            scoutReports={scoutReports}
          />
          <PlanLine
            testId="ai-plan-d"
            label="side D"
            warrior={warriorD}
            scoutReports={scoutReports}
          />
          <RivalIntelLine
            testId="ai-intel-a"
            label="A intel"
            viewer={warriorA}
            opponent={warriorD}
            world={{ rivals, playerId }}
          />
          <RivalIntelLine
            testId="ai-intel-d"
            label="D intel"
            viewer={warriorD}
            opponent={warriorA}
            world={{ rivals, playerId }}
          />
        </div>
      )}
      {rows.length === 0 ? (
        <div className="px-3 py-2 text-muted-foreground/50">No telemetry recorded.</div>
      ) : (
        <ul className="max-h-40 overflow-y-auto">
          {rows.map((e) => (
            <li
              key={e.exchangeIndex}
              className="px-3 py-1 flex gap-3 border-b border-white/5 last:border-0"
            >
              <span className="text-muted-foreground/40 tabular-nums w-10 shrink-0">
                x{e.exchangeIndex}
              </span>
              <span className="tabular-nums">{(e.reasonCodes ?? []).join(' · ')}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
