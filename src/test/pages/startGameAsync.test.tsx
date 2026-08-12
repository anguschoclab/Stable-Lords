import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockLoadGame = vi.fn();

vi.mock('@/state/useGameStore', () => ({
  useGameStore: vi.fn((selector?: any) => {
    const store = { loadGame: mockLoadGame };
    return typeof selector === 'function' ? selector(store) : store;
  }),
}));

vi.mock('@/state/saveSlots', () => ({
  listSaveSlots: vi.fn().mockResolvedValue([]),
  loadFromSlot: vi.fn(),
  deleteSlot: vi.fn().mockResolvedValue(undefined),
  saveToSlot: vi.fn().mockResolvedValue(undefined),
  newSlotId: vi.fn().mockReturnValue('slot_test_1'),
  exportSlot: vi.fn(),
  importSaveToNewSlot: vi.fn(),
  MAX_SAVE_SLOTS: 10,
}));

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

vi.mock('@/utils/cryptoRandom', () => ({
  cryptoRandomInt: vi.fn().mockReturnValue(42),
}));

vi.mock('@/engine/crest/crestGenerator', () => ({
  generateCrest: vi.fn().mockReturnValue({ colors: {}, symbol: 'eagle' }),
}));

vi.mock('@/data/backstories', () => ({
  applyBackstoryToPlayer: vi.fn(),
  BACKSTORY_IDS: ['orphan', 'noble'],
  BACKSTORIES: [
    { id: 'orphan', name: 'Orphan', description: 'Test' },
    { id: 'noble', name: 'Noble', description: 'Test' },
  ],
}));

vi.mock('@/engine/pipeline/passes/RankingsPass', () => ({
  runRankingsPass: vi.fn().mockReturnValue({ impacts: [] }),
}));

vi.mock('@/engine/pipeline/passes/PromoterPass', () => ({
  runPromoterPass: vi.fn().mockReturnValue({ impacts: [] }),
}));

vi.mock('@/engine/impacts', () => ({
  resolveImpacts: vi.fn().mockImplementation((state) => state),
}));

vi.mock('@/components/startGame/ColomseumArch', () => ({
  default: () => null,
}));

vi.mock('@/components/startGame/NewGameForm', () => ({
  default: ({
    onSubmit,
    ownerName,
    setOwnerName,
    stableName,
    setStableName,
    canCreate,
    setBackstoryId,
  }: any) => (
    <div>
      <input
        aria-label="Owner Name"
        value={ownerName}
        onChange={(e) => setOwnerName(e.target.value)}
      />
      <input
        aria-label="Stable Name"
        value={stableName}
        onChange={(e) => setStableName(e.target.value)}
      />
      <button onClick={() => setBackstoryId('orphan')} aria-label="Select Backstory">
        Orphan
      </button>
      <button onClick={onSubmit} disabled={!canCreate} aria-label="Create Game">
        Create
      </button>
    </div>
  ),
}));

vi.mock('@/components/startGame/TitleScreenHero', () => ({
  default: () => <div data-testid="hero" />,
}));

vi.mock('@/components/startGame/ActionButtons', () => ({
  default: ({ onNewGame }: any) => (
    <button onClick={onNewGame} aria-label="New Game">
      New Game
    </button>
  ),
}));

let mockOnLoad: ((slotId: string) => void) | null = null;

vi.mock('@/components/startGame/SavedGamesSection', () => ({
  default: ({ onLoad }: any) => {
    mockOnLoad = onLoad;
    return null;
  },
}));

vi.mock('@/utils/dateUtils', () => ({
  formatDate: vi.fn().mockReturnValue('2024-01-01'),
}));

import StartGame from '@/pages/StartGame';
import { saveToSlot, loadFromSlot } from '@/state/saveSlots';
import { toast } from 'sonner';

describe('#5 StartGame handleNewGame awaits saveToSlot', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('handleNewGame awaits saveToSlot before calling loadGame', async () => {
    render(<StartGame />);

    fireEvent.click(screen.getByLabelText('New Game'));

    fireEvent.change(screen.getByLabelText('Owner Name'), { target: { value: 'TestOwner' } });
    fireEvent.change(screen.getByLabelText('Stable Name'), { target: { value: 'TestStable' } });
    fireEvent.click(screen.getByLabelText('Select Backstory'));

    fireEvent.click(screen.getByLabelText('Create Game'));

    await waitFor(() => {
      expect(saveToSlot).toHaveBeenCalledOnce();
    });

    await waitFor(() => {
      expect(mockLoadGame).toHaveBeenCalledOnce();
    });

    expect(saveToSlot).toHaveBeenCalledBefore(mockLoadGame);
  });
});

describe('StartGame loadSlot failure handling', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls toast.error when loadFromSlot returns null', async () => {
    vi.mocked(loadFromSlot).mockResolvedValue(null);

    render(<StartGame />);

    // Trigger loadSlot via the SavedGamesSection onLoad callback
    expect(mockOnLoad).not.toBeNull();
    mockOnLoad!('slot_test_1');

    await waitFor(() => {
      expect(loadFromSlot).toHaveBeenCalledWith('slot_test_1');
      expect(toast.error).toHaveBeenCalled();
    });
  });

  it('does NOT call loadGame when loadFromSlot returns null', async () => {
    vi.mocked(loadFromSlot).mockResolvedValue(null);

    render(<StartGame />);

    mockOnLoad!('slot_test_1');

    await waitFor(() => {
      expect(loadFromSlot).toHaveBeenCalled();
    });

    // Give any pending microtasks a chance to flush
    await new Promise((r) => setTimeout(r, 50));
    expect(mockLoadGame).not.toHaveBeenCalled();
  });
});
