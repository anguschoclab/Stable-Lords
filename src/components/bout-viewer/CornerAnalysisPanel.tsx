/**
 * Player-facing corner analysis (Stage E). Renders every plan shift the
 * condition engine fired during the bout — which side shifted, on which
 * trigger, and whether a corner forced the re-check at a phase boundary.
 * Purely presentational: reads the structured `conditionFire` projection
 * on the exchange log, nothing inferred.
 */
import { Surface } from '@/components/ui/Surface';
import type { ExchangeLogEntry } from '@/types/combat.types';

interface CornerAnalysisPanelProps {
  exchangeLog?: ExchangeLogEntry[];
  nameA: string;
  nameD: string;
}

/**
 *
 */
export function CornerAnalysisPanel({ exchangeLog, nameA, nameD }: CornerAnalysisPanelProps) {
  if (!exchangeLog) return null;
  const fires = exchangeLog.flatMap((e) =>
    e.conditionFire ? [{ minute: e.minute, ...e.conditionFire }] : []
  );

  return (
    <Surface className="p-4 space-y-3">
      <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
        Corner analysis
      </h3>
      {fires.length === 0 ? (
        <p className="text-xs text-muted-foreground/70">
          No plan shifts — neither fighter's conditions fired this bout.
        </p>
      ) : (
        <ul className="space-y-2">
          {fires.map((f, i) => (
            <li key={i} className="flex items-baseline gap-2 text-sm">
              <span className="text-xs font-mono text-muted-foreground/60 tabular-nums min-w-[3rem]">
                min {f.minute}
              </span>
              <span className="font-medium text-foreground/90">
                {f.actor === 'A' ? nameA : nameD}
              </span>
              <span className="text-xs text-muted-foreground">
                plan shift · {f.trigger}
                {f.corner && (
                  <span className="ml-1 text-arena-gold/80 font-semibold">· corner advice</span>
                )}
              </span>
            </li>
          ))}
        </ul>
      )}
    </Surface>
  );
}
