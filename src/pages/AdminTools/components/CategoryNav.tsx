import { cn } from '@/lib/utils';
import {
  Settings,
  Zap,
  FastForward,
  Activity,
  SlidersHorizontal,
} from 'lucide-react';
import type { AdminCategory } from '../hooks/useAdminTools';

const CATEGORIES: { id: AdminCategory; icon: React.ElementType; label: string }[] = [
  { id: 'SYSTEM', icon: Settings, label: 'Core_System' },
  { id: 'ECONOMY', icon: Zap, label: 'Market_Ops' },
  { id: 'WORLD', icon: FastForward, label: 'Temporal_Flux' },
  { id: 'TELEMETRY', icon: Activity, label: 'Data_Stream' },
  { id: 'PREFERENCES', icon: SlidersHorizontal, label: 'Arena_Prefs' },
];

interface CategoryNavProps {
  activeCategory: AdminCategory;
  onSelect: (cat: AdminCategory) => void;
}

export function CategoryNav({ activeCategory, onSelect }: CategoryNavProps) {
  return (
    <div className="space-y-1">
      {CATEGORIES.map((cat) => (
        <button
          key={cat.id}
          onClick={() => onSelect(cat.id)}
          className={cn(
            'w-full flex items-center gap-4 px-4 py-3 text-[10px] font-black uppercase tracking-widest transition-all duration-300 group',
            activeCategory === cat.id
              ? 'bg-primary text-primary-foreground'
              : 'text-muted-foreground/60 hover:bg-white/5 hover:text-foreground'
          )}
        >
          <cat.icon
            className={cn(
              'h-4 w-4 transition-colors',
              activeCategory === cat.id
                ? 'text-primary-foreground'
                : 'text-muted-foreground/40 group-hover:text-primary'
            )}
          />
          {cat.label}
        </button>
      ))}
    </div>
  );
}
