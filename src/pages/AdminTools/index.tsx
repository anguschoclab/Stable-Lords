import { PageHeader } from '@/components/ui/PageHeader';
import { PageFrame } from '@/components/ui/PageFrame';
import { Surface } from '@/components/ui/Surface';
import { SectionDivider } from '@/components/ui/SectionDivider';
import { Terminal } from 'lucide-react';
import { cn } from '@/lib/utils';
import ArenaSettings from '@/components/layout/ArenaSettings';
import { useAdminTools } from './hooks/useAdminTools';
import { CategoryNav } from './components/CategoryNav';
import { SystemPanel } from './components/SystemPanel';
import { WorldPanel } from './components/WorldPanel';
import { EconomyPanel } from './components/EconomyPanel';
import { TelemetryPanel } from './components/TelemetryPanel';

/** UNLOCKED/LOCKED authorization chip in the header actions. */
function AuthBadge({ ftueComplete }: { ftueComplete: boolean }) {
  return (
    <div className="flex items-center gap-4">
      <div className="flex flex-col items-end px-4 border-r border-white/5">
        <span className="text-[8px] font-black uppercase tracking-widest text-muted-foreground/40 mb-1">
          Authorization
        </span>
        <span
          className={cn(
            'text-[10px] font-black uppercase tracking-widest',
            ftueComplete ? 'text-primary' : 'text-destructive'
          )}
        >
          {ftueComplete ? 'UNLOCKED' : 'LOCKED'}
        </span>
      </div>
    </div>
  );
}

/** Category → panel switch for the admin main column. */
function CategoryPanels({ tools }: { tools: ReturnType<typeof useAdminTools> }) {
  const {
    activeCategory,
    handleExport,
    handleImport,
    skipWeek,
    skipSeason,
    skipFTUE,
    resetRivals,
    forceMastery,
    doReset,
    week,
    season,
    treasury,
    fame,
    roster,
    player,
  } = tools;

  return (
    <main className="lg:col-span-9 space-y-12">
      {activeCategory === 'SYSTEM' && (
        <SystemPanel onExport={handleExport} onImport={handleImport} onReset={doReset} />
      )}

      {activeCategory === 'WORLD' && (
        <WorldPanel onSkipWeek={skipWeek} onSkipSeason={skipSeason} onSkipFTUE={skipFTUE} />
      )}

      {activeCategory === 'ECONOMY' && (
        <EconomyPanel onForceMastery={forceMastery} onResetRivals={resetRivals} />
      )}

      {activeCategory === 'TELEMETRY' && (
        <TelemetryPanel
          week={week}
          season={season}
          treasury={treasury}
          fame={fame}
          rosterSize={roster.length}
          player={player as unknown as Record<string, unknown>}
        />
      )}

      {activeCategory === 'PREFERENCES' && (
        <div className="space-y-12">
          <SectionDivider label="Arena Parameters" />
          <div className="max-w-2xl">
            <ArenaSettings />
          </div>
        </div>
      )}
    </main>
  );
}

/**
 *
 */
export default function AdminTools() {
  const tools = useAdminTools();
  const { activeCategory, setActiveCategory, ftueComplete } = tools;

  return (
    <PageFrame maxWidth="lg" className="pb-32">
      <PageHeader
        icon={Terminal}
        eyebrow="Administration"
        title="Administration"
        subtitle="Censor · Override · Archive"
        actions={<AuthBadge ftueComplete={ftueComplete} />}
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
        <aside className="lg:col-span-3 space-y-8 sticky top-6">
          <SectionDivider label="Access Level" />
          <Surface variant="glass" className="p-2 space-y-1 border-white/5">
            <CategoryNav activeCategory={activeCategory} onSelect={setActiveCategory} />
          </Surface>
        </aside>

        <CategoryPanels tools={tools} />
      </div>
    </PageFrame>
  );
}
