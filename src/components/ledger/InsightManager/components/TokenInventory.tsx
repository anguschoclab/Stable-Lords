import { Zap } from 'lucide-react';
import type { InsightToken } from '@/types/state.types';
import { TokenCard } from './TokenCard';

interface TokenInventoryProps {
  tokens: InsightToken[];
  selectedTokenId: string | null;
  onSelect: (id: string) => void;
}

/**
 * Left column of the Insight Vault: token list or the empty-inventory state.
 */
export function TokenInventory({ tokens, selectedTokenId, onSelect }: TokenInventoryProps) {
  return (
    <div className="lg:col-span-4 space-y-4">
      <h4 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground pl-1">
        Available Tokens
      </h4>
      {tokens.length === 0 ? (
        <div className="p-8 rounded-none border-2 border-dashed border-border/20 text-center opacity-30">
          <Zap className="h-8 w-8 mx-auto mb-3" />
          <p className="text-[10px] font-black uppercase tracking-widest">Inventory Empty</p>
        </div>
      ) : (
        <div className="space-y-2">
          {tokens.map((token) => (
            <TokenCard
              key={token.id}
              token={token}
              isSelected={selectedTokenId === token.id}
              onSelect={() => onSelect(token.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
