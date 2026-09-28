/**
 * Stable Lords — Start Game Page (Title Screen)
 * Codex Sanguis design: Roman Imperial Archive aesthetic
 * New Game → name stable → Orphanage | Continue | Load | Delete saves
 */
import { MAX_SAVE_SLOTS } from '@/state/saveSlots';
import ColomseumArch from '@/components/startGame/ColomseumArch';
import NewGameForm from '@/components/startGame/NewGameForm';
import TitleScreenHero from '@/components/startGame/TitleScreenHero';
import ActionButtons from '@/components/startGame/ActionButtons';
import SavedGamesSection from '@/components/startGame/SavedGamesSection';
import { formatDate } from '@/utils/dateUtils';
import { useStartGame } from '@/pages/startGame/useStartGame';
import { DeleteSaveDialog } from '@/pages/startGame/DeleteSaveDialog';

// ─── Main Component ───────────────────────────────────────────────────────────

type StartGameFlow = ReturnType<typeof useStartGame>;

/** The imperial title screen: hero, actions, save list, delete dialog. */
function TitleScreen({ flow }: { flow: StartGameFlow }) {
  const {
    setScreen,
    slots,
    deleteTarget,
    setDeleteTarget,
    mostRecent,
    loadSlot,
    handleDelete,
    handleImport,
    handleExport,
  } = flow;

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden"
      style={{ background: 'hsl(var(--background))' }}
    >
      <ColomseumArch />

      <div className="relative z-10 w-full max-w-md space-y-10">
        <TitleScreenHero />

        <ActionButtons
          mostRecent={mostRecent}
          slots={slots}
          maxSaveSlots={MAX_SAVE_SLOTS}
          onContinue={() => mostRecent && loadSlot(mostRecent.id)}
          onNewGame={() => setScreen('newGame')}
          onImport={handleImport}
        />

        <SavedGamesSection
          slots={slots}
          maxSaveSlots={MAX_SAVE_SLOTS}
          onLoad={(slotId) => loadSlot(slotId)}
          onExport={handleExport}
          onDelete={(slot) => setDeleteTarget(slot)}
          formatDate={formatDate}
        />

        {/* ── Footer ── */}
        <div className="text-center space-y-1">
          <p className="text-[9px] font-black uppercase tracking-[0.35em] text-muted-foreground/25">
            Stable Lords v2.0
          </p>
          <p className="text-[8px] text-muted-foreground/20 italic">All records saved locally</p>
        </div>
      </div>

      {/* ── Delete Confirmation ── */}
      <DeleteSaveDialog
        deleteTarget={deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onDelete={handleDelete}
      />
    </div>
  );
}

/**
 * Start game.
 */
export default function StartGame() {
  const flow = useStartGame();
  const {
    screen,
    setScreen,
    ownerName,
    setOwnerName,
    stableName,
    setStableName,
    playerCrest,
    setPlayerCrest,
    backstoryId,
    setBackstoryId,
    canCreate,
    handleNewGame,
  } = flow;

  // ── New Game Screen ────────────────────────────────────────────────────────

  if (screen === 'newGame') {
    return (
      <NewGameForm
        ownerName={ownerName}
        setOwnerName={setOwnerName}
        stableName={stableName}
        setStableName={setStableName}
        playerCrest={playerCrest}
        setPlayerCrest={setPlayerCrest}
        backstoryId={backstoryId}
        setBackstoryId={setBackstoryId}
        onBack={() => setScreen('title')}
        onSubmit={handleNewGame}
        canCreate={canCreate}
      />
    );
  }

  // ── Title Screen ──────────────────────────────────────────────────────────

  return <TitleScreen flow={flow} />;
}
