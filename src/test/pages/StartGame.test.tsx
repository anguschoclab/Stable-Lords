import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import StartGame from '@/pages/StartGame';
import * as saveSlots from '@/state/saveSlots';
import { toast } from 'sonner';

// Mock everything
vi.mock('@/state/useGameStore', () => ({
  useGameStore: () => ({
    loadGame: vi.fn(),
  }),
}));

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
  generateCrest: vi.fn().mockReturnValue({}),
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
     
    window.FileReader = vi.fn(() => mockFileReader) as any;

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
});
