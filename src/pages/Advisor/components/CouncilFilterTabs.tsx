import { cn } from '@/lib/utils';
import { Users, Swords, Trophy, Heart } from 'lucide-react';

export type AdvisorFilterTab = 'all' | 'ready' | 'tournament' | 'rehab';

interface CouncilFilterTabsProps {
  currentTab: AdvisorFilterTab;
  onTabChange: (tab: AdvisorFilterTab) => void;
  counts: Record<AdvisorFilterTab, number>;
}

export function CouncilFilterTabs({ currentTab, onTabChange, counts }: CouncilFilterTabsProps) {
  const tabs: { id: AdvisorFilterTab; label: string; icon: React.ElementType }[] = [
    { id: 'all', label: 'All Warriors', icon: Users },
    { id: 'ready', label: 'Combat Ready', icon: Swords },
    { id: 'tournament', label: 'Contenders', icon: Trophy },
    { id: 'rehab', label: 'Med Bay', icon: Heart },
  ];

  return (
    <div className="flex items-center gap-2 border-b border-white/5 pb-2 overflow-x-auto thin-scrollbar">
      {tabs.map(({ id, label, icon: Icon }) => (
        <button
          key={id}
          onClick={() => onTabChange(id)}
          className={cn(
            'flex items-center gap-2 px-5 py-2.5 text-[10px] font-black uppercase tracking-widest transition-all rounded-none border',
            currentTab === id
              ? 'border-primary/40 bg-primary/10 text-primary shadow-[inset_0_-2px_0_0_hsl(var(--primary))]'
              : 'border-transparent text-muted-foreground/60 hover:text-foreground/80 hover:bg-white/[0.02]'
          )}
        >
          <Icon className="h-3 w-3" />
          <span>{label}</span>
          <span className="ml-1 text-[9px] font-mono opacity-60">[{counts[id]}]</span>
        </button>
      ))}
    </div>
  );
}
