/**
 * StaminaCurve — tiny SVG sparkline visualising estimated endurance over a
 * 10-minute bout for the current plan. Deterministic preview, not a full sim.
 */
import { useMemo } from 'react';
import type { FightPlan } from '@/types/shared.types';
import type { Warrior } from '@/types/warrior.types';
import { estimateStaminaCurve, predictedCollapseMinute } from '@/engine/strategyValidator';
import { MAX_EXCHANGES, EXCHANGES_PER_MINUTE, BOUT_DURATION_MINUTES } from '@/constants/combat';
import { getPhaseByMinute } from '@/engine/combat/phase';

interface Props {
  plan: FightPlan;
  warrior?: Warrior;
  width?: number;
  height?: number;
} /**
 * Stamina curve.
 * @param - { plan, warrior, width = 240, height = 56 }.
 */

/**
 * Stamina curve.
 * @param - { plan, warrior, width = 240, height = 56 }.
 */
export default function StaminaCurve({ plan, warrior, width = 240, height = 56 }: Props) {
  const { path, lastPct, collapseMinute, phaseBoundaries } = useMemo(() => {
    const series = estimateStaminaCurve(plan, warrior);
    const max = series[0] || 1;
    const step = width / (series.length - 1);
    const pts = series.map((v, i) => {
      const x = i * step;
      const y = height - (v / max) * (height - 4) - 2;
      return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`;
    });
    const last = series[series.length - 1] ?? 0;

    // Find phase boundary x-positions (first minute where phase changes)
    const boundaries: number[] = [];
    let prevPhase = getPhaseByMinute(1, MAX_EXCHANGES, EXCHANGES_PER_MINUTE);
    for (let m = 2; m < series.length; m++) {
      const ph = getPhaseByMinute(m, MAX_EXCHANGES, EXCHANGES_PER_MINUTE);
      if (ph !== prevPhase) {
        boundaries.push(m * step);
        prevPhase = ph;
      }
    }

    return {
      path: pts.join(' '),
      lastPct: Math.round((last / max) * 100),
      collapseMinute: predictedCollapseMinute(series),
      phaseBoundaries: boundaries,
    };
  }, [plan, warrior, width, height]);

  const stroke = lastPct >= 40 ? '#4ade80' : lastPct >= 20 ? '#facc15' : '#ef4444';

  return (
    <div className="flex items-center gap-3">
      <div className="text-[9px] font-black uppercase tracking-[0.3em] text-muted-foreground/60">
        Stamina Curve
      </div>
      <svg width={width} height={height} className="border border-white/5 bg-black/40">
        {phaseBoundaries.map((x, i) => (
          <line
            key={i}
            x1={x}
            y1={0}
            x2={x}
            y2={height}
            stroke="rgba(255,255,255,0.12)"
            strokeWidth={0.5}
            strokeDasharray="2,2"
          />
        ))}
        <path d={path} fill="none" stroke={stroke} strokeWidth={1.5} />
      </svg>
      <div className="text-[10px] font-mono font-black" style={{ color: stroke }}>
        {lastPct}%
      </div>
      <div className="text-[9px] uppercase tracking-widest text-muted-foreground/40">
        @minute {BOUT_DURATION_MINUTES}
      </div>
      {collapseMinute !== null && (
        <div className="text-[9px] font-black uppercase tracking-widest text-destructive/80">
          Collapse @min {collapseMinute}
        </div>
      )}
    </div>
  );
}
