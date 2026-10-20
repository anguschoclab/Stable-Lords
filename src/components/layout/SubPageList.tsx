import { Fragment } from 'react';
import { Link } from '@tanstack/react-router';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { HUBS, type HubId } from './navigationHubs';

type LinkComp = React.ComponentType<{
  to: string;
  children: React.ReactNode;
  className?: string;
}>;

interface SubPageListProps {
  activeHubId: HubId | null;
  currentPath: string;
  LinkComponent?: LinkComp;
  pageLinkClassName?: string;
  iconClassName?: string;
  useMotionIndicator?: boolean;
  animationDuration?: number;
}

/** One page entry: optional section header, active indicator, icon + label. */
function NavPageLink({
  page,
  currentPath,
  isFirstInSection,
  LinkComponent,
  pageLinkClassName,
  iconClassName,
  useMotionIndicator,
  animationDuration,
}: {
  page: { to: string; exact?: boolean; section?: string; icon: React.ElementType; label: string };
  currentPath: string;
  isFirstInSection: boolean;
  LinkComponent: LinkComp;
  pageLinkClassName?: string;
  iconClassName?: string;
  useMotionIndicator: boolean;
  animationDuration: number;
}) {
  const isActive = page.exact
    ? currentPath === page.to
    : currentPath === page.to || currentPath.startsWith(`${page.to}/`);
  const PageIcon = page.icon;

  return (
    <Fragment>
      {isFirstInSection && (
        <h3 className="mt-3 px-3 pb-1 text-[8px] font-black uppercase tracking-[0.15em] text-muted-foreground/40 first:mt-0">
          {page.section}
        </h3>
      )}
      <LinkComponent
        to={page.to}
        className={cn(
          'relative flex items-center gap-2.5 px-3 py-1.5 rounded-none',
          'text-[10px] font-black uppercase tracking-wider transition-all motion-reduce:transition-none motion-reduce:transform-none duration-150 group',
          isActive
            ? 'text-foreground bg-white/8'
            : 'text-muted-foreground/50 hover:text-foreground/80 hover:bg-white/5',
          pageLinkClassName
        )}
      >
        {useMotionIndicator && isActive && (
          <motion.div
            layoutId="leftnav-page-indicator"
            className="absolute left-0 top-0 bottom-0 w-0.5 bg-primary"
            transition={{ duration: animationDuration, ease: [0.16, 1, 0.3, 1] }}
          />
        )}
        {!useMotionIndicator && isActive && (
          <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-primary" />
        )}
        <PageIcon
          className={cn(
            'h-3.5 w-3.5 shrink-0 transition-colors motion-reduce:transition-none',
            isActive
              ? 'text-primary'
              : 'text-muted-foreground/40 group-hover:text-muted-foreground/70',
            iconClassName
          )}
        />
        <span className="relative">{page.label}</span>
      </LinkComponent>
    </Fragment>
  );
}

/**
 *
 */
export function SubPageList(props: SubPageListProps) {
  const {
    activeHubId,
    currentPath,
    LinkComponent = Link,
    pageLinkClassName,
    iconClassName,
  } = props;
  const { useMotionIndicator = true, animationDuration = 0.3 } = props;
  const pages = HUBS.find((h) => h.id === activeHubId)?.pages ?? [];

  return (
    <AnimatePresence mode="wait">
      {activeHubId && (
        <motion.div
          key={activeHubId}
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -8 }}
          transition={{ duration: animationDuration, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-col gap-0.5 px-2"
        >
          {pages.map((page, index) => {
            const previous = pages[index - 1] as { section?: string } | undefined;
            const startsSection =
              (page as { section?: string }).section !== undefined &&
              (page as { section?: string }).section !== previous?.section;

            return (
              <NavPageLink
                key={page.to}
                page={page}
                currentPath={currentPath}
                isFirstInSection={startsSection}
                LinkComponent={LinkComponent}
                pageLinkClassName={pageLinkClassName}
                iconClassName={iconClassName}
                useMotionIndicator={useMotionIndicator}
                animationDuration={animationDuration}
              />
            );
          })}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
