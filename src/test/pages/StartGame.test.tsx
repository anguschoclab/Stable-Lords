// @vitest-environment jsdom
import { render, fireEvent, waitFor, screen, within } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import StartGame from '@/pages/StartGame';
import * as saveSlots from '@/state/saveSlots';
import { toast } from 'sonner';
import { TooltipProvider } from '@/components/ui/tooltip';

import { useGameStore } from '@/state/useGameStore';

vi.mock('@/state/saveSlots', () => ({
  listSaveSlots: vi.fn().mockResolvedValue([]),
  loadFromSlot: vi.fn(),
  deleteSlot: vi.fn(),
  saveToSlot: vi.fn(),
  newSlotId: vi.fn(),
  exportSlot: vi.fn(),
  importSaveToNewSlot: vi.fn(),
  MAX_SAVE_SLOTS: 10,
}));

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock('@/engine/crest/crestGenerator', () => ({
  generateCrest: vi.fn().mockReturnValue({
    shieldShape: 'heater',
    fieldType: 'solid',
    primaryColor: 'gules',
    metalColor: 'or',
    charge: { type: 'beast', name: 'Lion', count: 1 },
    generation: 0,
  }),
}));

vi.mock('@/components/startGame/ColomseumArch', () => ({
  default: () => <div data-testid="ColomseumArch" />,
}));

describe('StartGame', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Inject fake state into the real store — vi.mock's importOriginal arg
    // does not exist under bun:test.
    useGameStore.setState({ loadGame: vi.fn() } as never);
  });

  it('shows an error toast when import fails', async () => {
    // Arrange
    vi.mocked(saveSlots.importSaveToNewSlot).mockResolvedValue(null); // Will trigger "Import failed"

    // Set up FileReader mock BEFORE render
    const mockFileReader = {
      readAsText: vi.fn().mockImplementation(function (this: any, _file: Blob) {
        // Simulate successful file read
        if (this.onload) {
          this.onload({ target: { result: '{"invalid": "json"}' } } as any);
        }
      }),
      onload: null,
    };

    window.FileReader = vi.fn().mockImplementation(function () {
      return mockFileReader;
    }) as any;

    render(
      <TooltipProvider>
        <StartGame />
      </TooltipProvider>
    );

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    expect(fileInput).not.toBeNull();

    const file = new File(['{"invalid": "json"}'], 'save.json', { type: 'application/json' });
    fireEvent.change(fileInput, { target: { files: [file] } });

    await waitFor(() => {
      expect(saveSlots.importSaveToNewSlot).toHaveBeenCalledWith('{"invalid": "json"}');
      expect(toast.error).toHaveBeenCalledWith('Import failed');
    });
  });

  it('shows a load-failure toast when import succeeds but loadFromSlot returns null', async () => {
    vi.mocked(saveSlots.importSaveToNewSlot).mockResolvedValue('slot_imported_1');
    vi.mocked(saveSlots.loadFromSlot).mockResolvedValue(null);

    const mockFileReader = {
      readAsText: vi.fn().mockImplementation(function (this: any, _file: Blob) {
        if (this.onload) {
          this.onload({ target: { result: '{"valid": "json"}' } } as any);
        }
      }),
      onload: null,
    };

    window.FileReader = vi.fn().mockImplementation(function () {
      return mockFileReader;
    }) as any;

    render(
      <TooltipProvider>
        <StartGame />
      </TooltipProvider>
    );

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(['{"valid": "json"}'], 'save.json', { type: 'application/json' });
    fireEvent.change(fileInput, { target: { files: [file] } });

    await waitFor(() => {
      expect(saveSlots.importSaveToNewSlot).toHaveBeenCalledWith('{"valid": "json"}');
      expect(saveSlots.loadFromSlot).toHaveBeenCalledWith('slot_imported_1');
      expect(toast.error).toHaveBeenCalledWith(
        'Imported save could not be loaded — incompatible or corrupted. A backup has been saved.'
      );
    });
  });

  it('shows the error message when importSaveToNewSlot rejects with an Error', async () => {
    vi.mocked(saveSlots.importSaveToNewSlot).mockRejectedValue(new Error('corrupt payload'));

    const mockFileReader = {
      readAsText: vi.fn().mockImplementation(function (this: any, _file: Blob) {
        if (this.onload) {
          this.onload({ target: { result: '{"x": 1}' } } as any);
        }
      }),
      onload: null,
    };
    window.FileReader = vi.fn().mockImplementation(function () {
      return mockFileReader;
    }) as any;

    render(
      <TooltipProvider>
        <StartGame />
      </TooltipProvider>
    );

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    fireEvent.change(fileInput, {
      target: { files: [new File(['x'], 'save.json', { type: 'application/json' })] },
    });

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('corrupt payload');
    });
  });

  it('shows the fallback message when importSaveToNewSlot rejects with a non-Error', async () => {
    vi.mocked(saveSlots.importSaveToNewSlot).mockRejectedValue('oops' as never);

    const mockFileReader = {
      readAsText: vi.fn().mockImplementation(function (this: any, _file: Blob) {
        if (this.onload) {
          this.onload({ target: { result: '{"x": 1}' } } as any);
        }
      }),
      onload: null,
    };
    window.FileReader = vi.fn().mockImplementation(function () {
      return mockFileReader;
    }) as any;

    render(
      <TooltipProvider>
        <StartGame />
      </TooltipProvider>
    );

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    fireEvent.change(fileInput, {
      target: { files: [new File(['x'], 'save.json', { type: 'application/json' })] },
    });

    // (err as Error)?.message is undefined for a string rejection → fallback
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Failed to import save file.');
    });
  });

  it('shows "Import failed" when the file content is null', async () => {
    vi.mocked(saveSlots.importSaveToNewSlot).mockResolvedValue(null);

    const mockFileReader = {
      readAsText: vi.fn().mockImplementation(function (this: any, _file: Blob) {
        if (this.onload) {
          this.onload({ target: { result: null } } as any);
        }
      }),
      onload: null,
    };
    window.FileReader = vi.fn().mockImplementation(function () {
      return mockFileReader;
    }) as any;

    render(
      <TooltipProvider>
        <StartGame />
      </TooltipProvider>
    );

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    fireEvent.change(fileInput, {
      target: { files: [new File(['x'], 'save.json', { type: 'application/json' })] },
    });

    await waitFor(() => {
      expect(saveSlots.importSaveToNewSlot).toHaveBeenCalledWith(null);
      expect(toast.error).toHaveBeenCalledWith('Import failed');
    });
  });

  it('shows an error toast when the file read itself fails', async () => {
    const mockFileReader = {
      readAsText: vi.fn().mockImplementation(function (this: any, _file: Blob) {
        if (this.onerror) {
          this.onerror(new Error('read failed'));
        }
      }),
      onload: null,
      onerror: null,
    };
    window.FileReader = vi.fn().mockImplementation(function () {
      return mockFileReader;
    }) as any;

    render(
      <TooltipProvider>
        <StartGame />
      </TooltipProvider>
    );

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    fireEvent.change(fileInput, {
      target: { files: [new File(['x'], 'save.json', { type: 'application/json' })] },
    });

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Failed to read save file.');
    });
  });

  it('prioritizes continue for the newest save and loads that slot', async () => {
    const loadGame = vi.fn();
    useGameStore.setState({ loadGame } as never);
    vi.mocked(saveSlots.listSaveSlots).mockResolvedValue([
      { id: 'old', name: 'Old Stable', timestamp: '2025-01-01T00:00:00Z', week: 1, year: 1 },
      { id: 'new', name: 'New Stable', timestamp: '2025-01-03T00:00:00Z', week: 4, year: 1 },
    ] as any);
    vi.mocked(saveSlots.loadFromSlot).mockResolvedValue({ marker: 'state' } as any);

    render(
      <TooltipProvider>
        <StartGame />
      </TooltipProvider>
    );

    const continueButton = await screen.findByRole('button', { name: /Continue — New Stable/i });
    fireEvent.click(continueButton);

    await waitFor(() => {
      expect(saveSlots.loadFromSlot).toHaveBeenCalledWith('new');
      expect(loadGame).toHaveBeenCalledWith('new', { marker: 'state' });
    });
  });

  it('disables new game at the save cap with the reason on the action', async () => {
    vi.mocked(saveSlots.listSaveSlots).mockResolvedValue(
      Array.from({ length: 10 }, (_, i) => ({
        id: `slot-${i}`,
        name: `Stable ${i}`,
        timestamp: `2025-01-${String(i + 1).padStart(2, '0')}T00:00:00Z`,
        week: 1,
        year: 1,
      })) as any
    );

    render(
      <TooltipProvider>
        <StartGame />
      </TooltipProvider>
    );

    const maxLabel = await screen.findByText(/Max 10 saves/i);
    const newGame = maxLabel.closest('button');
    expect(newGame).toBeDisabled();
  });

  it('requires confirmation before deleting a save and can cancel safely', async () => {
    vi.mocked(saveSlots.listSaveSlots).mockResolvedValue([
      { id: 'slot-1', name: 'Iron Wolves', timestamp: '2025-01-02T00:00:00Z', week: 2, year: 1 },
    ] as any);

    render(
      <TooltipProvider>
        <StartGame />
      </TooltipProvider>
    );
    fireEvent.click(await screen.findByRole('button', { name: /Delete save for Iron Wolves/i }));

    const dialog = await screen.findByRole('alertdialog', { name: /Erase this Record/i });
    expect(within(dialog).getByText(/permanently deleted/i)).toBeInTheDocument();

    fireEvent.click(within(dialog).getByRole('button', { name: /Preserve/i }));
    expect(saveSlots.deleteSlot).not.toHaveBeenCalled();

    fireEvent.click(await screen.findByRole('button', { name: /Delete save for Iron Wolves/i }));
    fireEvent.click(
      within(await screen.findByRole('alertdialog', { name: /Erase this Record/i })).getByRole(
        'button',
        { name: /Expunge Record/i }
      )
    );

    await waitFor(() => expect(saveSlots.deleteSlot).toHaveBeenCalledWith('slot-1'));
  });
});
