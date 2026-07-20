import { ATTRIBUTE_KEYS } from '@/types/game';

interface AttributeMatrixProps {
  attributeRanges: Record<string, string>;
}

/**
 *
 */
export function AttributeMatrix({ attributeRanges }: AttributeMatrixProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <span className="text-[10px] font-black uppercase tracking-[0.4em] text-primary">
          ATTRIBUTE MATRIX
        </span>
        <div className="h-px flex-1 bg-gradient-to-r from-primary/20 via-border/20 to-transparent" />
      </div>

      <div className="grid grid-cols-1 gap-2">
        {ATTRIBUTE_KEYS.map((key) => {
          const range = attributeRanges[key];
          if (!range) return null;
          return <AttributeRangeRow key={key} attribute={key} range={range} />;
        })}
      </div>
    </div>
  );
}

interface AttributeRangeRowProps {
  attribute: string;
  range: string;
}

function AttributeRangeRow({ attribute, range }: AttributeRangeRowProps) {
  return (
    <div className="flex items-center group">
      <div className="w-20 shrink-0">
        <span className="text-[9px] text-muted-foreground/40 font-black uppercase tracking-widest group-hover:text-primary/60 transition-colors">
          {attribute}
        </span>
      </div>
      <div className="flex-1 h-8 bg-neutral-900 rounded-none border border-white/5 px-4 flex items-center group-hover:border-primary/20 transition-all motion-reduce:transition-none motion-reduce:transform-none">
        <span className="text-xs font-mono font-black text-foreground">{range}</span>
        <div className="ml-auto flex gap-1 items-baseline">
          <div className="h-1.5 w-1 bg-primary/40 rounded-none" />
          <div className="h-2.5 w-1 bg-primary/60 rounded-none" />
          <div className="h-2 w-1 bg-primary/20 rounded-none" />
        </div>
      </div>
    </div>
  );
}
