/**
 * Import/Export Manager — JSON/YAML save packs.
 * Spec: Feature Matrix #27, route `/import-export`.
 */
import { useRef, useState } from 'react';
import { Upload, FileJson, FileText, Check, X } from 'lucide-react';
import { toast } from 'sonner';
import { PageHeader } from '@/components/ui/PageHeader';
import { PageFrame } from '@/components/ui/PageFrame';
import { Surface } from '@/components/ui/Surface';
import { SectionDivider } from '@/components/ui/SectionDivider';
import { useGameStore, reconstructGameState } from '@/state/useGameStore';
import { exportPack, importPack } from '@/lib/importExport';
import { readFileInput } from '@/utils/fileInput';

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
  const [pendingPack, setPendingPack] = useState<ReturnType<typeof importPack> | null>(null);

  const doExport = (format: 'json' | 'yaml') => {
    const state = reconstructGameState(useGameStore.getState());
    const text = exportPack(state, format);
    download(
      `stable-lords-w${week}-pack.${format === 'yaml' ? 'yaml' : 'json'}`,
      text,
      format === 'yaml' ? 'application/x-yaml' : 'application/json'
    );
    toast.success(`Exported save pack (${format.toUpperCase()}).`);
  };

  const doImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    readFileInput(
      e,
      (content) => setPendingPack(importPack(content)),
      (err) => toast.error(err instanceof Error ? err.message : 'Failed to import pack.')
    );
  };

  const confirmImport = () => {
    if (!pendingPack) return;
    loadGame(activeSlotId || 'autosave', pendingPack.state);
    toast.success(`Save pack imported — week ${pendingPack.state.week}.`);
    setPendingPack(null);
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
        <ExportSection onExport={doExport} />
        <ImportSection fileRef={fileRef} onImport={doImport} />
        <ImportPreview
          pack={pendingPack}
          onConfirm={confirmImport}
          onCancel={() => setPendingPack(null)}
        />
      </div>
    </PageFrame>
  );
}

/** Pending import preview — review the parsed pack before replacing the session. */
function ImportPreview({
  pack,
  onConfirm,
  onCancel,
}: {
  pack: ReturnType<typeof importPack> | null;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  if (!pack) return null;
  const stableName = pack.state.player?.stableName || 'Unknown Stable';
  return (
    <div role="status" aria-live="polite">
      <SectionDivider label="Import preview" variant="gold" />
      <Surface variant="glass" className="p-6 mt-4 border-arena-gold/40">
        <div className="space-y-4">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.15em] text-muted-foreground mb-1">
              Ready to import
            </p>
            <h2 className="font-display text-xl font-black uppercase text-foreground">
              {stableName}
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Week {pack.state.week} · Season {pack.state.season} · {pack.state.roster?.length || 0}{' '}
              warriors
            </p>
          </div>
          <p className="text-xs text-arena-blood bg-arena-blood/10 border border-arena-blood/30 p-3">
            Confirming replaces the current session with this save pack.
          </p>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={onConfirm}
              className="flex items-center gap-2 px-4 py-2 text-[10px] font-black uppercase tracking-widest border border-primary/40 bg-primary/10 text-primary hover:bg-primary/20 rounded-none transition-colors motion-reduce:transition-none"
            >
              <Check className="h-3.5 w-3.5" />
              Confirm Import
            </button>
            <button
              type="button"
              onClick={onCancel}
              className="flex items-center gap-2 px-4 py-2 text-[10px] font-black uppercase tracking-widest border border-white/10 text-foreground/80 hover:bg-white/5 rounded-none transition-colors motion-reduce:transition-none"
            >
              <X className="h-3.5 w-3.5" />
              Cancel Import
            </button>
          </div>
        </div>
      </Surface>
    </div>
  );
}

/** Export card — download the current save as a JSON or YAML pack. */
function ExportSection({ onExport }: { onExport: (format: 'json' | 'yaml') => void }) {
  return (
    <div>
      <SectionDivider label="Export" variant="gold" />
      <Surface variant="glass" className="p-6 mt-4">
        <p className="text-xs text-muted-foreground mb-4">
          Export the current save as a Stable Lords pack. Packs embed the full game state and
          validate on import.
        </p>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => onExport('json')}
            className="flex items-center gap-2 px-4 py-2 text-[10px] font-black uppercase tracking-widest border border-primary/40 bg-primary/10 text-primary hover:bg-primary/20 rounded-none transition-colors motion-reduce:transition-none"
          >
            <FileJson className="h-3.5 w-3.5" />
            Export JSON
          </button>
          <button
            type="button"
            onClick={() => onExport('yaml')}
            className="flex items-center gap-2 px-4 py-2 text-[10px] font-black uppercase tracking-widest border border-arena-gold/40 bg-arena-gold/10 text-arena-gold hover:bg-arena-gold/20 rounded-none transition-colors motion-reduce:transition-none"
          >
            <FileText className="h-3.5 w-3.5" />
            Export YAML
          </button>
        </div>
      </Surface>
    </div>
  );
}

/** Import card — pick a pack file and replace the current session. */
function ImportSection({
  fileRef,
  onImport,
}: {
  fileRef: React.RefObject<HTMLInputElement | null>;
  onImport: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) {
  return (
    <div>
      <SectionDivider label="Import" variant="gold" />
      <Surface variant="glass" className="p-6 mt-4">
        <p className="text-xs text-muted-foreground mb-4">
          Import a Stable Lords pack (.json or .yaml). The embedded state is validated against the
          save schema before loading. This replaces the current session.
        </p>
        <input
          ref={fileRef}
          type="file"
          accept=".json,.yaml,.yml,application/json,application/x-yaml"
          className="hidden"
          onChange={onImport}
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
  );
}
