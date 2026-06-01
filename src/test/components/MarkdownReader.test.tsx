// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { MarkdownReader } from '@/components/MarkdownReader';
import '@testing-library/jest-dom';

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
});
