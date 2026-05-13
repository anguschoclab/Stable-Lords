/**
 * Entity Links — Warriors and Stables.
 * Now triggers a side-panel <Sheet> (flyout) with full dossiers.
 */
import React from 'react';
import { Link } from '@tanstack/react-router';
import { useWorldState } from '@/state/useGameStore';
import { cn } from '@/lib/utils';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { WarriorDossier } from '@/components/WarriorDossier';
import { StableDossier } from '@/components/StableDossier';
import { Button } from '@/components/ui/button';
import { ExternalLink, User, Landmark } from 'lucide-react';
import type { GameState, Warrior } from '@/types/game';
import { findWarrior, findStableId } from '@/utils/historyResolver';

// ─── Warrior Link ──────────────────────────────────────────────────────────

interface WarriorLinkProps {
  name: string;
  id?: string;
  className?: string;
  children?: React.ReactNode;
}

export function WarriorLink({ name, id, className, children }: WarriorLinkProps) {
  const state = useWorldState();
  const resolvedId = id ?? resolveWarriorId(name, state);

  if (!resolvedId) {
    return <span className={className}>{children ?? name}</span>;
  }

  return (
    <Sheet>
      <Tooltip>
        <TooltipTrigger asChild>
          <SheetTrigger
            className={cn(
              'text-primary hover:underline underline-offset-2 transition-colors cursor-pointer text-left font-bold',
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
        <SheetHeader className="pb-4 border-b">
          <SheetTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <User className="h-5 w-5 text-primary" />
              Warrior Dossier
            </div>
            {resolvedId && (
              <Link to={`/warrior/$id`} params={{ id: resolvedId }}>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground"
                  title="View full profile"
                  aria-label="View full warrior profile"
                >
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </Link>
            )}
          </SheetTitle>
        </SheetHeader>
        <div className="mt-6 h-full">
          <WarriorDossier warriorId={resolvedId} />
        </div>
      </SheetContent>
    </Sheet>
  );
}

function resolveWarriorId(name: string, state: GameState): string | undefined {
  if (!state) return undefined;
  // ⚡ Bolt: Prevent O(N) array scans by delegating to O(1) cached lookup
  return findWarrior(state, undefined, name)?.id;
}

// ─── Stable Link ───────────────────────────────────────────────────────────

interface StableLinkProps {
  name: string;
  className?: string;
  children?: React.ReactNode;
}

export function StableLink({ name, className, children }: StableLinkProps) {
  const state = useWorldState();

  // Resolve stable name to owner ID
  // ⚡ Bolt: Prevent O(N) array scans by delegating to O(1) cached lookup
  const stableId = findStableId(state, name);

  if (!stableId) {
    return <span className={className}>{children ?? name}</span>;
  }

  return (
    <Sheet>
      <Tooltip>
        <TooltipTrigger asChild>
          <SheetTrigger
            className={cn(
              'text-arena-gold hover:underline underline-offset-2 transition-colors cursor-pointer text-left font-bold',
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
        <SheetHeader className="pb-4 border-b">
          <SheetTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Landmark className="h-5 w-5 text-arena-gold" />
              Stable Records
            </div>
            {isPlayer ? (
              <Link to="/ops/overview">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground"
                  title="View full stable"
                  aria-label="View full stable"
                >
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </Link>
            ) : stableId ? (
              <Link to="/world/stable/$id" params={{ id: stableId }}>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground"
                  title="View full stable"
                  aria-label="View full stable"
                >
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </Link>
            ) : null}
          </SheetTitle>
        </SheetHeader>
        <div className="mt-6 h-full">
          <StableDossier stableId={stableId} stableName={name} />
        </div>
      </SheetContent>
    </Sheet>
  );
}

export { WarriorLink as WarriorLinkSheet, StableLink as StableLinkSheet };
