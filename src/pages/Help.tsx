import { useState, useMemo } from 'react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { PageHeader } from '@/components/ui/PageHeader';
import { BookOpen } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  loadA11yPrefs,
  saveA11yPrefs,
  applyA11yPrefs,
  TEXT_SCALE_OPTIONS,
  type A11yPrefs,
} from '@/lib/a11yPrefs';
import { searchBibleDocs } from '@/lib/bibleIndex';
import {
  AttributesSection,
  CombatResolutionSection,
  EquipmentSection,
  FightingStylesSection,
  InsightTokensSection,
  ProgressionSection,
  StrategyBasicsSection,
  TrainersSection,
} from './help/sections';

/**
 * Design Bible search — queries the spec corpus in /docs at section level.
 */
function BibleSearch() {
  const [query, setQuery] = useState('');
  const hits = useMemo(() => searchBibleDocs(query), [query]);

  return (
    <div className="space-y-3">
      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search the design bible…"
        aria-label="Search the design bible"
        className="w-full bg-input border border-border px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 rounded-none focus:outline-none focus:ring-1 focus:ring-ring"
      />
      {query.trim() !== '' && (
        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/50">
          {hits.length} {hits.length === 1 ? 'result' : 'results'}
        </p>
      )}
      <ul className="space-y-2">
        {hits.map((hit, i) => (
          <li key={`${hit.docId}-${i}`} className="border-l-2 border-arena-gold/30 pl-3 py-1">
            <div className="text-[10px] font-black uppercase tracking-widest text-arena-gold/80">
              {hit.docTitle}
            </div>
            <div className="text-[9px] font-black uppercase tracking-wider text-muted-foreground/60">
              {hit.heading}
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed mt-1">{hit.snippet}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}

/**
 * Accessibility settings — high contrast + text scale, persisted to
 * localStorage and applied to the document root.
 */
function AccessibilitySettings() {
  const [prefs, setPrefs] = useState<A11yPrefs>(() => loadA11yPrefs());

  const update = (next: A11yPrefs) => {
    setPrefs(next);
    saveA11yPrefs(next);
    applyA11yPrefs(next);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <div className="text-sm font-semibold text-foreground">High Contrast</div>
          <p className="text-xs text-muted-foreground">
            Brighter text, stronger borders, reduced background textures.
          </p>
        </div>
        <button
          type="button"
          role="button"
          aria-pressed={prefs.contrast === 'high'}
          onClick={() =>
            update({ ...prefs, contrast: prefs.contrast === 'high' ? 'standard' : 'high' })
          }
          className={cn(
            'px-3 py-1.5 text-[10px] font-black uppercase tracking-widest border rounded-none transition-colors motion-reduce:transition-none',
            prefs.contrast === 'high'
              ? 'bg-primary/20 text-primary border-primary/40'
              : 'text-muted-foreground border-white/10 hover:bg-white/5'
          )}
        >
          {prefs.contrast === 'high' ? 'High Contrast: On' : 'High Contrast: Off'}
        </button>
      </div>
      <div className="flex items-center justify-between gap-4">
        <div>
          <div className="text-sm font-semibold text-foreground">Text Size</div>
          <p className="text-xs text-muted-foreground">
            Scales all interface text and layout.
          </p>
        </div>
        <div className="flex gap-1">
          {TEXT_SCALE_OPTIONS.map((scale) => (
            <button
              key={scale}
              type="button"
              aria-pressed={prefs.textScale === scale}
              onClick={() => update({ ...prefs, textScale: scale })}
              className={cn(
                'px-2.5 py-1.5 text-[10px] font-mono font-black border rounded-none transition-colors motion-reduce:transition-none',
                prefs.textScale === scale
                  ? 'bg-primary/20 text-primary border-primary/40'
                  : 'text-muted-foreground border-white/10 hover:bg-white/5'
              )}
            >
              {scale}%
            </button>
          ))}
        </div>
      </div>
      <p className="text-[10px] text-muted-foreground/60">
        Reduced-motion preferences are always honored via your system setting.
      </p>
    </div>
  );
}

/**
 * Help.
 */
export default function Help() {
  return (
    <div className="space-y-6 max-w-3xl">
      <PageHeader icon={BookOpen} title="Codex · Help" subtitle="RULES · STRATEGY · REFERENCE" />

      <Accordion
        type="multiple"
        defaultValue={[
          'strategy',
          'styles',
          'attributes',
          'equipment',
          'trainers',
          'combat',
          'moods',
          'accessibility',
        ]}
      >
        <StrategyBasicsSection />
        <FightingStylesSection />
        <AttributesSection />
        <EquipmentSection />
        <TrainersSection />
        <CombatResolutionSection />
        <InsightTokensSection />
        <ProgressionSection />
        <AccordionItem value="accessibility">
          <AccordionTrigger className="font-display text-lg">Accessibility</AccordionTrigger>
          <AccordionContent>
            <AccessibilitySettings />
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="bible">
          <AccordionTrigger className="font-display text-lg">Design Bible</AccordionTrigger>
          <AccordionContent>
            <BibleSearch />
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}
