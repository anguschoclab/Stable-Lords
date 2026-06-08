import { Surface } from '@/components/ui/Surface';
import { ComparisonBar } from '../ComparisonBar';
import { ATTRIBUTE_KEYS } from '@/types/game';
import type { Warrior } from '@/types/game';

interface AttributeComparisonProps {
  warriorA: Warrior;
  warriorB: Warrior;
}

export function AttributeComparison({ warriorA, warriorB }: AttributeComparisonProps) {
  return (
    <Surface variant="glass" className="border-border/40 space-y-6">
      <div className="flex items-center gap-3">
        <span className="text-[10px] font-black uppercase tracking-[0.4em] text-primary">
          ATTRIBUTE MATRIX
        </span>
        <div className="h-px flex-1 bg-gradient-to-r from-primary/20 via-border/20 to-transparent" />
      </div>

      <div className="space-y-4">
        {ATTRIBUTE_KEYS.map((key) => (
          <ComparisonBar
            key={key}
            label={key}
            valA={warriorA.attributes[key] ?? 0}
            valB={warriorB.attributes[key] ?? 0}
            maxVal={25}
            colorA="bg-primary"
            colorB="bg-accent"
          />
        ))}
      </div>
    </Surface>
  );
}
