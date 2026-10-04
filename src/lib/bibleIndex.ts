/**
 * Design Bible index — loads the spec corpus from /docs as raw markdown and
 * provides section-level search for the Help page's bible browser.
 */

/**
 * Defines the shape of bible doc.
 */
export interface BibleDoc {
  /** Filename without extension, e.g. "Stable_Lords_Master_Design_Bible_v1.0_..." */
  id: string;
  /** Human title derived from the first heading or filename. */
  title: string;
  content: string;
}

/**
 * Defines the shape of bible hit.
 */
export interface BibleHit {
  docId: string;
  docTitle: string;
  /** Nearest preceding markdown heading, if any. */
  heading: string;
  /** Excerpt around the first match. */
  snippet: string;
  /** Relevance score (match count). */
  score: number;
}

const rawDocs = import.meta.glob('../../docs/*.md', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>;

function titleFromFilename(name: string): string {
  return name
    .replace(/\.md$/, '')
    .replace(/_NONLOSSY.*$/, '')
    .replace(/_v?\d+(\.\d+)*.*$/, '')
    .replace(/^\d{4}-\d{2}-\d{2}-/, '')
    .replace(/[_-]+/g, ' ')
    .trim();
}

function titleFromContent(content: string, fallback: string): string {
  const heading = content.match(/^#\s+(.+)$/m)?.[1]?.trim();
  return heading ?? fallback;
}

export const BIBLE_DOCS: BibleDoc[] = Object.entries(rawDocs)
  .map(([path, content]) => {
    const file = path.split('/').pop() ?? path;
    const fallback = titleFromFilename(file);
    return { id: file, title: titleFromContent(content, fallback), content };
  })
  .sort((a, b) => a.title.localeCompare(b.title));

interface Section {
  heading: string;
  body: string;
}

function splitSections(content: string): Section[] {
  const lines = content.split('\n');
  const sections: Section[] = [];
  let heading = 'Introduction';
  let body: string[] = [];
  for (const line of lines) {
    const h = line.match(/^#{1,3}\s+(.+)$/);
    if (h) {
      if (body.length > 0) sections.push({ heading, body: body.join('\n') });
      heading = h[1]?.trim() ?? 'Section';
      body = [];
    } else {
      body.push(line);
    }
  }
  if (body.length > 0) sections.push({ heading, body: body.join('\n') });
  return sections;
}

function makeSnippet(body: string, needle: string): string {
  const idx = body.toLowerCase().indexOf(needle.toLowerCase());
  const start = Math.max(0, idx - 80);
  const end = Math.min(body.length, idx + 160);
  const prefix = start > 0 ? '…' : '';
  const suffix = end < body.length ? '…' : '';
  return prefix + body.slice(start, end).replace(/\s+/g, ' ').trim() + suffix;
}

interface IndexedSection {
  docId: string;
  docTitle: string;
  heading: string;
  body: string;
  lower: string;
}

/**
 * Sections split and lowercased once at module load — the corpus is static
 * (eager glob), so search never re-parses or re-lowercases per keystroke.
 * Doc × section order matches the original nested loops.
 */
const BIBLE_SECTIONS: IndexedSection[] = BIBLE_DOCS.flatMap((doc) =>
  splitSections(doc.content).map((section) => ({
    docId: doc.id,
    docTitle: doc.title,
    heading: section.heading,
    body: section.body,
    lower: section.body.toLowerCase(),
  }))
);

/**
 * Search bible docs.
 */
export function searchBibleDocs(query: string, maxResults = 20): BibleHit[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const hits: BibleHit[] = [];
  for (const section of BIBLE_SECTIONS) {
    if (!section.lower.includes(q)) continue;
    const score = section.lower.split(q).length - 1;
    hits.push({
      docId: section.docId,
      docTitle: section.docTitle,
      heading: section.heading,
      snippet: makeSnippet(section.body, q),
      score,
    });
  }
  return hits.sort((a, b) => b.score - a.score).slice(0, maxResults);
}
