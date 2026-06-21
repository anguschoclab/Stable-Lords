/**
 * Player-facing "why did this happen" panel. Renders the ranked decisive
 * factors from a FightAnalysis. Purely presentational — no store access.
 */
import type { FightAnalysis } from '@/engine/narrative/fightAnalysis';
import { Surface } from '@/components/ui/Surface';

interface FightAnalysisPanelProps {
  analysis?: FightAnalysis;
  nameA: string;
  nameD: string;
}

function favoredName(favored: 'A' | 'D' | null, nameA: string, nameD: string): string | null {
  if (favored === 'A') return nameA;
  if (favored === 'D') return nameD;
  return null;
}

/**
 *
 */
export function FightAnalysisPanel({ analysis, nameA, nameD }: FightAnalysisPanelProps) {
  if (!analysis) return null;

  return (
    <Surface className="p-4 space-y-3">
      <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
        Why it went this way
      </h3>

      <ul className="space-y-2">
        {analysis.factors.map((f, i) => {
          const who = favoredName(f.favored, nameA, nameD);
          return (
            <li key={i} className="flex gap-3 items-start">
              <span className="mt-0.5 inline-block min-w-[7rem] text-xs font-medium text-primary">
                {f.label}
              </span>
              <span className="text-sm text-foreground/90">
                {f.detail}
                {who ? <span className="ml-1 text-xs text-muted-foreground">→ {who}</span> : null}
              </span>
            </li>
          );
        })}
      </ul>

      <div className="grid grid-cols-2 gap-2 pt-2 text-xs text-muted-foreground border-t border-border/40">
        <div>
          {nameA}: {analysis.tale.hitsA} hits · {analysis.tale.damageA} dmg
        </div>
        <div>
          {nameD}: {analysis.tale.hitsD} hits · {analysis.tale.damageD} dmg
        </div>
      </div>
    </Surface>
  );
}
