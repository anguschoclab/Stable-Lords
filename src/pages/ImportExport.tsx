/**
 * Import/Export Manager — JSON/YAML save packs.
 * Spec: Feature Matrix #27, route `/import-export`.
 */
import { useRef } from 'react';
import { Upload, FileJson, FileText } from 'lucide-react';
import { toast } from 'sonner';
import { PageHeader } from '@/components/ui/PageHeader';
import { PageFrame } from '@/components/ui/PageFrame';
import { Surface } from '@/components/ui/Surface';
import { SectionDivider } from '@/components/ui/SectionDivider';
import { useGameStore, reconstructGameState } from '@/state/useGameStore';
import { exportPack, importPack } from '@/lib/importExport';

function download(filename: string, text: string, mime: string) {
  const blob = new Blob([text], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * Import export page.
 */
export default function ImportExport() {
  const week = useGameStore((s) => s.week);
  const loadGame = useGameStore((s) => s.loadGame);
  const activeSlotId = useGameStore((s) => s.activeSlotId);
  const fileRef = useRef<HTMLInputElement>(null);

  const doExport = (format: 'json' | 'yaml') => {
    const state = reconstructGameState(useGameStore.getState());
    const text = exportPack(state, format);
    download(`stable-lords-w${week}-pack.${format === 'yaml' ? 'yaml' : 'json'}`, text,
      format === 'yaml' ? 'application/x-yaml' : 'application/json');
    toast.success(`Exported save pack (${format.toUpperCase()}).`);
  };

  const doImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const content = ev.target?.result;
        if (typeof content !== 'string') throw new Error('Invalid file content');
        const pack = importPack(content);
        loadGame(activeSlotId || 'autosave', pack.state);
        toast.success(`Save pack imported — week ${pack.state.week}.`);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Failed to import pack.');
      }
    };
    reader.onerror = () => toast.error('Failed to read file.');
    reader.readAsText(file);
  };

  return (
    <PageFrame maxWidth="lg">
      <PageHeader
        icon={FileJson}
        eyebrow="Utilities"
        title="Import / Export"
        subtitle="SAVE PACKS · JSON & YAML"
      />

      <div className="space-y-8">
        <div>
          <SectionDivider label="Export" variant="gold" />
          <Surface variant="glass" className="p-6 mt-4">
            <p className="text-xs text-muted-foreground mb-4">
              Export the current save as a Stable Lords pack. Packs embed the full game
              state and validate on import.
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => doExport('json')}
                className="flex items-center gap-2 px-4 py-2 text-[10px] font-black uppercase tracking-widest border border-primary/40 bg-primary/10 text-primary hover:bg-primary/20 rounded-none transition-colors motion-reduce:transition-none"
              >
                <FileJson className="h-3.5 w-3.5" />
                Export JSON
              </button>
              <button
                type="button"
                onClick={() => doExport('yaml')}
                className="flex items-center gap-2 px-4 py-2 text-[10px] font-black uppercase tracking-widest border border-arena-gold/40 bg-arena-gold/10 text-arena-gold hover:bg-arena-gold/20 rounded-none transition-colors motion-reduce:transition-none"
              >
                <FileText className="h-3.5 w-3.5" />
                Export YAML
              </button>
            </div>
          </Surface>
        </div>

        <div>
          <SectionDivider label="Import" variant="gold" />
          <Surface variant="glass" className="p-6 mt-4">
            <p className="text-xs text-muted-foreground mb-4">
              Import a Stable Lords pack (.json or .yaml). The embedded state is
              validated against the save schema before loading. This replaces the
              current session.
            </p>
            <input
              ref={fileRef}
              type="file"
              accept=".json,.yaml,.yml,application/json,application/x-yaml"
              className="hidden"
              onChange={doImport}
              aria-label="Choose save pack file"
            />
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="flex items-center gap-2 px-4 py-2 text-[10px] font-black uppercase tracking-widest border border-white/10 text-foreground/80 hover:bg-white/5 rounded-none transition-colors motion-reduce:transition-none"
            >
              <Upload className="h-3.5 w-3.5" />
              Choose Pack File
            </button>
          </Surface>
        </div>
      </div>
    </PageFrame>
  );
}
