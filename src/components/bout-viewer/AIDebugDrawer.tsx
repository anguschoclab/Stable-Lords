import { isAIDebugEnabled } from '@/engine/ai/debug';
import type { ExchangeLogEntry } from '@/types/combat.types';
import type { ScoutReportData } from '@/types/state.types';
import type { Warrior } from '@/types/warrior.types';

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
  const belief = scoutReports?.filter((r) => r.warriorName === warrior.name).at(-1);
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

/**
 * Dev-only telemetry dump for the bout viewer. Renders the per-exchange
 * reason codes verbatim — only when the dev AI debug flag is set on
 * globalThis, so production pays nothing.
 */
export function AIDebugDrawer({ exchangeLog, warriorA, warriorD, scoutReports }: AIDebugDrawerProps) {
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
          <PlanLine testId="ai-plan-a" label="side A" warrior={warriorA} scoutReports={scoutReports} />
          <PlanLine testId="ai-plan-d" label="side D" warrior={warriorD} scoutReports={scoutReports} />
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
