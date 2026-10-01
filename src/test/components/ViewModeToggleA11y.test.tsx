/**
 * MEGAPLAN-V9 gate — focus-ring a11y contracts (PRs #1003/#1005 union).
 *
 * The synthesis swaps bare `outline-none` for `focus-visible:outline-none` on
 * keyboard-focusable controls that already show a `focus-visible:ring-*`
 * indicator — the ring must remain the focus signal while the default
 * outline is suppressed only under :focus-visible.
 */
// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { readFileSync } from 'node:fs';
import ViewModeToggle from '@/components/arena/ViewModeToggle';

vi.mock('framer-motion', () => ({
  motion: { div: (p: any) => <div {...p} /> },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

vi.mock('@/components/ui/Surface', () => ({
  Surface: ({ children, ...p }: any) => <div {...p}>{children}</div>,
}));

const hasToken = (cls: string, token: string) => cls.split(/\s+/).includes(token);

describe('focus-ring a11y contracts (MEGAPLAN-V9)', () => {
  it('ViewModeToggle buttons use focus-visible:outline-none, keep ring', () => {
    const { getByLabelText } = render(<ViewModeToggle mode="log" onChange={() => {}} />);
    for (const label of ['Switch to Combat Log view', 'Switch to Arena Replay view']) {
      const cls = getByLabelText(label).className;
      expect(hasToken(cls, 'focus-visible:ring-2'), label).toBe(true);
      expect(hasToken(cls, 'focus-visible:outline-none'), label).toBe(true);
      expect(hasToken(cls, 'outline-none'), `${label} must not bare-suppress outline`).toBe(false);
    }
  });

  it('TokenCard / WarriorTargetCard buttons carry the same contract (source-level)', () => {
    for (const f of [
      'src/components/ledger/InsightManager/components/TokenCard.tsx',
      'src/components/ledger/InsightManager/components/WarriorTargetCard.tsx',
    ]) {
      const src = readFileSync(f, 'utf8');
      expect(src, `${f} must scope outline suppression to focus-visible`).toMatch(
        /focus-visible:outline-none/
      );
      // No bare `outline-none` class token in a button className.
      expect(src.match(/(?<!focus-visible:)\boutline-none\b/)?.[0], f).toBeUndefined();
    }
  });

  it('accordion and toast vendored primitives honor motion-reduce', () => {
    for (const f of ['src/components/ui/accordion.tsx', 'src/components/ui/toast.tsx']) {
      const src = readFileSync(f, 'utf8');
      expect(src, `${f} must disable animations under motion-reduce`).toMatch(
        /motion-reduce:animate-none/
      );
    }
  });
});
