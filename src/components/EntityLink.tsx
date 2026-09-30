/**
 * Entity Links — Warriors and Stables.
 * Now triggers a side-panel <Sheet> (flyout) with full dossiers.
 */
import React, { type ReactNode } from 'react';
import { Link } from '@tanstack/react-router';
import { useGameStore } from '@/state/useGameStore';
import { cn } from '@/lib/utils';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetDescription,
} from '@/components/ui/sheet';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { WarriorDossier } from '@/components/WarriorDossier';
import { StableDossier } from '@/components/StableDossier';
import { Button } from '@/components/ui/button';
import { ExternalLink, User, Landmark } from 'lucide-react';
import type { NameResolutionState } from '@/engine/core/historyResolver';
import { findWarrior, findStableId } from '@/engine/core/historyResolver';

/**
 * Props for the WarriorLink component.
 */
interface WarriorLinkProps {
  /** The display name of the warrior */
  name: string;
  /** Optional warrior ID (will be resolved from name if missing) */
  id?: string;
  /** Optional CSS class name */
  className?: string;
  /** Optional custom children to render as the link */
  children?: ReactNode;
}

/**
 * Component for displaying a link to a warrior.
 * Triggers a side-panel sheet with the warrior's dossier.
 *
 * @param props - Component properties
 * @param props.name - The name of the warrior to display and resolve
 * @param props.id - Optional explicit warrior ID. If not provided, it will be resolved by name.
 * @param props.className - Optional CSS classes for styling the link
 * @param props.children - Optional custom content for the link trigger
 * @returns A tooltip-wrapped sheet trigger or a plain span if the warrior cannot be resolved
 */
export const WarriorLink = React.memo(function WarriorLink({ name, id, className, children }: WarriorLinkProps) {
  // Subscribe only to the resolved ID, not the entire heavy slices
  const resolvedId = useGameStore((state) => {
    if (id) return id;
    return resolveWarriorId(name, state);
  });

  if (!resolvedId) {
    return <span className={className}>{children ?? name}</span>;
  }

  return (
    <Sheet>
      <Tooltip>
        <TooltipTrigger asChild>
          <SheetTrigger
            className={cn('text-primary hover:underline underline-offset-2 transition-colors cursor-pointer text-left font-bold motion-reduce:transition-none',
              className
            )}
            onClick={(e) => e.stopPropagation()}
            aria-label={`Open details for warrior ${name}`}
          >
            {children ?? name}
          </SheetTrigger>
        </TooltipTrigger>
        <TooltipContent side="top">
          <p className="text-[10px] font-black uppercase tracking-widest">View Warrior Dossier</p>
        </TooltipContent>
      </Tooltip>
      <SheetContent className="sm:max-w-md border-l-primary/20 bg-card/95 backdrop-blur-md">
        <SheetDescription className="sr-only">Warrior details for {name}</SheetDescription>
        <SheetHeader className="pb-4 border-b">
          <SheetTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <User className="h-5 w-5 text-primary" />
              Warrior Dossier
            </div>
            {resolvedId && (
              <Button
                asChild
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground"
                tooltip="View full profile"
                aria-label="View full warrior profile"
              >
                <Link to={`/warrior/$id`} params={{ id: resolvedId }}>
                  <ExternalLink className="h-4 w-4" />
                </Link>
              </Button>
            )}
          </SheetTitle>
        </SheetHeader>
        <div className="mt-6 h-full">
          <WarriorDossier warriorId={resolvedId as import('@/types/shared.types').WarriorId} />
        </div>
      </SheetContent>
    </Sheet>
  );
});

/**
 * Resolves a warrior name to an ID using the current game state.
 *
 * @param name - The name of the warrior to resolve
 * @param state - The current game state
 * @returns The resolved warrior ID, or undefined if not found
 */
function resolveWarriorId(name: string, state: NameResolutionState): string | undefined {
  if (!state) return undefined;
  // ⚡ Bolt: Prevent O(N) array scans by delegating to O(1) cached lookup
  return findWarrior(state, undefined, name)?.id;
}

/**
 * Props for the StableLink component.
 */
interface StableLinkProps {
  /** The display name of the stable */
  name: string;
  /** Optional CSS class name */
  className?: string;
  /** Optional custom children to render as the link */
  children?: ReactNode;
}

/**
 * Renders a clickable link for a stable that opens its records in a side panel.
 * Falls back to plain text if the stable cannot be resolved.
 *
 * @param props - The component props.
 * @param props.name - The name of the stable.
 * @param [props.className] - Optional CSS class name for styling.
 * @param [props.children] - Optional custom content to display inside the link.
 * @returns A clickable sheet trigger or a plain span if ID cannot be resolved.
 */
export const StableLink = React.memo(function StableLink({ name, className, children }: StableLinkProps) {
  // Compute derived IDs directly in the selector
  const { stableId, resolvedStableId, isPlayer } = useGameStore((state) => {
    const resolvedId = findStableId(state as unknown as NameResolutionState, name);
    const isP = resolvedId === state.player.id;
    return {
      resolvedStableId: resolvedId,
      isPlayer: isP,
      stableId: isP ? 'player' : resolvedId
    };
  }, (a, b) => a.stableId === b.stableId && a.resolvedStableId === b.resolvedStableId && a.isPlayer === b.isPlayer);

  if (!resolvedStableId) {
    return <span className={className}>{children ?? name}</span>;
  }

  return (
    <Sheet>
      <Tooltip>
        <TooltipTrigger asChild>
          <SheetTrigger
            className={cn('text-arena-gold hover:underline underline-offset-2 transition-colors cursor-pointer text-left font-bold motion-reduce:transition-none',
              className
            )}
            onClick={(e) => e.stopPropagation()}
            aria-label={`Open details for stable ${name}`}
          >
            {children ?? name}
          </SheetTrigger>
        </TooltipTrigger>
        <TooltipContent side="top">
          <p className="text-[10px] font-black uppercase tracking-widest">View Stable Records</p>
        </TooltipContent>
      </Tooltip>
      <SheetContent className="sm:max-w-md border-l-arena-gold/20 bg-card/95 backdrop-blur-md">
        <SheetDescription className="sr-only">Stable details for {name}</SheetDescription>
        <SheetHeader className="pb-4 border-b">
          <SheetTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Landmark className="h-5 w-5 text-arena-gold" />
              Stable Records
            </div>
            {isPlayer ? (
              <Button
                asChild
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground"
                tooltip="View full stable"
                aria-label="View full stable"
              >
                <Link to="/stable/roster">
                  <ExternalLink className="h-4 w-4" />
                </Link>
              </Button>
            ) : stableId ? (
              <Button
                asChild
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground"
                tooltip="View full stable"
                aria-label="View full stable"
              >
                <Link to="/world/stable/$id" params={{ id: stableId }}>
                  <ExternalLink className="h-4 w-4" />
                </Link>
              </Button>
            ) : null}
          </SheetTitle>
        </SheetHeader>
        <div className="mt-6 h-full">
          <StableDossier stableId={stableId} stableName={name} />
        </div>
      </SheetContent>
    </Sheet>
  );
});


