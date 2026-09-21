import type { LedgerEntry } from '@/types/game';

/**
 *
 */
export interface Viewport {
  min: number;
  range: number;
  H: number;
  W: number;
  PAD: number;
}

// ─── Pure helpers ─────────────────────────────────────────────────────────────

/**
 *
 */
export function buildWeeklyPoints(
  ledger: LedgerEntry[],
  week: number,
  treasury: number
): { week: number; value: number }[] {
  if (!ledger || ledger.length === 0) {
    return [{ week, value: treasury }];
  }

  const series: { week: number; value: number }[] = [];
  let currentWeek = -1;
  let cum = 0;

  for (const entry of ledger) {
    const w = entry.week ?? 0;
    if (w !== currentWeek) {
      if (currentWeek !== -1) {
        series.push({ week: currentWeek, value: cum });
      }
      currentWeek = w;
    }
    cum += entry.amount ?? 0;
  }
  // Add final week
  if (currentWeek !== -1) {
    series.push({ week: currentWeek, value: cum });
  }

  // Ensure current week is represented
  const lastSeries = series[series.length - 1];
  if (series.length === 0 || !lastSeries || lastSeries.week !== week) {
    series.push({ week, value: treasury });
  }
  return series.slice(-12); // last 12 weeks
}

/**
 *
 */
export function buildSparklinePath(
  points: { week: number; value: number }[],
  vp: Viewport
): string {
  if (points.length < 2) return '';
  const { min, range, H, W, PAD } = vp;
  return points
    .map((p, i) => {
      const x = PAD + (i / (points.length - 1)) * (W - PAD * 2);
      const y = H - PAD - ((p.value - min) / range) * (H - PAD * 2);
      return `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(' ');
}
