/**
 * MobileNav — Mobile navigation drawer using Sheet component
 * Provides hamburger menu + slide-out navigation for < md viewports
 */
import { useState } from 'react';
import { Link, useLocation } from '@tanstack/react-router';
import { cn } from '@/lib/utils';
import { HUBS, type HubId, useNavAlerts, HubSwitcher, SubPageList, AlertStrip } from './shared';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetClose,
} from '@/components/ui/sheet';
import { Swords, Menu } from 'lucide-react';

// ─── Component ───────────────────────────────────────────────────────────────

interface MobileNavProps {
  className?: string;
}

export function MobileNav({ className }: MobileNavProps) {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const currentPath = location.pathname;
  const { counts: alerts } = useNavAlerts({ trackWeek: false });

  const activeHubId = (HUBS.find((h) => currentPath === h.to || currentPath.startsWith(`${h.to}/`))
    ?.id ?? null) as HubId | null;

  // SheetClose wrapper for links
  const SheetCloseLink = ({
    to,
    children,
    className,
  }: {
    to: string;
    children: React.ReactNode;
    className?: string;
  }) => (
    <SheetClose asChild>
      <Link to={to} className={className}>
        {children}
      </Link>
    </SheetClose>
  );

  return (
    <div className={cn('flex md:hidden', className)}>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-10 w-10 rounded-none hover:bg-white/5 transition-colors"
            aria-label="Open navigation menu"
          >
            <Menu className="h-5 w-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-72 bg-[#0C0806] border-r border-white/5 p-0">
          <SheetHeader className="p-4 border-b border-white/5">
            <SheetTitle className="font-display text-sm font-black uppercase tracking-widest text-foreground flex items-center gap-3">
              <Swords className="h-4 w-4 text-primary" />
              Navigation
            </SheetTitle>
          </SheetHeader>

          <div className="flex flex-col h-[calc(100vh-80px)] overflow-hidden">
            {/* Hub switcher */}
            <HubSwitcher
              activeHubId={activeHubId}
              alerts={alerts}
              alertLinks={{
                command: '/command/training',
                ops: '/ops/contracts',
                world: '/world/tournaments',
              }}
              LinkComponent={SheetCloseLink}
              showChevron={true}
              linkClassName="px-3 py-3"
            />

            {/* Sub-page list for active hub */}
            <div className="flex-1 overflow-y-auto py-2">
              <SubPageList
                activeHubId={activeHubId}
                currentPath={currentPath}
                LinkComponent={SheetCloseLink}
                useMotionIndicator={false}
                animationDuration={0.2}
                pageLinkClassName="px-3 py-2.5"
              />
            </div>

            {/* Bottom alert strip */}
            <AlertStrip alerts={alerts} LinkComponent={SheetCloseLink} itemClassName="px-2 py-2" />
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
