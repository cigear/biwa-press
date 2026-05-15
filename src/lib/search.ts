import { isLocale, type Locale } from '$lib/config/locales';
import type { SearchEntry } from './types';
import path from 'node:path';
import { DocRepository } from '$lib/infrastructure/storage/doc-repository';

/** 内存缓存，避免频繁扫描磁盘 */
let searchIndexCache: Record<string, SearchEntry[]> = {};

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

/** 扫描磁盘生成指定语言的搜索索引 */
export function buildSearchIndex(locale: Locale): SearchEntry[] {
  const docsRoot = DocRepository.getDocsRoot();
  const localeDir = path.join(docsRoot, locale);
  const entries: SearchEntry[] = [];

  if (!DocRepository.exists(localeDir)) return [];

  function walk(dir: string) {
    const files = DocRepository.readDir(dir);
    for (const file of files) {
      const fullPath = path.join(dir, file);
      const isDirectory = DocRepository.isDir(fullPath);

      if (isDirectory) {
        walk(fullPath);
      } else if (file.endsWith('.md')) {
        // index.md 仅用于目录元数据，不作为独立的搜索结果页面
        if (file.toLowerCase() === 'index.md') continue;

        const relative = path.relative(docsRoot, fullPath).replace(/\\/g, '/').replace(/\.md$/, '');
        const [lang, ...slugParts] = relative.split('/');
        
        if (lang !== locale) continue;

        const markdown = DocRepository.readText(fullPath);
        const normalizedSlug = slugParts.join('/').replace(/\/index$/, '');
        const slug = normalizedSlug === 'index' ? '' : normalizedSlug;
        
        const { metadata, body } = parseFrontmatter(markdown);
        const title = metadata.title ?? slug.split('/').at(-1) ?? 'Untitled';
        const description = metadata.description ?? '';

        // 优化：不再存储完整的正文，而是提取前 200 个字符作为搜索上下文
        // 或者只提取页面中的 H2, H3 标题
        const searchContent = toPlainText(body).slice(0, 500); 

        entries.push({
          locale,
          slug,
          href: `/${locale}/docs/${slug}`,
          title,
          description,
          content: searchContent
        });
      }
    }
  }

  walk(localeDir);
  return entries;
}

/** 清理搜索缓存 */
export function clearSearchCache() {
  searchIndexCache = {};
}

/** 获取完整索引 (用于 SSG 预渲染或客户端搜索) */
export function getFullIndex(locale: Locale): SearchEntry[] {
  if (!searchIndexCache[locale]) {
    searchIndexCache[locale] = buildSearchIndex(locale);
  }
  return searchIndexCache[locale];
}

export function searchDocs(locale: Locale, query: string) {
  if (!searchIndexCache[locale]) {
    searchIndexCache[locale] = buildSearchIndex(locale);
  }

  const tokens = query
    .trim()
    .toLocaleLowerCase()
    .split(/\s+/)
    .filter(Boolean);

  if (tokens.length === 0) {
    return [];
  }

  return searchIndexCache[locale]
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
