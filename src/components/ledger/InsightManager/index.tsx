import { useGameStore } from '@/state/useGameStore';
import { useShallow } from 'zustand/react/shallow';
import { Surface } from '@/components/ui/Surface';
import { Search, Zap, Target } from 'lucide-react';
import { useInsightManager } from './hooks/useInsightManager';
import { TokenCard } from './components/TokenCard';
import { WarriorTargetCard } from './components/WarriorTargetCard';
import { TargetSummary } from './components/TargetSummary';
import { RevealModal } from './components/RevealModal';

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
    selectedToken,
    selectedWarrior,
    isRevealing,
    revealData,
    setRevealData,
    handleReveal,
  } = useInsightManager({ consumeInsightToken, insightTokens, roster });

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
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
        {/* Token Inventory */}
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
                  onSelect={() => setSelectedTokenId(token.id)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Target Selection */}
        <div className="lg:col-span-8 space-y-4">
          <h4 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground pl-1">
            Select Warrior
          </h4>

          <Surface variant="glass" className="p-6 border-white/5 bg-black/20">
            {selectedTokenId ? (
              <div className="space-y-6">
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {safeRoster.map((w) => {
                    const isRevealed =
                      selectedToken?.type === 'Weapon'
                        ? w.favorites?.discovered.weapon
                        : selectedToken?.type === 'Rhythm'
                          ? w.favorites?.discovered.rhythm
                          : false;

                    return (
                      <WarriorTargetCard
                        key={w.id}
                        warrior={{ id: w.id, name: w.name, style: w.style }}
                        isSelected={selectedWarriorId === w.id}
                        isRevealed={!!isRevealed}
                        isRevealing={isRevealing}
                        onSelect={() => setSelectedWarriorId(w.id)}
                      />
                    );
                  })}
                </div>

                <TargetSummary
                  warrior={selectedWarrior ? { name: selectedWarrior.name } : null}
                  canReveal={!!selectedWarriorId}
                  isRevealing={isRevealing}
                  onReveal={handleReveal}
                />
              </div>
            ) : (
              <div className="py-20 text-center opacity-20">
                <Target className="h-12 w-12 mx-auto mb-4" />
                <p className="text-[10px] font-black uppercase tracking-[0.3em]">
                  Select an Insight Token
                </p>
                <p className="text-[9px] lowercase mt-2 italic font-medium">
                  Choose a token from your vault, then pick a warrior to reveal their secret.
                </p>
              </div>
            )}
          </Surface>
        </div>
      </div>

      <RevealModal data={revealData} onClose={() => setRevealData(null)} />
    </div>
  );
}
