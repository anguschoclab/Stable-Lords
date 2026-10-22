import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';

/**
 * Markdown sanitization guard — megaplan security ratchet.
 *
 * MarkdownReader renders gazette bodies that embed user-controlled entity
 * names (renames, builder input, imported saves). The invariant: the
 * rehype pipeline always runs rehype-sanitize, and rehype-raw — the plugin
 * that would make raw HTML execute — is never introduced here.
 */
const REPO = path.resolve(__dirname, '../../..');
const reader = readFileSync(path.join(REPO, 'src/components/MarkdownReader.tsx'), 'utf8');

describe('megaplan: markdown sanitization guard', () => {
  it('MarkdownReader pipelines rehype-sanitize', () => {
    expect(reader).toContain('rehype-sanitize');
    expect(reader).toContain('rehypePlugins');
  });

  it('raw HTML rendering is never enabled', () => {
    expect(reader).not.toMatch(/rehype-raw|rehypeRaw/);
  });
});
