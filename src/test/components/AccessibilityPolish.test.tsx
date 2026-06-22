/**
 * Accessibility polish — verifies focus-visible classes on UI components
 * and aria-describedby support on Radix primitives.
 */
// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { Select, SelectTrigger } from '@/components/ui/select';
import { ToastAction, ToastClose } from '@/components/ui/toast';
import * as fs from 'fs';
import * as path from 'path';

describe('Accessibility polish — focus-visible classes', () => {
  it('SelectTrigger uses focus-visible (not focus:)', () => {
    const { container } = render(
      <Select>
        <SelectTrigger className="test-trigger">Test</SelectTrigger>
      </Select>
    );
    const trigger =
      container.querySelector('[class*="test-trigger"]') ?? container.querySelector('button');
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
    const { container } = render(<ToastClose className="test-close" />);
    const close = container.querySelector('[class*="test-close"]');
    expect(close?.className).toMatch(/focus-visible:opacity-100/);
  });
});

describe('Accessibility polish — Radix aria-describedby', () => {
  const uiDir = path.resolve(__dirname, '../../components/ui');

  it('alert-dialog.tsx includes aria-describedby on AlertDialogContent', () => {
    const source = fs.readFileSync(path.join(uiDir, 'alert-dialog.tsx'), 'utf-8');
    expect(source).toMatch(/aria-describedby/);
  });

  it('dialog.tsx includes aria-describedby on DialogContent', () => {
    const source = fs.readFileSync(path.join(uiDir, 'dialog.tsx'), 'utf-8');
    expect(source).toMatch(/aria-describedby/);
  });

  it('sheet.tsx includes aria-describedby on SheetContent', () => {
    const source = fs.readFileSync(path.join(uiDir, 'sheet.tsx'), 'utf-8');
    expect(source).toMatch(/aria-describedby/);
  });
});
