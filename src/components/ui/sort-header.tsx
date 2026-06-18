import type { ReactNode } from 'react';
import { ArrowUpDown } from 'lucide-react';
import { Button } from '@/components/ui/button'; /**
 * Sort dir type.
 */

/**
 * Sort dir type.
 */
export type SortDir = 'asc' | 'desc'; /**
 * Defines the shape of sort header props.
 */

/**
 * Defines the shape of sort header props.
 */
export interface SortHeaderProps {
  label: ReactNode;
  active: boolean;
  dir?: SortDir;
  onClick: () => void;
} /**
 * Sort header.
 * @param - { label, active, dir, on click }.
 */

/**
 * Sort header.
 * @param - { label, active, dir, on click }.
 */
export function SortHeader({ label, active, dir, onClick }: SortHeaderProps) {
  const ariaLabel = typeof label === 'string' ? `Sort by ${label}` : 'Sort table column';

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={onClick}
      aria-label={ariaLabel}
      className="flex items-center gap-1 hover:text-foreground transition-colors group p-0 h-auto"
    >
      <span>{label}</span>
      <span className="sr-only">
        {active
          ? dir
            ? dir === 'desc'
              ? ' (sorted descending)'
              : ' (sorted ascending)'
            : ' (sorted)'
          : ' (click to sort)'}
      </span>
      <ArrowUpDown
        className={`h-3 w-3 ${active ? 'text-primary' : 'text-muted-foreground/40 group-hover:text-muted-foreground/70'}`}
        aria-hidden="true"
      />
    </Button>
  );
}
