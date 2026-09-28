import { useGameStore } from '@/state/useGameStore';
import { useShallow } from 'zustand/react/shallow';
import { Search } from 'lucide-react';
import { useInsightManager } from './hooks/useInsightManager';
import { TokenInventory } from './components/TokenInventory';
import { TargetPanel } from './components/TargetPanel';
import { RevealModal } from './components/RevealModal';

/**
 * Insight Vault — spend insight tokens to reveal a warrior's hidden favorite.
 */
export function InsightManager() {
  const { insightTokens, roster, consumeInsightToken } = useGameStore(
    useShallow((s) => ({
      insightTokens: s.insightTokens,
      roster: s.roster,
      consumeInsightToken: s.consumeInsightToken,
    }))
  );

  const {
    tokens,
    safeRoster,
    selectedTokenId,
    setSelectedTokenId,
    selectedWarriorId,
    setSelectedWarriorId,
    selectedWarrior,
    isRevealing,
    revealData,
    setRevealData,
    handleReveal,
  } = useInsightManager({ consumeInsightToken, insightTokens, roster });

  return (
    <div className="space-y-8 animate-in motion-reduce:animate-none fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex items-center gap-4 px-1">
        <div className="p-2.5 rounded-none bg-primary/10 border border-primary/20 shadow-[0_0_15px_rgba(var(--primary-rgb),0.1)] text-primary">
          <Search className="h-5 w-5" />
        </div>
        <div>
          <h3>Insight Vault</h3>
          <p className="text-[9px] text-muted-foreground font-black uppercase tracking-widest opacity-40">
            Tokens Available: {tokens.length}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <TokenInventory
          tokens={tokens}
          selectedTokenId={selectedTokenId}
          onSelect={setSelectedTokenId}
        />
        <TargetPanel
          tokens={tokens}
          selectedTokenId={selectedTokenId}
          roster={safeRoster}
          selectedWarriorId={selectedWarriorId}
          onSelectWarrior={setSelectedWarriorId}
          selectedWarrior={selectedWarrior}
          isRevealing={isRevealing}
          onReveal={handleReveal}
        />
      </div>

      <RevealModal data={revealData} onClose={() => setRevealData(null)} />
    </div>
  );
}
