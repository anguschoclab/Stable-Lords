import { useState } from 'react';
import { BookOpen } from 'lucide-react';
import { PageFrame } from '@/components/ui/PageFrame';
import { PageHeader } from '@/components/ui/PageHeader';
import { SectionDivider } from '@/components/ui/SectionDivider';
import { Input } from '@/components/ui/input';
import { FightingStyle, STYLE_DISPLAY_NAMES } from '@/types/shared.types';
import { STYLE_COMPENDIUM } from '@/data/styleCompendium';
import { StyleCard } from './styleArchives/StyleCard';

/** Whether a style's archive entry matches the search query. */
function styleMatches(style: FightingStyle, normalized: string): boolean {
  const name = STYLE_DISPLAY_NAMES[style];
  const entry = STYLE_COMPENDIUM[style];
  const haystack = [name, entry.archetype, entry.description, ...entry.hallmarks]
    .join(' ')
    .toLowerCase();
  return haystack.includes(normalized);
}

/** Style Archives — encyclopedia for the ten canonical fighting styles. */
export default function StyleArchives() {
  const [query, setQuery] = useState('');
  const styles = Object.values(FightingStyle);
  const normalized = query.trim().toLowerCase();
  const filtered = normalized ? styles.filter((s) => styleMatches(s, normalized)) : styles;

  return (
    <PageFrame>
      <PageHeader
        eyebrow="World"
        title="Style Archives"
        subtitle={`WORLD · COMPENDIUM · ${styles.length} FIGHTING STYLES`}
        icon={BookOpen}
        actions={
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search the archives…"
            aria-label="Search styles"
            className="w-56 h-9 rounded-none border-white/10 bg-white/[0.02] text-xs"
          />
        }
      />

      <section>
        <SectionDivider label="The Ten Disciplines" variant="primary" />
        <div className="mt-8 grid grid-cols-1 xl:grid-cols-2 gap-6">
          {filtered.map((style) => (
            <StyleCard key={style} style={style} />
          ))}
        </div>
        {filtered.length === 0 && (
          <div className="mt-8 py-16 text-center border border-dashed border-white/10">
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/40">
              No disciplines match your query
            </p>
          </div>
        )}
      </section>
    </PageFrame>
  );
}
