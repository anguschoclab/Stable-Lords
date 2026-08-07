import React, { useMemo } from 'react';
import { WarriorLink, StableLink } from '@/components/EntityLink';

/**
 * Module-level cache to prevent duplicate regex compilations across many components.
 */
const linkifyCache = new WeakMap<
  string[],
  {
    pattern: RegExp | null;
    warriorNameSet: Set<string>;
    stableNameSet: Set<string>;
  }
>();

interface LinkifiedTextProps {
  text: string;
  names: string[];
  stableNames?: string[];
}

/**
 * Renders text with known entity names replaced by clickable WarriorLink/StableLink components.
 * Names are matched longest-first to avoid partial matches.
 */
export function LinkifiedText({ text, names, stableNames }: LinkifiedTextProps) {
  const combinedNames = useMemo(() => {
    if (!stableNames || stableNames.length === 0) return names;
    return [...names, ...stableNames];
  }, [names, stableNames]);

  const { parts, warriorNameSet, stableNameSet, isLinkifiable } = useMemo(() => {
    if (!combinedNames || combinedNames.length === 0) {
      return {
        parts: [text],
        warriorNameSet: new Set<string>(),
        stableNameSet: new Set<string>(),
        isLinkifiable: false,
      };
    }

    let cached = linkifyCache.get(combinedNames);
    if (!cached) {
      const sorted = [...combinedNames].sort((a, b) => b.length - a.length);
      const escaped = sorted.map((n) => n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));

      cached = {
        pattern: escaped.length > 0 ? new RegExp(`(${escaped.join('|')})`, 'g') : null,
        warriorNameSet: new Set(names),
        stableNameSet: new Set(stableNames ?? []),
      };
      linkifyCache.set(combinedNames, cached);
    }

    if (!cached.pattern) {
      return {
        parts: [text],
        warriorNameSet: cached.warriorNameSet,
        stableNameSet: cached.stableNameSet,
        isLinkifiable: false,
      };
    }

    return {
      parts: text.split(cached.pattern),
      warriorNameSet: cached.warriorNameSet,
      stableNameSet: cached.stableNameSet,
      isLinkifiable: true,
    };
  }, [text, combinedNames, names, stableNames]);

  if (!isLinkifiable) return <>{text}</>;

  return (
    <>
      {parts.map((part, i) =>
        stableNameSet.has(part) ? (
          <StableLink key={`${part}-${i}`} name={part} className="font-semibold" />
        ) : warriorNameSet.has(part) ? (
          <WarriorLink key={`${part}-${i}`} name={part} className="font-semibold" />
        ) : (
          <React.Fragment key={`${part}-${i}`}>{part}</React.Fragment>
        )
      )}
    </>
  );
}
