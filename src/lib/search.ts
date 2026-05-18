import { isLocale, type Locale } from '$lib/config/locales';
import type { SearchEntry } from './types';
import path from 'node:path';
import { DocRepository } from '$lib/infrastructure/storage/doc-repository';
import matter from 'gray-matter';
import { marked, Renderer, type Token, type Tokens } from 'marked';
import { create, insert, search, type Orama } from '@orama/orama';

/** 内存缓存，避免频繁扫描磁盘 */
let searchCache: Record<string, {
  index: Orama<any> | null;
  entries: SearchEntry[];
}> = {};

function toPlainText(markdown: string) {
  return markdown
    // 将代码块标记移除，但保留其中的内容以便搜索。注意：这里不进行 toLowerCase，交给 Orama 内部处理
    .replace(/```[^\n]*\n?([\s\S]*?)```/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/!\[[^\]]*]\([^)]*\)/g, ' ')
    .replace(/\[([^\]]+)]\([^)]*\)/g, '$1')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/^[>*+-]\s+/gm, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/** 扫描磁盘生成指定语言的搜索索引 */
export async function buildSearchIndex(locale: Locale) {
  const docsRoot = DocRepository.getDocsRoot();
  const localeDir = path.join(docsRoot, locale);
  const entries: SearchEntry[] = [];

  if (!DocRepository.exists(localeDir)) return { index: null, entries: [] as SearchEntry[] };

  // 初始化内置的分词器，使用 Intl.Segmenter 提供更精准的中日文分词能力
  const segmenter = new Intl.Segmenter(
    locale === 'zh' ? 'zh-CN' : (locale === 'ja' ? 'ja-JP' : 'en-US'),
    { granularity: 'word' }
  );

  const oramaConfig: any = {
    schema: {
      title: 'string',
      description: 'string',
      content: 'string',
      slug: 'string',
    },
    components: {
      // 自定义分词器
      tokenizer: {
        tokenize: (text: string) => {
          const tokens = [];
          for (const segment of segmenter.segment(text)) {
            // 过滤掉空格和标点符号
            if (segment.isWordLike) {
              tokens.push(segment.segment.toLowerCase());
            }
          }
          return tokens;
        }
      }
    }
  };

  // 创建 Orama 实例
  const index = await create(oramaConfig);

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

        // 1. 预处理内容：移除 UTF-8 BOM 并修剪空白，确保解析稳定
        let markdown = DocRepository.readText(fullPath);
        if (markdown.charCodeAt(0) === 0xFEFF) {
          markdown = markdown.slice(1);
        }
        markdown = markdown.trim();
        const normalizedSlug = slugParts.join('/').replace(/\/index$/, '');
        const slug = normalizedSlug === 'index' ? '' : normalizedSlug;
        
        // 2. 使用 gray-matter 解析 Frontmatter
        let parsedMatterResult = matter(markdown);
        let metadata = parsedMatterResult.data || {};
        let body = parsedMatterResult.content;

        // 健壮性补丁：如果 gray-matter 解析出的 data 为空，但文件内容明显有 Frontmatter 结构，
        // 则尝试手动从 Frontmatter 字符串中提取 title 和 description。
        if (Object.keys(metadata).length === 0 && markdown.startsWith('---')) {
          console.warn(`[Biwa Press] buildSearchIndex: Frontmatter parsing suspected failure for ${fullPath}. Attempting manual extraction.`);
          const nextDash = markdown.indexOf('---', 3);
          if (nextDash !== -1) {
            const yamlFragment = markdown.slice(3, nextDash);
            const titleMatch = yamlFragment.match(/title:\s*(.*)/);
            if (titleMatch) metadata.title = titleMatch[1].replace(/['"]/g, '').trim();
            const descMatch = yamlFragment.match(/description:\s*(.*)/);
            if (descMatch) metadata.description = descMatch[1].replace(/['"]/g, '').trim();
          }
        }

        // 4. 严格优先级确定最终标题: Frontmatter > Pretty Name
        // 既然 Frontmatter title 保证存在，则不再考虑文档内的标题回退
        const lastPart = slug.split('/').pop() || '';
        const prettyName = lastPart.replace(/-/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
        const rawTitle = metadata.title;
        const title = (rawTitle && typeof rawTitle === 'string' && rawTitle.trim().length > 0 && rawTitle !== 'undefined' && rawTitle !== 'null')
          ? rawTitle.trim()
          : (prettyName || 'Untitled');

        const description = metadata.description ?? '';

        // 存储全文以供 Orama 检索
        const searchContent = toPlainText(body); 

        const entry = {
          locale,
          slug,
          href: `/${locale}/docs/${slug}`,
          title,
          description,
          content: searchContent
        };

        entries.push(entry);
      }
    }
  }

  walk(localeDir);

  // 批量插入 Orama
  for (const entry of entries) {
    await insert(index, entry as any);
  }

  return { index, entries };
}

/** 清理搜索缓存 */
export function clearSearchCache() {
  searchCache = {};
}

/** 获取完整索引 (用于 SSG 预渲染或客户端搜索) */
export async function getFullIndex(locale: Locale): Promise<SearchEntry[]> {
  if (!searchCache[locale]) {
    searchCache[locale] = await buildSearchIndex(locale);
  }
  return searchCache[locale].entries;
}

export async function searchDocs(locale: Locale, query: string) {
  if (!searchCache[locale]) {
    searchCache[locale] = await buildSearchIndex(locale);
  }

  const { index } = searchCache[locale];
  if (!index) return [];

  const term = query.trim().toLocaleLowerCase(); // 确保搜索词也被小写化
  if (!term) return [];

  // 执行 Orama 搜索
  const searchResult = await search(index, {
    term,
    properties: ['title', 'description', 'content'],
    boost: {
      title: 2,
      description: 1.5,
      content: 1
    },
    limit: 8
  });

  // 将 Orama 的结果映射回原始 SearchEntry
  return searchResult.hits.map(hit => ({
    ...hit.document,
    score: hit.score
  }));
}
