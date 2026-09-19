import { render, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import StartGame from '@/pages/StartGame';
import * as saveSlots from '@/state/saveSlots';
import { toast } from 'sonner';

// Mock everything
vi.mock('@/state/useGameStore', async (importOriginal) => {
  const actual = (await importOriginal()) as object;
  return {
    ...actual,
    useGameStore: () => ({
      loadGame: vi.fn(),
    }),
  };
});

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

    render(<StartGame />);

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

    render(<StartGame />);

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
    vi.mocked(saveSlots.importSaveToNewSlot).mockRejectedValue(
      new Error('corrupt payload')
    );

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

    render(<StartGame />);

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

    render(<StartGame />);

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

    render(<StartGame />);

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    fireEvent.change(fileInput, {
      target: { files: [new File(['x'], 'save.json', { type: 'application/json' })] },
    });

    await waitFor(() => {
      expect(saveSlots.importSaveToNewSlot).toHaveBeenCalledWith(null);
      expect(toast.error).toHaveBeenCalledWith('Import failed');
    });
  });

  // Regression for latent bug: reader.onerror is never assigned in
  // StartGame.handleImport, so file-read failures are silent — no toast at all.
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

    render(<StartGame />);

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    fireEvent.change(fileInput, {
      target: { files: [new File(['x'], 'save.json', { type: 'application/json' })] },
    });

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Failed to read save file.');
    });
  });
});
