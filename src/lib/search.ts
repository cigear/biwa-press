import { isLocale, type Locale } from '$lib/config/locales';

export type SearchEntry = {
  locale: Locale;
  slug: string;
  href: string;
  title: string;
  description: string;
  content: string;
};

const rawDocs = import.meta.glob<string>('../../docs/**/*.md', {
  query: '?raw',
  import: 'default',
  eager: true
});

function parseFrontmatter(markdown: string) {
  const match = markdown.match(/^---\s*([\s\S]*?)\s*---\s*([\s\S]*)$/);

  if (!match) {
    return {
      metadata: {},
      body: markdown
    };
  }

  const metadata = Object.fromEntries(
    match[1]
      .split('\n')
      .map((line) => line.match(/^([^:]+):\s*(.*)$/))
      .filter((line): line is RegExpMatchArray => line !== null)
      .map((line) => [line[1].trim(), line[2].trim().replace(/^["']|["']$/g, '')])
  );

  return {
    metadata,
    body: match[2]
  };
}

function toPlainText(markdown: string) {
  return markdown
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/!\[[^\]]*]\([^)]*\)/g, ' ')
    .replace(/\[([^\]]+)]\([^)]*\)/g, '$1')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/^[>*+-]\s+/gm, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export const searchIndex = Object.entries(rawDocs)
  .map(([path, markdown]) => {
    const withoutPrefix = path.replace('../../docs/', '').replace(/\.md$/, '');
    const [locale, ...slugParts] = withoutPrefix.split('/');

    if (!isLocale(locale)) {
      return null;
    }

    const normalizedSlug = slugParts.join('/').replace(/\/index$/, '');
    const slug = normalizedSlug === 'index' ? '' : normalizedSlug;
    const { metadata, body } = parseFrontmatter(markdown);
    const title = metadata.title ?? slug.split('/').at(-1) ?? 'Untitled';
    const description = metadata.description ?? '';

    return {
      locale,
      slug,
      href: `/${locale}/docs/${slug}`,
      title,
      description,
      content: toPlainText(body)
    };
  })
  .filter((entry): entry is SearchEntry => entry !== null);

export function searchDocs(locale: Locale, query: string) {
  const tokens = query
    .trim()
    .toLocaleLowerCase()
    .split(/\s+/)
    .filter(Boolean);

  if (tokens.length === 0) {
    return [];
  }

  return searchIndex
    .filter((entry) => entry.locale === locale)
    .map((entry) => {
      const haystack = `${entry.title} ${entry.description} ${entry.content}`.toLocaleLowerCase();
      const score = tokens.reduce((total, token) => {
        if (entry.title.toLocaleLowerCase().includes(token)) return total + 8;
        if (entry.description.toLocaleLowerCase().includes(token)) return total + 4;
        if (haystack.includes(token)) return total + 1;
        return total;
      }, 0);

      return {
        ...entry,
        score
      };
    })
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score || a.title.localeCompare(b.title))
    .slice(0, 8);
}
