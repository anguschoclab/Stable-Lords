import { Badge } from '@/components/ui/badge';
import { CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { FightPlan, Warrior } from '@/types/game';
import { STYLE_DISPLAY_NAMES } from '@/types/game';
import type { StylePreset } from '@/engine/bout/stylePresets';
import { getScoreColor } from '@/lib/scoreDisplay';
import type { StrategyWarning } from '@/engine/strategy/strategyValidator';
import { ShieldCheck } from 'lucide-react';
import StaminaCurve from './StaminaCurve';
import { BIAS_PRESETS } from './usePlanOrchestration';
import type { Bias } from '@/engine/strategy/planBias';

/** Card header: style subtitle, matchup-edge badge, strategy score. */
export function PlanHeader({
  plan,
  matchupAdv,
  score,
}: {
  plan: FightPlan;
  matchupAdv: number;
  score: number;
}) {
  return (
    <CardHeader className="pb-4 border-b border-white/5">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <CardTitle className="font-display text-xl font-black italic uppercase tracking-tighter text-arena-blood">
            Battle Strategy
          </CardTitle>
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/60">
            {STYLE_DISPLAY_NAMES[plan.style]} · Engineering
          </p>
        </div>

        <div className="text-right flex items-center gap-6">
          {matchupAdv !== 0 && (
            <div className="text-right">
              <Badge
                className={cn(
                  'rounded-none border-none font-black text-[10px] tracking-tight px-1.5 py-0.5',
                  matchupAdv > 0
                    ? 'bg-primary/20 text-primary'
                    : 'bg-destructive/20 text-destructive'
                )}
              >
                {matchupAdv > 0 ? 'MATCHUP ADV' : 'MATCHUP PENALTY'}
              </Badge>
              <div
                className={cn(
                  'text-lg font-mono font-black italic',
                  matchupAdv > 0 ? 'text-primary' : 'text-destructive'
                )}
              >
                {matchupAdv > 0 ? '+' : ''}
                {matchupAdv}
              </div>
            </div>
          )}

          <div className="text-right">
            <div
              className={cn(
                'text-3xl font-display font-black tracking-tighter leading-none transition-all motion-reduce:transition-none motion-reduce:transform-none',
                getScoreColor(score)
              )}
            >
              {score}
              <span className="text-xs ml-0.5 opacity-50">/100</span>
            </div>
            <div className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/40 mt-1">
              Strategy Score
            </div>
          </div>
        </div>
      </div>
    </CardHeader>
  );
}

/** Stamina curve chart alongside the strategy-warning list. */
export function WarningsRow({
  plan,
  warrior,
  warnings,
}: {
  plan: FightPlan;
  warrior?: Warrior;
  warnings: StrategyWarning[];
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-6 pb-4 border-b border-white/5">
      <StaminaCurve plan={plan} warrior={warrior} />
      {warnings.length > 0 && (
        <ul className="flex-1 min-w-60 space-y-1">
          {warnings.map((w) => (
            <li
              key={w.code}
              className={cn(
                'text-[10px] font-mono uppercase tracking-wide px-2 py-1 border rounded-none',
                w.severity === 'error'
                  ? 'text-destructive border-destructive/40 bg-destructive/5'
                  : w.severity === 'warn'
                    ? 'text-arena-gold border-arena-gold/30 bg-arena-gold/5'
                    : 'text-muted-foreground border-white/10 bg-black/40'
              )}
            >
              <span className="opacity-60 mr-2">[{w.severity.toUpperCase()}]</span>
              {w.message}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

const PRESET_BTN =
  'text-[10px] font-black uppercase tracking-widest px-3 py-1 border border-white/10 hover:border-arena-blood/40 hover:text-arena-blood text-muted-foreground/60 transition-colors motion-reduce:transition-none';

/** Footer: style presets, targeting biases, targeting summary. */
export function PresetBar({
  plan,
  warrior,
  stylePresets,
  onApplyPreset,
  onRestoreDefault,
  onApplyCouncilTactics,
  onApplyBias,
}: {
  plan: FightPlan;
  warrior?: Warrior;
  stylePresets: StylePreset[];
  onApplyPreset: (presetPlan: FightPlan) => void;
  onRestoreDefault: () => void;
  onApplyCouncilTactics: () => void;
  onApplyBias: (bias: Bias) => void;
}) {
  return (
    <div className="pt-6 border-t border-white/5 space-y-4">
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/40 mr-2">
          Style Presets
        </span>
        {stylePresets.map((preset) => (
          <button
            key={preset.name}
            aria-label={preset.name}
            onClick={() => onApplyPreset(preset.plan)}
            className={PRESET_BTN}
          >
            {preset.name}
          </button>
        ))}
        {warrior && (
          <>
            <button
              aria-label="Restore Default"
              onClick={onRestoreDefault}
              className="text-[10px] font-black uppercase tracking-widest px-3 py-1 border border-white/10 hover:border-muted-foreground/40 hover:text-muted-foreground text-muted-foreground/40 transition-colors motion-reduce:transition-none"
            >
              Restore Default
            </button>
            <button
              aria-label="Apply Council Tactics"
              data-testid="apply-council-tactics-btn"
              onClick={onApplyCouncilTactics}
              className="text-[10px] font-black uppercase tracking-widest px-3 py-1 border border-arena-gold/40 text-arena-gold bg-arena-gold/10 hover:bg-arena-gold/20 flex items-center gap-1.5 transition-colors motion-reduce:transition-none"
            >
              <ShieldCheck className="h-3 w-3" />
              Apply Council Tactics
            </button>
          </>
        )}
      </div>
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/40 mr-2">
          Targeting
        </span>
        {BIAS_PRESETS.map((preset) => (
          <button
            key={preset.label}
            aria-label={preset.label}
            onClick={() => onApplyBias(preset.bias)}
            className={PRESET_BTN}
          >
            {preset.label}
          </button>
        ))}
      </div>
      <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-muted-foreground/40 italic">
        <span>Targeting: Optimized for {plan.target || 'Any'}</span>
      </div>
    </div>
  );
}
