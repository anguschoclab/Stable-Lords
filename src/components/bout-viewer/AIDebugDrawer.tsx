import { isAIDebugEnabled } from '@/engine/ai/debug';
import type { ExchangeLogEntry } from '@/types/combat.types';

interface AIDebugDrawerProps {
  exchangeLog: ExchangeLogEntry[] | undefined;
}

/**
 * Dev-only telemetry dump for the bout viewer. Renders the per-exchange
 * reason codes verbatim — only when the dev AI debug flag is set on
 * globalThis, so production pays nothing.
 */
export function AIDebugDrawer({ exchangeLog }: AIDebugDrawerProps) {
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
