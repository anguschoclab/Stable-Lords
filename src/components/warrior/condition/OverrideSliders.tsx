import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import type { PlanCondition } from '@/types/game';

interface OverrideSlidersProps {
  cond: PlanCondition;
  onSliderChange: (key: 'OE' | 'AL' | 'killDesire', val: number | undefined) => void;
}

export function OverrideSliders({ cond, onSliderChange }: OverrideSlidersProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* OE override */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label
            className={cn(
              'text-[9px] font-black uppercase tracking-widest',
              cond.override.OE !== undefined ? 'text-arena-gold' : 'text-muted-foreground/40'
            )}
          >
            OE {cond.override.OE !== undefined ? cond.override.OE : '—'}
          </Label>
          {cond.override.OE !== undefined ? (
            <button
              onClick={() => onSliderChange('OE', undefined)}
              className="text-[8px] font-black uppercase text-muted-foreground/40 hover:text-destructive"
              aria-label="Clear OE override"
            >
              clear
            </button>
          ) : (
            <button
              onClick={() => onSliderChange('OE', 5)}
              className="text-[8px] font-black uppercase text-muted-foreground/40 hover:text-arena-gold"
              aria-label="Set OE override"
            >
              set
            </button>
          )}
        </div>
        {cond.override.OE !== undefined && (
          <Slider
            value={[cond.override.OE]}
            onValueChange={([v]) => onSliderChange('OE', v)}
            min={1}
            max={10}
            step={1}
          />
        )}
      </div>

      {/* AL override */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label
            className={cn(
              'text-[9px] font-black uppercase tracking-widest',
              cond.override.AL !== undefined ? 'text-arena-fame' : 'text-muted-foreground/40'
            )}
          >
            AL {cond.override.AL !== undefined ? cond.override.AL : '—'}
          </Label>
          {cond.override.AL !== undefined ? (
            <button
              onClick={() => onSliderChange('AL', undefined)}
              className="text-[8px] font-black uppercase text-muted-foreground/40 hover:text-destructive"
              aria-label="Clear AL override"
            >
              clear
            </button>
          ) : (
            <button
              onClick={() => onSliderChange('AL', 5)}
              className="text-[8px] font-black uppercase text-muted-foreground/40 hover:text-arena-fame"
              aria-label="Set AL override"
            >
              set
            </button>
          )}
        </div>
        {cond.override.AL !== undefined && (
          <Slider
            value={[cond.override.AL]}
            onValueChange={([v]) => onSliderChange('AL', v)}
            min={1}
            max={10}
            step={1}
          />
        )}
      </div>

      {/* KD override */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label
            className={cn(
              'text-[9px] font-black uppercase tracking-widest',
              cond.override.killDesire !== undefined
                ? 'text-destructive'
                : 'text-muted-foreground/40'
            )}
          >
            KD {cond.override.killDesire !== undefined ? cond.override.killDesire : '—'}
          </Label>
          {cond.override.killDesire !== undefined ? (
            <button
              onClick={() => onSliderChange('killDesire', undefined)}
              className="text-[8px] font-black uppercase text-muted-foreground/40 hover:text-destructive"
              aria-label="Clear Kill Desire override"
            >
              clear
            </button>
          ) : (
            <button
              onClick={() => onSliderChange('killDesire', 5)}
              className="text-[8px] font-black uppercase text-muted-foreground/40 hover:text-destructive"
              aria-label="Set Kill Desire override"
            >
              set
            </button>
          )}
        </div>
        {cond.override.killDesire !== undefined && (
          <Slider
            value={[cond.override.killDesire]}
            onValueChange={([v]) => onSliderChange('killDesire', v)}
            min={1}
            max={10}
            step={1}
          />
        )}
      </div>
    </div>
  );
}
