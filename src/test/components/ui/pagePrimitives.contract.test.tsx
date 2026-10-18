// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { PageFrame } from '@/components/ui/PageFrame';
import { PageHeader } from '@/components/ui/PageHeader';

const INDEX_CSS = path.resolve(__dirname, '../../../index.css');

describe('shared page primitives contract', () => {
  it('PageFrame renders routed content in a semantic main landmark', () => {
    render(
      <PageFrame>
        <div>Canvas</div>
      </PageFrame>
    );

    expect(screen.getByRole('main')).toHaveTextContent('Canvas');
  });

  it('PageHeader uses one h1 and restrained codex metadata', () => {
    render(<PageHeader title="Bout Offers" eyebrow="ARENA · FIGHT OFFERS" subtitle="WK 4" />);

    expect(screen.getByRole('heading', { level: 1, name: 'Bout Offers' })).toBeInTheDocument();
    expect(screen.getByText('ARENA · FIGHT OFFERS').className).not.toContain('tracking-[0.4em]');
    expect(screen.getByText('WK 4').className).not.toContain('italic');
  });

  it('codex-label keeps compact labels at or below the 0.15em tracking cap', () => {
    const css = readFileSync(INDEX_CSS, 'utf8');
    const block = css.match(/\.codex-label\s*\{[^}]+\}/s)?.[0] ?? '';

    expect(block).toContain('tracking-[0.15em]');
    expect(block).not.toContain('tracking-[0.4em]');
  });
});
