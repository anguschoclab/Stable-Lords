import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';

/**
 * IconTabStrip — underline-style tab strip with icon + uppercase label,
 * shared by dossier/detail pages. The active tab gets a glowing bottom bar.
 */
interface IconTabStripProps<T extends string> {
  tabs: readonly { id: T; label: string; icon: LucideIcon }[];
  activeTab: T;
  onChange: (tab: T) => void;
  className?: string;
}

export function IconTabStrip<T extends string>({
  tabs,
  activeTab,
  onChange,
  className,
}: IconTabStripProps<T>) {
  return (
    <div className={cn('flex items-center gap-8 border-b border-white/5', className)}>
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={cn(
            'flex items-center gap-2 py-4 text-[10px] font-black uppercase tracking-[0.2em] transition-all motion-reduce:transition-none motion-reduce:transform-none relative',
            activeTab === tab.id
              ? 'text-primary'
              : 'text-muted-foreground/40 hover:text-foreground'
          )}
        >
          <tab.icon className="h-3.5 w-3.5" />
          {tab.label}
          {activeTab === tab.id && (
            <div className="absolute bottom-0 left-0 w-full h-0.5 bg-primary shadow-[0_0_10px_rgba(var(--primary-rgb),0.5)]" />
          )}
        </button>
      ))}
    </div>
  );
}
