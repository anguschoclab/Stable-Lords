/**
 * Pre-fight "predicted edge" panel. Presentational — renders the ranked
 * factors from a FightForecast. Mirrors FightAnalysisPanel in style.
 */
import type { FightForecast } from '@/engine/narrative/fightForecast';

interface FightForecastPanelProps {
  forecast?: FightForecast;
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
export function FightForecastPanel({ forecast, nameA, nameD }: FightForecastPanelProps) {
  if (!forecast) return null;

  return (
    <div className="mt-2 rounded-none border border-white/10 bg-black/40 p-3 space-y-2">
      <h4 className="text-[10px] font-black uppercase tracking-widest text-arena-gold">
        Fight Forecast
      </h4>
      <ul className="space-y-1.5">
        {forecast.factors.map((f, i) => {
          const who = favoredName(f.favored, nameA, nameD);
          return (
            <li key={i} className="flex gap-2 items-start text-xs">
              <span className="min-w-[6.5rem] font-bold uppercase text-[10px] text-muted-foreground">
                {f.label}
              </span>
              <span className="text-foreground/90">
                {f.detail}
                {who ? <span className="ml-1 text-[10px] text-arena-gold">→ {who}</span> : null}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
