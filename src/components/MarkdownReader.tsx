import ReactMarkdown, { defaultUrlTransform } from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeSanitize from 'rehype-sanitize';
import { WarriorLink, StableLink } from '@/components/EntityLink';
import { escapeHtml } from '@/utils/escapeHtml';

interface MarkdownReaderProps {
  content: string;
  warriorNames?: string[];
  stableNames?: string[];
}

/**
 * Pre-processes markdown content to wrap entity names in markdown links.
 * Entity links use the format `[Name](#entity:warrior:Name)` or `[Name](#entity:stable:Name)`.
 */
function linkifyMarkdown(content: string, warriorNames?: string[], stableNames?: string[]): string {
  if (!warriorNames?.length && !stableNames?.length) return content;

  const stableSet = new Set(stableNames ?? []);
  const allNames = [...(warriorNames ?? []), ...(stableNames ?? [])];
  if (allNames.length === 0) return content;

  // Gazette templates HTML-escape interpolated names (t() → &#39; etc.), so a
  // name containing ' or & appears escaped in body text — match both forms,
  // mapping each surface variant back to the raw name for the entity href.
  const rawByVariant = new Map<string, string>();
  for (const name of allNames) {
    rawByVariant.set(name, name);
    const htmlVariant = escapeHtml(name);
    if (!rawByVariant.has(htmlVariant)) rawByVariant.set(htmlVariant, name);
  }

  const sorted = [...rawByVariant.keys()].sort((a, b) => b.length - a.length);
  const escaped = sorted.map((n) => n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  const pattern = new RegExp(`(${escaped.join('|')})`, 'g');

  return content.replace(pattern, (match) => {
    // Link text is markdown — a stored name containing `[`, `]`, or `\` would
    // otherwise corrupt the generated `[name](#entity:...)` link syntax.
    const linkText = match.replace(/([\\[\]])/g, '\\$1');
    const raw = rawByVariant.get(match) ?? match;
    if (stableSet.has(raw)) {
      return `[${linkText}](#entity:stable:${encodeURIComponent(raw)})`;
    }
    return `[${linkText}](#entity:warrior:${encodeURIComponent(raw)})`;
  });
}

/** Decodes an entity-href payload, falling back to the raw slice when the
 *  encoding is malformed (decodeURIComponent throws URIError on e.g. '%'). */
function decodeEntityName(encoded: string): string {
  try {
    return decodeURIComponent(encoded);
  } catch {
    return encoded;
  }
}

/**
 * Markdown reader.
 * @param - { content }.
 */
export function MarkdownReader({ content, warriorNames, stableNames }: MarkdownReaderProps) {
  const processedContent = linkifyMarkdown(content, warriorNames, stableNames);

  return (
    <div className="prose prose-sm dark:prose-invert max-w-none prose-headings:font-display prose-headings:text-primary prose-a:text-arena-blue hover:prose-a:text-arena-gold prose-code:text-accent prose-code:bg-muted/50 prose-code:px-1 prose-code:rounded-none prose-pre:bg-secondary prose-pre:border prose-pre:border-border">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeSanitize]}
        urlTransform={defaultUrlTransform}
        components={{
          a: ({ node, ...props }) => {
            const href = props.href ?? '';
            if (href.startsWith('#entity:warrior:')) {
              const name = decodeEntityName(href.slice('#entity:warrior:'.length));
              return <WarriorLink name={name} />;
            }
            if (href.startsWith('#entity:stable:')) {
              const name = decodeEntityName(href.slice('#entity:stable:'.length));
              return <StableLink name={name} />;
            }
            const isExternal = href.startsWith('http');
            return isExternal ? (
              <a target="_blank" rel="noopener noreferrer" {...props} />
            ) : (
              <a {...props} />
            );
          },
        }}
      >
        {processedContent}
      </ReactMarkdown>
    </div>
  );
}
