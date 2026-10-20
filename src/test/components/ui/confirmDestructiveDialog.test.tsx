// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { useState } from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ConfirmDestructiveDialog } from '@/components/ui/ConfirmDestructiveDialog';
import '@/test/_setup/setup';

function DialogHarness({ onConfirm = vi.fn(), stacked = false }) {
  const [open, setOpen] = useState(false);
  const [topOpen, setTopOpen] = useState(false);
  return (
    <>
      <button onClick={() => setOpen(true)}>Open reset dialog</button>
      <ConfirmDestructiveDialog
        open={open}
        onOpenChange={setOpen}
        title="Delete save?"
        description={
          <>
            Permanent deletion
            {stacked && <button onClick={() => setTopOpen(true)}>Open second dialog</button>}
          </>
        }
        confirmLabel="Delete"
        onConfirm={onConfirm}
      />
      {stacked && (
        <ConfirmDestructiveDialog
          open={topOpen}
          onOpenChange={setTopOpen}
          title="Delete profile?"
          description="Second deletion"
          confirmLabel="Confirm"
          onConfirm={vi.fn()}
        />
      )}
    </>
  );
}

describe('ConfirmDestructiveDialog overlay contract', () => {
  it('moves focus into the dialog, supports Escape, and restores trigger focus', async () => {
    render(<DialogHarness />);
    const trigger = screen.getByRole('button', { name: /open reset dialog/i });
    trigger.focus();
    fireEvent.click(trigger);

    const dialog = await screen.findByRole('alertdialog');
    await waitFor(() => expect(dialog.contains(document.activeElement)).toBe(true));
    fireEvent.keyDown(dialog, { key: 'Escape' });

    await waitFor(() => expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument());
    await waitFor(() => expect(trigger).toHaveFocus());
  });

  it('cancels without confirmation and confirms explicitly', async () => {
    const onConfirm = vi.fn();
    render(<DialogHarness onConfirm={onConfirm} />);
    fireEvent.click(screen.getByRole('button', { name: /open reset dialog/i }));
    fireEvent.click(await screen.findByRole('button', { name: /cancel/i }));
    expect(onConfirm).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: /open reset dialog/i }));
    fireEvent.click(await screen.findByRole('button', { name: /^delete$/i }));
    expect(onConfirm).toHaveBeenCalledTimes(1);
    await waitFor(() => expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument());
  });

  it('keeps stacked dialogs independent and restores focus one layer at a time', async () => {
    render(<DialogHarness stacked />);
    fireEvent.click(screen.getByRole('button', { name: /open reset dialog/i }));
    fireEvent.click(await screen.findByRole('button', { name: /open second dialog/i }));

    await waitFor(() =>
      expect(screen.getAllByRole('alertdialog', { hidden: true })).toHaveLength(2)
    );
    expect(screen.getByRole('alertdialog')).toHaveAccessibleName('Delete profile?');
    fireEvent.keyDown(document.activeElement ?? document.body, { key: 'Escape' });
    await waitFor(() => expect(screen.getAllByRole('alertdialog')).toHaveLength(1));
    expect(screen.getByRole('alertdialog')).toHaveAccessibleName('Delete save?');
  });
});
