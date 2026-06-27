import { Badge } from '@/components/ui/badge';
import { X } from 'lucide-react';

interface ConditionHeaderProps {
  idx: number;
  label?: string;
  onRemove: () => void;
}

/**
 *
 */
export function ConditionHeader({ idx, label, onRemove }: ConditionHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <Badge className="rounded-none border-white/20 bg-white/5 text-muted-foreground text-[9px] font-black uppercase tracking-widest px-2 py-0.5">
        Condition {idx + 1}
      </Badge>
      <div className="flex items-center gap-2">
        {label && (
          <span className="text-[9px] font-black uppercase tracking-widest text-arena-gold italic">
            {label}
          </span>
        )}
        <button
          onClick={onRemove}
          className="text-muted-foreground/40 hover:text-destructive transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset rounded-none"
          aria-label="Remove condition"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
