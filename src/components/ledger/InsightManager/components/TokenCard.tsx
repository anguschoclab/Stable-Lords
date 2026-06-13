import { cn } from '@/lib/utils';
import { Surface } from '@/components/ui/Surface';
import { motion } from 'framer-motion';
import { TokenIcon } from './TokenIcon';
import type { InsightTokenType } from '@/types/state.types';

interface TokenCardProps {
  token: { id: string; type: InsightTokenType; discoveredWeek: number };
  isSelected: boolean;
  onSelect: () => void;
}

export function TokenCard({ token, isSelected, onSelect }: TokenCardProps) {
  return (
    <Surface
      variant={isSelected ? 'paper' : 'glass'}
      padding="none"
      className={cn(
        'transition-all border overflow-hidden relative',
        isSelected
          ? 'border-primary shadow-[0_0_20px_rgba(var(--primary-rgb),0.15)] bg-primary/10'
          : 'border-white/5 hover:border-white/20'
      )}
    >
      <button
        aria-label={`Select ${token.type} Insight Token, discovered week ${token.discoveredWeek}`}
        onClick={onSelect}
        className="w-full text-left p-4 outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset"
      >
        <div className="flex items-center gap-3 relative z-10">
          <TokenIcon type={token.type} />
          <div>
            <span>{token.type}_Token</span>
            <span className="block text-[9px] text-muted-foreground uppercase tracking-widest font-mono opacity-60">
              WK_{token.discoveredWeek} // {token.id.slice(0, 8)}
            </span>
          </div>
        </div>
      </button>
      {isSelected && (
        <motion.div
          layoutId="token-active"
          className="absolute left-0 top-0 w-1 h-full bg-primary shadow-[0_0_15px_rgba(var(--primary-rgb),0.5)]"
        />
      )}
    </Surface>
  );
}
