import { Check, Lock, ArrowUpRight, Zap } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { ATTRIBUTE_LABELS, type Warrior, type Attributes } from '@/types/game';
import type { TrainingAssignment } from '@/types/game';
import { computeGainChance } from '@/engine/training';
import { canGrow } from '@/engine/potential';
import {
  ATTRIBUTE_TRAINING,
  ATTRIBUTE_TOTAL_CAP,
  SEASONAL_GAINS,
  ATTRIBUTE_NEAR_CEILING_BUFFER,
} from '@/constants/training';
import type { Trainer } from '@/types/shared.types';

interface AttributeRowProps {
  warrior: Warrior;
  attributeKey: keyof Attributes;
  assignment?: TrainingAssignment;
  seasonalGains: Partial<Record<keyof Attributes, number>>;
  trainers: Trainer[];
  atCap: boolean;
  onAssign: (attr: keyof Attributes) => void;
}

export function AttributeRow({
  warrior,
  attributeKey: key,
  assignment,
  seasonalGains,
  trainers,
  atCap,
  onAssign,
}: AttributeRowProps) {
  const val = warrior.attributes[key];
  const isSelected = assignment?.type === 'attribute' && assignment?.attribute === key;
  const maxed = val >= ATTRIBUTE_TRAINING.MAX_VALUE;
  const isSZ = key === 'SZ';
  const seasonCapped = (seasonalGains[key] ?? 0) >= SEASONAL_GAINS.CAP;
  const isRevealed = !!warrior.potentialRevealed?.[key];
  const potVal = warrior.potential?.[key] ?? ATTRIBUTE_TRAINING.MAX_VALUE;
  const ceilingHit = !canGrow(val, warrior.potential?.[key]);
  const nearCeiling = isRevealed && val >= potVal - ATTRIBUTE_NEAR_CEILING_BUFFER;
  const disabled = !!assignment || maxed || atCap || isSZ || seasonCapped || ceilingHit;

  const lockReason = isSZ
    ? 'Size is fixed'
    : maxed
      ? `Attribute max (${ATTRIBUTE_TRAINING.MAX_VALUE})`
      : ceilingHit
        ? 'At potential ceiling'
        : atCap
          ? `Total stat cap (${ATTRIBUTE_TOTAL_CAP}) reached`
          : seasonCapped
            ? `Seasonal cap (${SEASONAL_GAINS.CAP}/${SEASONAL_GAINS.CAP} this season)`
            : null;

  const chance =
    !isSZ && !maxed && !atCap && !seasonCapped && !ceilingHit
      ? Math.round(computeGainChance(warrior, key, trainers) * 100)
      : 0;

  return (
    <Tooltip key={key}>
      <TooltipTrigger asChild>
        <button
          disabled={disabled}
          onClick={() => onAssign(key)}
          className={cn(
            'group/row relative w-full flex items-center gap-3 px-3 py-2 rounded-none border text-left transition-all',
            isSelected
              ? 'bg-primary/20 border-primary shadow-[0_0_15px_-5px_rgba(34,197,94,0.4)]'
              : disabled
                ? 'bg-white/[0.02] border-white/5 opacity-40 cursor-not-allowed'
                : 'bg-white/[0.03] border-white/5 hover:border-white/20 hover:bg-white/[0.08]'
          )}
          aria-label={`Assign ${ATTRIBUTE_LABELS[key]} training for ${warrior.name}`}
        >
          {/* Label & Value */}
          <div className="w-16 shrink-0">
            <div className="text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5">
              {lockReason && !isSelected && <Lock className="h-2.5 w-2.5 opacity-60 shrink-0" />}
              {key}
            </div>
            <div className="text-[10px] font-mono opacity-60">
              {val}
              <span className="opacity-40">/</span>
              {isRevealed ? potVal : '??'}
            </div>
          </div>

          {/* Progress Bar */}
          <div
            className="flex-1 relative"
            data-testid={`training-bar-${key}`}
            data-chance-class={
              chance === 0
                ? 'muted'
                : chance < 40
                  ? 'arena-gold'
                  : chance < 70
                    ? 'primary'
                    : 'arena-fame'
            }
          >
            <Progress
              value={(val / ATTRIBUTE_TRAINING.MAX_VALUE) * 100}
              className={cn(
                'h-1 bg-white/5',
                chance === 0
                  ? '[&>div]:bg-muted-foreground/30'
                  : chance < 40
                    ? '[&>div]:bg-arena-gold'
                    : chance < 70
                      ? '[&>div]:bg-primary'
                      : '[&>div]:bg-arena-fame'
              )}
            />
            {isRevealed && (
              <div
                data-testid={`ceiling-marker-${key}`}
                className="absolute top-0 bottom-0 w-px bg-arena-gold/60 z-10"
                style={{ left: `${(potVal / ATTRIBUTE_TRAINING.MAX_VALUE) * 100}%` }}
                title="Potential Ceiling"
              />
            )}
          </div>

          {/* Metrics & Status */}
          <div className="w-12 text-right">
            {isSelected ? (
              <Check className="h-3.5 w-3.5 text-primary float-right drop-shadow-[0_0_8px_rgba(34,197,94,0.8)]" />
            ) : maxed ? (
              <div className="text-[8px] font-black text-muted-foreground uppercase tracking-widest">
                MAX
              </div>
            ) : ceilingHit ? (
              <Lock className="h-3 w-3 text-arena-gold/60 float-right" />
            ) : atCap ? (
              <Lock className="h-3 w-3 text-destructive/60 float-right" />
            ) : seasonCapped ? (
              <div className="text-[8px] font-black text-arena-gold uppercase tracking-widest">
                3/3
              </div>
            ) : !disabled ? (
              <div className="flex items-center justify-end gap-1">
                <span className="text-[10px] font-mono font-bold text-primary/80">{chance}%</span>
                <ArrowUpRight className="h-2.5 w-2.5 opacity-40 group-hover/row:opacity-100 transition-opacity" />
              </div>
            ) : null}
          </div>

          {/* Overlay for "Near Ceiling" */}
          {nearCeiling && (
            <div className="absolute inset-0 bg-arena-gold/5 pointer-events-none rounded-none border border-arena-gold/10" />
          )}
        </button>
      </TooltipTrigger>
      <TooltipContent
        side="top"
        sideOffset={8}
        className="bg-neutral-950 border-white/10 p-3 space-y-2 w-56 z-50"
      >
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-black uppercase tracking-[0.2em]">
            {ATTRIBUTE_LABELS[key]}
          </span>
          {chance > 0 && (
            <Badge
              variant="outline"
              className="h-4 text-[8px] font-mono bg-primary/10 border-primary/20 text-primary"
            >
              {chance}% CHANCE
            </Badge>
          )}
        </div>
        <div className="space-y-1">
          {isSZ ? (
            <p className="text-[9px] leading-relaxed opacity-60 italic">
              Physiological constants are immutable. Size remains fixed after recruitment.
            </p>
          ) : maxed ? (
            <p className="text-[9px] leading-relaxed text-primary italic">
              Absolute peak reached (25). No further gains possible.
            </p>
          ) : ceilingHit ? (
            <p className="text-[9px] leading-relaxed text-arena-gold italic">
              Warrior has reached their potential ceiling for {key}. Scouts may reveal if further
              growth is possible.
            </p>
          ) : atCap ? (
            <p className="text-[9px] leading-relaxed text-destructive/80 italic">
              Total stat pool (80) is full. Another attribute must decline before this one can grow.
            </p>
          ) : seasonCapped ? (
            <p className="text-[9px] leading-relaxed text-arena-gold italic">
              Warrior is exhausted. Rest required before further training to resume growth.
            </p>
          ) : (
            <p className="text-[9px] leading-relaxed opacity-60">
              {isSelected
                ? `Assigned to focus on ${ATTRIBUTE_LABELS[key]}. Progress roll executes at week end.`
                : `Click to prioritize ${key} training this week.`}
              {isRevealed && !nearCeiling && ' Room to grow before reaching natural limits.'}
              {nearCeiling && !ceilingHit && ' Nearing natural limits. Diminishing returns ahead.'}
            </p>
          )}
        </div>
        {chance > 0 && (
          <div className="pt-1 border-t border-white/5 flex items-center gap-1 opacity-40">
            <Zap className="h-2.5 w-2.5" />
            <span className="text-[8px] uppercase tracking-widest">Trainer bonuses active</span>
          </div>
        )}
      </TooltipContent>
    </Tooltip>
  );
}
