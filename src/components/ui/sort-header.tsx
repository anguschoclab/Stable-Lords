import React from 'react';
import { ArrowUpDown } from 'lucide-react';/**
 * Sort dir type.
 */


export type SortDir = 'asc' | 'desc';/**
 * Defines the shape of sort header props.
 */


export interface SortHeaderProps {
  label: React.ReactNode;
  active: boolean;
  dir?: SortDir;
  onClick: () => void;
}/**
 * Sort header.
 * @param { label, active, dir, onClick } - { label, active, dir, on click }.
 * @returns The result.
 */


export function SortHeader({ label, active, dir, onClick }: SortHeaderProps) {
  const ariaLabel = typeof label === 'string' ? `Sort by ${label}` : 'Sort table column';

  return (
    <button
      onClick={onClick}
      aria-label={ariaLabel}
      className="flex items-center gap-1 hover:text-foreground transition-colors"
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
        className={`h-3 w-3 ${active ? 'text-primary' : 'text-muted-foreground/40'}`}
        aria-hidden="true"
      />
    </button>
  );
}
