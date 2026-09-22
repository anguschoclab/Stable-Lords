import { Zap } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { TooltipContent } from '@/components/ui/tooltip';
import { ATTRIBUTE_LABELS, type Attributes } from '@/types/game';

interface AttributeRowTooltipProps {
  attributeKey: keyof Attributes;
  chance: number;
  isSZ: boolean;
  maxed: boolean;
  ceilingHit: boolean;
  atCap: boolean;
  seasonCapped: boolean;
  isSelected: boolean;
  isRevealed: boolean;
  nearCeiling: boolean;
}

/**
 * Tooltip body for an attribute training row: full attribute name, gain
 * chance badge, contextual lock/guidance copy, and trainer-bonus footer.
 */
export function AttributeRowTooltip({
  attributeKey,
  chance,
  isSZ,
  maxed,
  ceilingHit,
  atCap,
  seasonCapped,
  isSelected,
  isRevealed,
  nearCeiling,
}: AttributeRowTooltipProps) {
  return (
    <TooltipContent
      side="top"
      sideOffset={8}
      className="bg-neutral-950 border-white/10 p-3 space-y-2 w-56 z-50"
    >
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-black uppercase tracking-[0.2em]">
          {ATTRIBUTE_LABELS[attributeKey]}
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
            Warrior has reached their potential ceiling for {attributeKey}. Scouts may reveal if
            further growth is possible.
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
              ? `Assigned to focus on ${ATTRIBUTE_LABELS[attributeKey]}. Progress roll executes at week end.`
              : `Click to prioritize ${attributeKey} training this week.`}
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
  );
}
