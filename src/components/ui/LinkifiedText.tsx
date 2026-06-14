import React, { useMemo } from 'react';
import { WarriorLink } from '@/components/EntityLink';

/**
 * Module-level cache to prevent duplicate regex compilations across many components.
 */
const linkifyCache = new WeakMap<
  string[],
  {
    pattern: RegExp | null;
    nameSet: Set<string>;
  }
>();

interface LinkifiedTextProps {
  text: string;
  names: string[];
}

/**
 * Renders text with known entity names replaced by clickable WarriorLink components.
 * Names are matched longest-first to avoid partial matches.
 */
export function LinkifiedText({ text, names }: LinkifiedTextProps) {
  // ⚡ Bolt: Memoize the regular expression creation and string splitting using a module-level cache.
  // EventLog passes the exact same `names` array (e.g. `allWarriorNames`) to many `LinkifiedText`
  // instances. React's `useMemo` is component-scoped, meaning if we have 50 events,
  // we were still creating 50 regular expressions and 50 sets on first mount.
  // This WeakMap cache ensures we only compile the regex once for a given names array reference.
  const { parts, nameSet, isLinkifiable } = useMemo(() => {
    if (!names || names.length === 0) {
      return { parts: [text], nameSet: new Set<string>(), isLinkifiable: false };
    }

    let cached = linkifyCache.get(names);
    if (!cached) {
      const sorted = [...names].sort((a, b) => b.length - a.length);
      const escaped = sorted.map((n) => n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));

      cached = {
        pattern: escaped.length > 0 ? new RegExp(`(${escaped.join('|')})`, 'g') : null,
        nameSet: new Set(names),
      };
      linkifyCache.set(names, cached);
    }

    if (!cached.pattern) {
      return { parts: [text], nameSet: cached.nameSet, isLinkifiable: false };
    }

    return {
      parts: text.split(cached.pattern),
      nameSet: cached.nameSet,
      isLinkifiable: true,
    };
  }, [text, names]);

  if (!isLinkifiable) return <>{text}</>;

  return (
    <>
      {parts.map((part, i) =>
        nameSet.has(part) ? (
          <WarriorLink key={`${part}-${i}`} name={part} className="font-semibold" />
        ) : (
          <React.Fragment key={`${part}-${i}`}>{part}</React.Fragment>
        )
      )}
    </>
  );
}
