// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { MarkdownReader } from '@/components/MarkdownReader';
import '@testing-library/jest-dom';

vi.mock('@/components/EntityLink', () => ({
  WarriorLink: ({ name }: { name: string }) => (
    <span
      data-testid="warrior-link"
      data-name={name}
      aria-label={`Open details for warrior ${name}`}
    >
      {name}
    </span>
  ),
  StableLink: ({ name }: { name: string }) => (
    <span data-testid="stable-link" data-name={name} aria-label={`Open details for stable ${name}`}>
      {name}
    </span>
  ),
}));

describe('MarkdownReader', () => {
  it('renders markdown headings', () => {
    render(<MarkdownReader content="# Hello World" />);
    expect(screen.getByRole('heading', { name: 'Hello World' })).toBeInTheDocument();
  });

  it('renders markdown paragraphs', () => {
    render(<MarkdownReader content="Some paragraph text" />);
    expect(screen.getByText('Some paragraph text')).toBeInTheDocument();
  });

  it('renders markdown links', () => {
    render(<MarkdownReader content="[Link text](https://example.com)" />);
    const link = screen.getByRole('link', { name: 'Link text' });
    expect(link).toHaveAttribute('href', 'https://example.com');
  });

  it('renders GFM tables', () => {
    render(
      <MarkdownReader
        content={`| A | B |
|---|---|
| 1 | 2 |`}
      />
    );
    expect(screen.getByRole('table')).toBeInTheDocument();
  });

  it('applies prose wrapper classes', () => {
    const { container } = render(<MarkdownReader content="test" />);
    expect(container.firstChild).toHaveClass('prose');
  });

  it('with warriorNames prop, warrior names in content become WarriorLink', () => {
    render(
      <MarkdownReader
        content="Brutus defeated Cassius in the arena"
        warriorNames={['Brutus', 'Cassius']}
      />
    );
    expect(screen.getAllByTestId('warrior-link').length).toBeGreaterThan(0);
  });

  it('with stableNames prop, stable names in content become StableLink', () => {
    render(
      <MarkdownReader content="Dragon's Hearth hosted the bout" stableNames={["Dragon's Hearth"]} />
    );
    expect(screen.getAllByTestId('stable-link').length).toBeGreaterThan(0);
  });

  it('non-entity links still render as normal anchor tags', () => {
    render(<MarkdownReader content="[Link text](https://example.com)" />);
    const link = screen.getByRole('link', { name: 'Link text' });
    expect(link).toHaveAttribute('href', 'https://example.com');
  });

  it('XSS: sanitizes javascript: URLs in markdown links', () => {
    render(<MarkdownReader content="[Click me](javascript:alert(1))" />);
    const link = screen.queryByRole('link', { name: 'Click me' });
    if (link) {
      expect(link.getAttribute('href')).not.toContain('javascript:');
    }
  });

  it('XSS: sanitizes data: URLs with HTML content in markdown links', () => {
    render(<MarkdownReader content="[Click](data:text/html,<script>alert(1)</script>)" />);
    const link = screen.queryByRole('link', { name: 'Click' });
    if (link) {
      expect(link.getAttribute('href')).not.toContain('data:text/html');
    }
  });

  it('XSS: does not render raw HTML script tags', () => {
    const { container } = render(<MarkdownReader content="<script>alert('xss')</script>" />);
    expect(container.querySelector('script')).toBeNull();
  });

  it('XSS: sanitizes javascript: URLs in inline HTML img tags', () => {
    const { container } = render(
      <MarkdownReader content='<img src="javascript:alert(1)" alt="xss" />' />
    );
    const img = container.querySelector('img');
    if (img) {
      expect(img.getAttribute('src')).not.toContain('javascript:');
    }
  });
});
