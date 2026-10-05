// @vitest-environment jsdom
/**
 * sonner layering — toasts must never sit above modal overlays. Sonner ships
 * a hardcoded z-index of 999999999 on [data-sonner-toaster]; modals render at
 * z-[100]. On small viewports a toast physically covers a modal's action
 * button (observed: death-notification toasts blocked "MEMORIALIZE &
 * CONTINUE" in e2e), so the toaster is pinned below the modal layer.
 */
import { describe, it, expect, beforeAll } from 'vitest';
import { act, render } from '@testing-library/react';
import { toast } from 'sonner';
import { Toaster } from '@/components/ui/sonner';

// jsdom lacks matchMedia (next-themes requires it).
beforeAll(() => {
  window.matchMedia =
    window.matchMedia ??
    ((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }));
});

describe('sonner toaster layering', () => {
  it('stays below the z-[100] modal layer so overlay buttons keep hit-testing priority', async () => {
    render(<Toaster />);
    // The [data-sonner-toaster] <ol> only mounts once a toast exists.
    act(() => {
      toast('probe');
    });
    const { waitFor } = await import('@testing-library/react');
    await waitFor(() => {
      expect(document.querySelector('[data-sonner-toaster]')).not.toBeNull();
    });
    const ol = document.querySelector('[data-sonner-toaster]') as HTMLElement;
    const z = Number.parseInt(ol.style.zIndex || '999999999', 10);
    expect(z).toBeLessThan(100);
  });
});
