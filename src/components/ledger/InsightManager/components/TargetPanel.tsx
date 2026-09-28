import { Target } from 'lucide-react';
import { Surface } from '@/components/ui/Surface';
import type { InsightToken } from '@/types/state.types';
import type { Warrior } from '@/types/warrior.types';
import type { WarriorId } from '@/types/shared.types';
import { WarriorTargetCard } from './WarriorTargetCard';
import { TargetSummary } from './TargetSummary';

interface TargetPanelProps {
  tokens: InsightToken[];
  selectedTokenId: string | null;
  roster: Warrior[];
  selectedWarriorId: string | null;
  onSelectWarrior: (id: WarriorId) => void;
  selectedWarrior: Warrior | undefined;
  isRevealing: boolean;
  onReveal: () => void;
}

/**
 * Right column of the Insight Vault: warrior grid + reveal summary once a
 * token is selected, otherwise the prompt to pick a token.
 */
export function TargetPanel({
  tokens,
  selectedTokenId,
  roster,
  selectedWarriorId,
  onSelectWarrior,
  selectedWarrior,
  isRevealing,
  onReveal,
}: TargetPanelProps) {
  const selectedToken = tokens.find((t) => t.id === selectedTokenId);

  return (
    <div className="lg:col-span-8 space-y-4">
      <h4 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground pl-1">
        Select Warrior
      </h4>

      <Surface variant="glass" className="p-6 border-white/5 bg-black/20">
        {selectedTokenId ? (
          <div className="space-y-6">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {roster.map((w) => {
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
                    onSelect={() => onSelectWarrior(w.id)}
                  />
                );
              })}
            </div>

            <TargetSummary
              warrior={selectedWarrior ? { name: selectedWarrior.name } : null}
              canReveal={!!selectedWarriorId}
              isRevealing={isRevealing}
              onReveal={onReveal}
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
  );
}
