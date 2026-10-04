import { Surface } from '@/components/ui/Surface';
import { ComparisonBar } from '../ComparisonBar';
import type { Warrior } from '@/types/game';

interface CareerComparisonProps {
  warriorA: Warrior;
  warriorB: Warrior;
}

/**
 *
 */
export function CareerComparison({ warriorA, warriorB }: CareerComparisonProps) {
  const maxWins = Math.max(warriorA.career.wins, warriorB.career.wins, 1);
  const maxKills = Math.max(warriorA.career.kills, warriorB.career.kills, 1);
  const maxFame = Math.max(warriorA.career.fame ?? 0, warriorB.career.fame ?? 0, 1);

  return (
    <Surface variant="glass" className="border-border/40 space-y-6">
      <div className="flex items-center gap-3">
        <span className="text-[10px] font-black uppercase tracking-[0.4em] text-accent">
          CAREER TRAJECTORY
        </span>
        <div className="h-px flex-1 bg-gradient-to-r from-accent/20 via-border/20 to-transparent" />
      </div>

      <div className="space-y-4">
        <ComparisonBar
          label="WINS"
          maxVal={maxWins}
          sideA={{ value: warriorA.career.wins, color: 'bg-primary' }}
          sideB={{ value: warriorB.career.wins, color: 'bg-accent' }}
        />
        <ComparisonBar
          label="KILLS"
          maxVal={maxKills}
          sideA={{ value: warriorA.career.kills, color: 'bg-primary' }}
          sideB={{ value: warriorB.career.kills, color: 'bg-accent' }}
        />
        <ComparisonBar
          label="FAME"
          maxVal={maxFame}
          sideA={{ value: warriorA.career.fame ?? 0, color: 'bg-primary' }}
          sideB={{ value: warriorB.career.fame ?? 0, color: 'bg-accent' }}
        />
      </div>
    </Surface>
  );
}
