import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import type { PlanCondition } from '@/types/game';

type OverrideKey = 'OE' | 'AL' | 'killDesire';

interface OverrideSlidersProps {
  cond: PlanCondition;
  onSliderChange: (key: OverrideKey, val: number | undefined) => void;
}

/** One OE/AL/KD override cell — label, set/clear toggle, conditional slider. */
function OverrideCell({
  cond,
  key_,
  label,
  aria,
  activeClass,
  setHoverClass,
  onSliderChange,
}: {
  cond: PlanCondition;
  key_: OverrideKey;
  label: string;
  aria: string;
  activeClass: string;
  setHoverClass: string;
  onSliderChange: (key: OverrideKey, val: number | undefined) => void;
}) {
  const id = `override-${key_.toLowerCase()}-${cond.id}`;
  const value = cond.override[key_];
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label
          htmlFor={id}
          className={cn(
            'text-[9px] font-black uppercase tracking-widest',
            value !== undefined ? activeClass : 'text-muted-foreground/40'
          )}
        >
          {label} {value !== undefined ? value : '—'}
        </Label>
        <button
          onClick={() => onSliderChange(key_, value !== undefined ? undefined : 5)}
          className={cn(
            'text-[8px] font-black uppercase text-muted-foreground/40',
            value !== undefined ? 'hover:text-destructive' : setHoverClass
          )}
          aria-label={value !== undefined ? `Clear ${aria} override` : `Set ${aria} override`}
        >
          {value !== undefined ? 'clear' : 'set'}
        </button>
      </div>
      {value !== undefined && (
        <Slider
          id={id}
          aria-label={`Override ${aria}`}
          value={[value]}
          onValueChange={([v]) => onSliderChange(key_, v)}
          min={1}
          max={10}
          step={1}
        />
      )}
    </div>
  );
}

/**
 *
 */
export function OverrideSliders({ cond, onSliderChange }: OverrideSlidersProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <OverrideCell
        cond={cond}
        key_="OE"
        label="OE"
        aria="Offensive Effort"
        activeClass="text-arena-gold"
        setHoverClass="hover:text-arena-gold"
        onSliderChange={onSliderChange}
      />
      <OverrideCell
        cond={cond}
        key_="AL"
        label="AL"
        aria="Activity Level"
        activeClass="text-arena-fame"
        setHoverClass="hover:text-arena-fame"
        onSliderChange={onSliderChange}
      />
      <OverrideCell
        cond={cond}
        key_="killDesire"
        label="KD"
        aria="Kill Desire"
        activeClass="text-destructive"
        setHoverClass="hover:text-arena-gold"
        onSliderChange={onSliderChange}
      />
    </div>
  );
}
