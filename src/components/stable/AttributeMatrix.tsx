import { StatBattery } from '@/components/ui/StatBattery';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { ATTRIBUTE_TRAINING, ATTRIBUTE_UI_THRESHOLDS } from '@/constants/training';
import { ATTRIBUTE_KEYS, ATTRIBUTE_LABELS } from '@/types/game';
import type { Attributes } from '@/types/shared.types';

interface AttributeMatrixProps {
  attributes: Attributes;
}

export function AttributeMatrix({ attributes }: AttributeMatrixProps) {
  return (
    <div className="grid grid-cols-7 gap-2 pt-2">
      {ATTRIBUTE_KEYS.map((k) => {
        const val = attributes?.[k] ?? 0;
        return (
          <Tooltip key={k}>
            <TooltipTrigger asChild>
              <StatBattery
                label={k}
                value={val}
                max={ATTRIBUTE_TRAINING.MAX_VALUE}
                colorClass={
                  val >= ATTRIBUTE_UI_THRESHOLDS.EXCELLENT
                    ? 'bg-arena-gold shadow-[0_0_10px_rgba(255,215,0,0.5)] group-hover:animate-pulse'
                    : val >= ATTRIBUTE_UI_THRESHOLDS.GOOD
                      ? 'bg-primary group-hover:animate-pulse'
                      : 'bg-neutral-800'
                }
              />
            </TooltipTrigger>
            <TooltipContent className="bg-neutral-950 border-white/10 text-[9px] font-black tracking-widest">
              {ATTRIBUTE_LABELS[k]}: {val} / {ATTRIBUTE_TRAINING.MAX_VALUE}
            </TooltipContent>
          </Tooltip>
        );
      })}
    </div>
  );
}
