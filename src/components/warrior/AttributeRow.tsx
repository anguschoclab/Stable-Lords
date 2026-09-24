import { Lock, ShieldCheck } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { ATTRIBUTE_LABELS, type Warrior, type Attributes } from '@/types/game';
import type { TrainingAssignment } from '@/types/game';
import { ATTRIBUTE_TRAINING } from '@/constants/training';
import type { Trainer } from '@/types/shared.types';
import { getAttributeRowState } from './attributeRowState';
import { AttributeRowStatus } from './AttributeRowStatus';
import { AttributeRowTooltip } from './AttributeRowTooltip';

interface AttributeRowProps {
  warrior: Warrior;
  attributeKey: keyof Attributes;
  assignment?: TrainingAssignment;
  seasonalGains: Partial<Record<keyof Attributes, number>>;
  trainers: Trainer[];
  atCap: boolean;
  onAssign: (attr: keyof Attributes) => void;
  isAdvisorRecommended?: boolean;
}

/**
 *
 */
export function AttributeRow({
  warrior,
  attributeKey: key,
  assignment,
  seasonalGains,
  trainers,
  atCap,
  onAssign,
  isAdvisorRecommended,
}: AttributeRowProps) {
  const {
    val,
    isSZ,
    maxed,
    seasonCapped,
    isRevealed,
    potVal,
    ceilingHit,
    nearCeiling,
    isSelected,
    disabled,
    lockReason,
    chance,
  } = getAttributeRowState({ warrior, key, assignment, seasonalGains, trainers, atCap });

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          disabled={disabled}
          onClick={() => onAssign(key)}
          className={cn(
            'group/row relative w-full flex items-center gap-3 px-3 py-2 rounded-none border text-left transition-all motion-reduce:transition-none motion-reduce:transform-none',
            isSelected
              ? 'bg-primary/20 border-primary shadow-[0_0_15px_-5px_rgba(34,197,94,0.4)]'
              : disabled
                ? 'bg-white/[0.02] border-white/5 opacity-40 cursor-not-allowed'
                : isAdvisorRecommended
                  ? 'bg-arena-gold/5 border-arena-gold/30 hover:border-arena-gold/50 hover:bg-arena-gold/10 shadow-[0_0_10px_-4px_rgba(217,119,6,0.3)]'
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

          {isAdvisorRecommended && !isSelected && (
            <span
              data-testid="advisor-attribute-badge"
              className="text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-sm bg-arena-gold/20 text-arena-gold border border-arena-gold/40 flex items-center gap-1 shrink-0"
            >
              <ShieldCheck className="h-2.5 w-2.5" />
              Council Pick
            </span>
          )}

          <AttributeRowStatus
            isSelected={isSelected}
            maxed={maxed}
            ceilingHit={ceilingHit}
            atCap={atCap}
            seasonCapped={seasonCapped}
            disabled={disabled}
            chance={chance}
          />

          {/* Overlay for "Near Ceiling" */}
          {nearCeiling && (
            <div className="absolute inset-0 bg-arena-gold/5 pointer-events-none rounded-none border border-arena-gold/10" />
          )}
        </button>
      </TooltipTrigger>
      <AttributeRowTooltip
        attributeKey={key}
        chance={chance}
        isSZ={isSZ}
        maxed={maxed}
        ceilingHit={ceilingHit}
        atCap={atCap}
        seasonCapped={seasonCapped}
        isSelected={isSelected}
        isRevealed={isRevealed}
        nearCeiling={nearCeiling}
      />
    </Tooltip>
  );
}
