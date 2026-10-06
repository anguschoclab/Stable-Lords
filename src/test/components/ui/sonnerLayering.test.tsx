// @vitest-environment jsdom
/**
 * sonner layering — toasts must never sit above overlays. Sonner ships a
 * hardcoded z-index of 999999999 on [data-sonner-toaster]; overlays render at
 * z-50 (ResolutionReveal) and z-[100] (modals). On small viewports a toast
 * physically covers an overlay's action button (observed: death-notification
 * toasts blocked "MEMORIALIZE & CONTINUE" in e2e), so the toaster is pinned
 * below the overlay floor.
 */
import { describe, it, expect } from 'vitest';
import { act, render } from '@testing-library/react';
import { toast } from 'sonner';
import { Toaster } from '@/components/ui/sonner';

describe('sonner toaster layering', () => {
  it('stays below the z-50 overlay floor so overlay buttons keep hit-testing priority', async () => {
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
    expect(z).toBeLessThan(50);
  });
});
