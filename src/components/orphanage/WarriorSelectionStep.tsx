import StepNav from '@/components/orphanage/StepNav';
import { Swords, RefreshCw } from 'lucide-react';
import WarriorCard from '@/components/orphanage/WarriorCard';

interface WarriorSelectionStepProps {
  orphanPool: ReturnType<typeof import('@/data/orphanPool').generateOrphanPool>;
  selected: Set<string>;
  onToggleWarrior: (id: string) => void;
  onRerollPool: () => void;
  onBack: () => void;
  onNext: () => void;
}

/**
 * Warrior selection step.
 * @param  props - {
  orphan pool,
  selected,
  on toggle warrior,
  on reroll pool,
  on back,
  on next,
}.
 */
export default function WarriorSelectionStep(props: WarriorSelectionStepProps) {
  const { orphanPool, selected, onToggleWarrior, onRerollPool, onBack } = props;
  const { onNext } = props;
  return (
    <div className="space-y-4">
      <div
        className="px-5 py-4 flex items-center justify-between"
        style={{
          background: 'var(--card)',
          border: '1px solid rgba(var(--oak-rgb), 0.7)',
          borderTopColor: 'rgba(var(--umber-rgb), 0.35)',
        }}
      >
        <div>
          <p className="text-xs text-muted-foreground/70 leading-relaxed">
            Choose <strong className="text-foreground">3 gladiators</strong> from the intake pool to
            form your starting stable.
          </p>
          <div className="flex items-center gap-2 mt-2">
            <div
              className="px-2.5 py-0.5 text-[10px] font-mono font-black"
              style={{
                background: 'rgba(var(--inkwash-rgb), 0.8)',
                border: '1px solid rgba(var(--oak-rgb), 0.6)',
                color: selected.size === 3 ? 'hsl(var(--accent))' : 'hsl(var(--muted-foreground))',
              }}
            >
              {selected.size}/3 SELECTED
            </div>
          </div>
        </div>
        <button
          onClick={onRerollPool}
          className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-muted-foreground/40 hover:text-accent transition-colors px-3 py-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset motion-reduce:transition-none"
        >
          <RefreshCw className="h-3 w-3" />
          New Batch
        </button>
      </div>

      <div className="space-y-1.5">
        {orphanPool.map((pw) => (
          <WarriorCard
            key={pw.id}
            warrior={pw}
            isSelected={selected.has(pw.id)}
            canSelect={selected.size < 3 || selected.has(pw.id)}
            onClick={() => onToggleWarrior(pw.id)}
          />
        ))}
      </div>

      <StepNav
        onBack={onBack}
        onNext={onNext}
        nextLabel="To the Arena"
        nextIcon={Swords}
        nextDisabled={selected.size < 3}
        nextSize="lg"
        className="flex gap-3 pt-1"
      />
    </div>
  );
}
