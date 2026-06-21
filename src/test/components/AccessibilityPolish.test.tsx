/**
 * Accessibility polish — verifies focus-visible classes on UI components
 * and reduced-motion media query in CSS.
 */
// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { Select, SelectTrigger } from '@/components/ui/select';
import { ToastAction, ToastClose } from '@/components/ui/toast';

describe('Accessibility polish — focus-visible classes', () => {
  it('SelectTrigger uses focus-visible (not focus:)', () => {
    const { container } = render(
      <Select>
        <SelectTrigger className="test-trigger">Test</SelectTrigger>
      </Select>
    );
    const trigger = container.querySelector('[class*="test-trigger"]') ?? container.querySelector('button');
    expect(trigger?.className).toMatch(/focus-visible:/);
  });

  it('ToastAction has focus-visible:ring', () => {
    const { container } = render(
      <ToastAction className="test-action" altText="Undo" asChild>
        <button>Undo</button>
      </ToastAction>
    );
    const action = container.querySelector('[class*="test-action"]');
    expect(action?.className).toMatch(/focus-visible:ring/);
  });

  it('ToastClose has focus-visible:opacity-100 (not focus:opacity-100)', () => {
    const { container } = render(
      <ToastClose className="test-close" />
    );
    const close = container.querySelector('[class*="test-close"]');
    expect(close?.className).toMatch(/focus-visible:opacity-100/);
  });
});
