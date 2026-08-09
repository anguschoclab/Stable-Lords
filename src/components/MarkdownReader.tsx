import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { WarriorLink, StableLink } from '@/components/EntityLink';

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

  const sorted = [...allNames].sort((a, b) => b.length - a.length);
  const escaped = sorted.map((n) => n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  const pattern = new RegExp(`(${escaped.join('|')})`, 'g');

  return content.replace(pattern, (match) => {
    if (stableSet.has(match)) {
      return `[${match}](#entity:stable:${encodeURIComponent(match)})`;
    }
    return `[${match}](#entity:warrior:${encodeURIComponent(match)})`;
  });
}

/**
 * Markdown reader.
 * @param - { content }.
 */
export function MarkdownReader({ content, warriorNames, stableNames }: MarkdownReaderProps) {
  const processedContent = linkifyMarkdown(content, warriorNames, stableNames);

  return (
    <div className="prose prose-sm dark:prose-invert max-w-none prose-headings:font-display prose-headings:text-primary prose-a:text-arena-blue hover:prose-a:text-arena-gold prose-code:text-accent prose-code:bg-muted/50 prose-code:px-1 prose-code:rounded prose-pre:bg-secondary prose-pre:border prose-pre:border-border">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          a: ({ node, ...props }) => {
            const href = props.href ?? '';
            if (href.startsWith('#entity:warrior:')) {
              const name = decodeURIComponent(href.slice('#entity:warrior:'.length));
              return <WarriorLink name={name} />;
            }
            if (href.startsWith('#entity:stable:')) {
              const name = decodeURIComponent(href.slice('#entity:stable:'.length));
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
