import { Medal } from 'lucide-react';

const TIER_PRIZES: Record<string, { first: number; second: number; third: number }> = {
  Gold: { first: 5000, second: 2500, third: 1200 },
  Silver: { first: 2500, second: 1250, third: 600 },
  Bronze: { first: 1200, second: 600, third: 300 },
  Iron: { first: 600, second: 300, third: 150 },
};

interface TournamentPrizeBadgeProps {
  tierId: string;
}

/**
 * Prize purse badge shown in the Warrior Readiness banner header.
 * Returns null when the tier is unknown so no broken badge renders.
 */
export function TournamentPrizeBadge({ tierId }: TournamentPrizeBadgeProps) {
  const prizes = TIER_PRIZES[tierId];
  if (!prizes) return null;
  return (
    <div className="flex items-center gap-3 bg-white/[0.03] border border-white/5 px-4 py-2 rounded-none">
      <Medal className="h-3.5 w-3.5 text-arena-gold" />
      <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-foreground/70">
        <span>{prizes.first.toLocaleString()}g</span>
        <span className="opacity-20 text-[8px]">|</span>
        <span>{prizes.second.toLocaleString()}g</span>
        <span className="opacity-20 text-[8px]">|</span>
        <span>{prizes.third.toLocaleString()}g</span>
      </div>
    </div>
  );
}
