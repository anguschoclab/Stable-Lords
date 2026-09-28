import { Shield, Hexagon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import type { RivalStableData } from '@/types/game';

interface StableSelectorProps {
  rivals: RivalStableData[];
  idA: string | null;
  setIdA: (id: string | null) => void;
  idB: string | null;
  setIdB: (id: string | null) => void;
}

/** Tone config per column — literal Tailwind classes so the scanner sees them. */
const COLUMN_TONES = {
  primary: {
    chipBg: 'bg-primary/10 border-primary/20',
    chipText: 'text-primary',
    rule: 'bg-gradient-to-r from-primary/20 via-border/20 to-transparent',
    selectedBtn: 'border-primary bg-primary/10 shadow-[0_0_15px_rgba(var(--primary-rgb),0.2)]',
    selectedBox: 'bg-primary text-primary-foreground border-primary',
    selectedName: 'text-primary',
    marker: 'text-primary',
  },
  accent: {
    chipBg: 'bg-accent/10 border-accent/20',
    chipText: 'text-accent',
    rule: 'bg-gradient-to-l from-accent/20 via-border/20 to-transparent',
    selectedBtn: 'border-accent bg-accent/10 shadow-[0_0_15px_rgba(var(--accent-rgb),0.2)]',
    selectedBox: 'bg-accent text-primary-foreground border-accent',
    selectedName: 'text-accent',
    marker: 'text-accent',
  },
} as const;

/** One selector column (prime or challenger) — lists rivals, marks selection. */
function StableColumn({
  rivals,
  title,
  ariaRole,
  tooltip,
  selectedId,
  otherId,
  onSelect,
  tone,
  rightAlign = false,
}: {
  rivals: RivalStableData[];
  title: string;
  ariaRole: string;
  tooltip: string;
  selectedId: string | null;
  otherId: string | null;
  onSelect: (id: string | null) => void;
  tone: keyof typeof COLUMN_TONES;
  rightAlign?: boolean;
}) {
  const t = COLUMN_TONES[tone];
  return (
    <div className="space-y-4">
      <div className={cn('flex items-center gap-3 px-2', rightAlign && 'text-right')}>
        {rightAlign && <div className={cn('h-px flex-1', t.rule)} />}
        <div className={cn('p-1 px-2 rounded-none border', t.chipBg)}>
          <span className={cn('text-[9px] font-black uppercase tracking-[0.2em]', t.chipText)}>
            {title}
          </span>
        </div>
        {!rightAlign && <div className={cn('h-px flex-1', t.rule)} />}
      </div>
      <div className="grid grid-cols-1 gap-1.5 max-h-80 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
        {rivals.map((r) => (
          <StableRow
            key={r.owner.id}
            rival={r}
            ariaRole={ariaRole}
            tooltip={tooltip}
            selectedId={selectedId}
            otherId={otherId}
            onSelect={onSelect}
            toneClasses={t}
            rightAlign={rightAlign}
          />
        ))}
      </div>
    </div>
  );
}

/** One selectable rival row inside a selector column. */
function StableRow({
  rival: r,
  ariaRole,
  tooltip,
  selectedId,
  otherId,
  onSelect,
  toneClasses: t,
  rightAlign,
}: {
  rival: RivalStableData;
  ariaRole: string;
  tooltip: string;
  selectedId: string | null;
  otherId: string | null;
  onSelect: (id: string | null) => void;
  toneClasses: (typeof COLUMN_TONES)[keyof typeof COLUMN_TONES];
  rightAlign: boolean;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          aria-label={`Select ${r.owner.stableName} as ${ariaRole}`}
          onClick={() => onSelect(r.owner.id === selectedId ? null : r.owner.id)}
          disabled={r.owner.id === otherId}
          className={cn(
            'w-full text-left p-3 rounded-none border transition-all motion-reduce:transition-none motion-reduce:transform-none relative group/alpha outline-none',
            selectedId === r.owner.id
              ? t.selectedBtn
              : r.owner.id === otherId
                ? 'border-white/5 opacity-10 cursor-not-allowed grayscale'
                : 'border-white/5 bg-neutral-900/60 hover:border-white/20 hover:bg-white/5'
          )}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  'h-8 w-8 flex items-center justify-center rounded-none border transition-all motion-reduce:transition-none motion-reduce:transform-none',
                  selectedId === r.owner.id
                    ? t.selectedBox
                    : 'bg-neutral-800 text-muted-foreground border-white/5'
                )}
              >
                <Shield className="h-4 w-4" />
              </div>
              <span
                className={cn('font-display font-black text-xs uppercase tracking-tight transition-colors motion-reduce:transition-none',
                  selectedId === r.owner.id ? t.selectedName : 'text-muted-foreground'
                )}
              >
                {r.owner.stableName}
              </span>
            </div>
            {selectedId === r.owner.id && (
              <Hexagon
                className={cn('h-3 w-3 animate-pulse motion-reduce:animate-none', t.marker)}
              />
            )}
          </div>
        </button>
      </TooltipTrigger>
      <TooltipContent
        side={rightAlign ? 'right' : 'left'}
        className="bg-neutral-950 border-white/10 text-[9px] font-black uppercase tracking-widest"
      >
        {tooltip}
      </TooltipContent>
    </Tooltip>
  );
}

/**
 *
 */
export function StableSelector({ rivals, idA, setIdA, idB, setIdB }: StableSelectorProps) {
  return (
    <div className="grid grid-cols-2 gap-8">
      <StableColumn
        rivals={rivals}
        title="Stable Prime"
        ariaRole="Stable Prime"
        tooltip="MARK PRIME"
        selectedId={idA}
        otherId={idB}
        onSelect={setIdA}
        tone="primary"
      />
      <StableColumn
        rivals={rivals}
        title="Stable Challenger"
        ariaRole="Stable Challenger"
        tooltip="MARK CHALLENGER"
        selectedId={idB}
        otherId={idA}
        onSelect={setIdB}
        tone="accent"
        rightAlign
      />
    </div>
  );
}
