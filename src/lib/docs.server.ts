import { error, redirect } from '@sveltejs/kit';
import { isLocale, type Locale } from '$lib/config/locales';
import type { DocMetadata } from '$lib/docs/metadata';
import type { SidebarItem, Group } from '$lib/docs';
import fs from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';
import { marked, Renderer, type Token, type Tokens } from 'marked';
import { createHighlighter } from 'shiki';
import { transformerMetaHighlight } from '@shikijs/transformers';
import GithubSlugger from 'github-slugger';
import { dev } from '$app/environment';
import { DocRepository } from '$lib/infrastructure/storage/doc-repository';
import { videoEmbedExtension } from '$lib/markdown/extensions/video-embed';
import { timelineExtension } from '$lib/markdown/extensions/timeline';
import { galleryExtension } from '$lib/markdown/extensions/gallery';
import { tabsExtension } from '$lib/markdown/extensions/tabs';
import { collapseExtension } from '$lib/markdown/extensions/collapse';
import { cardExtension } from '$lib/markdown/extensions/card';
import { githubExtension } from '$lib/markdown/extensions/github';
import { buttonExtension } from '$lib/markdown/extensions/button';
import { audioExtension } from '$lib/markdown/extensions/audio';
import { poetryExtension } from '$lib/markdown/extensions/poetry';
import { headlineExtension } from '$lib/markdown/extensions/headline';
import { mermaidExtension } from '$lib/markdown/extensions/mermaid';

let highlighterPromise: Promise<any> | null = null;

// 注册 marked 扩展 (在服务器端全局注册一次即可)
marked.use({
  extensions: [videoEmbedExtension, timelineExtension, galleryExtension, tabsExtension, collapseExtension, cardExtension, githubExtension, buttonExtension, audioExtension, poetryExtension, headlineExtension, mermaidExtension]
});

/** 自定义 Shiki 转换器：为带有 showLineNumbers 的代码块添加 has-line-numbers 类名 */
const transformerLineNumbers = () => ({
  name: 'line-numbers',
  pre(node: any) {
    // Directly manipulate the class property to bypass 'this' binding issues
    node.properties.class = [node.properties.class, 'has-line-numbers'].filter(Boolean).join(' ');
  }
});

/* ------------------------------------------------------------------
 * 3. [Application Layer] - Use Cases (核心逻辑)
 * ------------------------------------------------------------------ */

// Helper to convert an absolute file path to a SvelteKit slug
function getSlugFromAbsolutePath(absolutePath: string, docsRoot: string): string {
  const relativePath = path.relative(docsRoot, absolutePath).replace(/\\/g, '/');
  let slug = relativePath.replace(/\.md$/, '');

  // Remove locale prefix from slug, as it's handled by SvelteKit route
  const parts = slug.split('/');
  if (isLocale(parts[0] as Locale)) { // Check if the first part is a locale
    slug = parts.slice(1).join('/');
  }

  // Handle index.md special case
  if (slug.endsWith('/index')) {
    slug = slug.replace(/\/index$/, '');
  }
  if (slug === 'index') { // For docs/en/index.md
    slug = '';
  }
  return slug;
}

/**
 * 加载并无条件渲染一个 Markdown 文件
 */
export async function loadMarkdownFile(locale: Locale, slug: string) {
  return loadDoc(locale, slug, true);
}

/**
 * 加载文档。
 * @param raw 如果为 true，则跳过目录文件的子文件查找逻辑，直接渲染文件内容。
 */
export async function loadDoc(locale: Locale, slug: string, raw = false) {
  const normalized = slug === '' ? 'index' : slug;
  const docsRoot = DocRepository.getDocsRoot();
  const filePath = DocRepository.resolvePath(locale, slug);
  if (!filePath) {
    throw redirect(307, `/${locale}/`);
  }

  // 1. 预处理内容：移除 UTF-8 BOM 并修剪空白，确保解析器绝对稳定
  let fileContent = DocRepository.readText(filePath);
  if (fileContent.charCodeAt(0) === 0xFEFF) {
    fileContent = fileContent.slice(1);
  }
  fileContent = fileContent.trim();
  
  let data: any = {};
  let content = fileContent;

  try {
    const parsed = matter(fileContent);
    data = parsed.data;
    content = parsed.content;

    // 健壮性补丁：如果 gray-matter 解析失败但明显有 Frontmatter 结构，手动提取 title
    if (Object.keys(data).length === 0 && fileContent.startsWith('---')) {
      const nextDash = fileContent.indexOf('---', 3);
      if (nextDash !== -1) {
        const yamlFragment = fileContent.slice(3, nextDash);
        const titleMatch = yamlFragment.match(/title:\s*(.*)/);
        if (titleMatch) data.title = titleMatch[1].replace(/['"]/g, '').trim();
      }
    }

    if (filePath.endsWith('index.md') && !raw) {
      // 根据要求：index.md 本身不显示内容。
      // 如果访问的是目录 URL（匹配到 index.md），则自动查找目录下 order 最小的第一个有效子文件作为内容显示。
      const dir = path.dirname(filePath);
      const siblings = DocRepository.readDir(dir)
        .filter(f => f.endsWith('.md') && f.toLowerCase() !== 'index.md')
        .map(f => {
          const p = path.join(dir, f);
          const m = matter(DocRepository.readText(p));
          return { filename: f, order: m.data.order ?? 999 };
        })
        .sort((a, b) => a.order - b.order);

      if (siblings.length > 0) {
        content = '';
        const targetFilePath = path.join(dir, siblings[0].filename);
        const targetSlug = getSlugFromAbsolutePath(targetFilePath, docsRoot);
        throw redirect(307, `/${locale}/docs/${targetSlug}`);
      }
    }
  } catch (e: any) {
    if (e.status && e.status >= 300 && e.status <= 308) throw e;
    console.warn(`[Biwa Press] Malformed frontmatter in ${filePath}. Error: ${e.message}`);
  }
  
  // 确保 Shiki 已初始化
  if (!highlighterPromise) {
    highlighterPromise = createHighlighter({
      themes: ['github-dark'],
      langs: ['javascript', 'typescript', 'bash', 'css', 'html', 'json', 'svelte', 'text', 'markdown']
    });
  }
  const highlighter = await highlighterPromise;

  // 1. 获取 Tokens 并从源头提取 TOC
  const tokens = marked.lexer(content);
  const tocSlugger = new GithubSlugger();
  const toc: { depth: number; text: string; slug: string }[] = [];

  // 递归遍历 Tokens，但仅在根层级 (isRoot) 时记录到 TOC
  const extractToc = (tokenList: any[], isRoot: boolean) => {
    for (const token of tokenList) {
      if (token.type === 'heading') {
        // 使用 token.text 作为 slug 源（不含 # 符号）
        const id = tocSlugger.slug(token.text);
        if (isRoot) {
          toc.push({
            depth: token.depth,
            text: token.text,
            slug: id
          });
        }
      }
      // 如果 token 包含子 tokens（例如在 card, blockquote 内部），递归处理以保持 slugger 同步
      if (token.tokens) extractToc(token.tokens, false);
    }
  };
  extractToc(tokens, true);

  const slugger = new GithubSlugger();

  // 配置自定义渲染器以生成标题 ID 并同步提取 TOC 数据
  const renderer = new Renderer() as Renderer & {
    currentLocale: Locale;
    currentFilePath: string;
    docsRoot: string;
  };

  renderer.currentLocale = locale;
  renderer.currentFilePath = filePath;
  renderer.docsRoot = docsRoot;

  // 配置图片渲染：点击利用浏览器 Fullscreen API 放大
  renderer.image = (...args: any[]) => {
    const isToken = typeof args[0] === 'object' && args[0] !== null;
    const href = isToken ? args[0].href : args[0];
    const text = isToken ? args[0].text : args[1];
    const title = isToken ? args[0].title : args[2];

    return `<img src="${href}" alt="${text || ''}" title="${title || '点击放大查看'}" 
      onclick="const v=document.getElementById('img-zoom-overlay')||Object.assign(document.body.appendChild(document.createElement('div')),{id:'img-zoom-overlay',onclick:function(){this.style.display='none'}});v.innerHTML='<img src=\\''+this.src+'\\'>';v.style.display='flex'" 
      class="zoomable-img" />`;
  };

  // 配置链接渲染：处理内部 Markdown 文件的链接
  renderer.link = (href, title, text) => {
    // Only process relative links that end with .md and are not absolute paths or external URLs
    if (href && !href.startsWith('http') && !href.startsWith('/') && href.endsWith('.md')) {
      const currentDir = path.dirname(filePath); // Use the current file's directory
      const absoluteLinkedFilePath = path.resolve(currentDir, href);
      const resolvedSlug = getSlugFromAbsolutePath(absoluteLinkedFilePath, docsRoot);
      const finalHref = `/${locale}/docs/${resolvedSlug}`;
      return `<a href="${finalHref}"${title ? ` title="${title}"` : ''}>${text}</a>`;
    }
    // Default behavior for external links, absolute paths, or non-Markdown links
    return Renderer.prototype.link.call(renderer, href, title, text);
  };

  renderer.heading = (...args: any[]) => {
    // 兼容处理：判断第一个参数是 Token 对象还是原始字符串
    const isToken = typeof args[0] === 'object' && args[0] !== null;
    const text = isToken ? args[0].text : args[0];
    const depth = isToken ? args[0].depth : args[1];
    const raw = isToken ? args[0].raw : args[2];

    // 为了保持与 TOC 提取逻辑（使用 token.text）一致，
    // 我们在渲染阶段也应该使用未渲染的原始文本作为 ID 来源。
    // Positional API: args[2] (即这里的 raw) 是原始文本。
    // Token API: args[0].text (即这里的 text) 是原始文本。
    const slugSource = isToken ? text : (raw || text || '');
    const id = slugger.slug(slugSource);
    
    return `<h${depth} id="${id}">${text}</h${depth}>\n`;
  };

  // 配置代码块高亮
  renderer.code = (...args: any[]) => {
    const isToken = typeof args[0] === 'object' && args[0] !== null;
    const text = isToken ? args[0].text : args[0];
    const lang = isToken ? args[0].lang : args[1];

    const [language, ...rest] = (lang || '').split(/\s+/);
    const showLineNumbers = rest.includes('showLineNumbers');

    return highlighter.codeToHtml(text || '', {
      lang: language || 'text',
      theme: 'github-dark',
      meta: { __raw: rest.join(' ') },
      transformers: [
        transformerMetaHighlight(),
        ...(showLineNumbers ? [transformerLineNumbers()] : [])
      ]
    });
  };

  // 将 Markdown 转换为 HTML，并注册自定义扩展
  const html = await marked.parse(content, { renderer });

  // 严格优先级确定最终标题，与 search.ts 逻辑同步
  const lastPart = slug.split('/').pop() || normalized;
  const prettyFileName = lastPart.replace(/-/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
  const rawTitle = data.title;
  const finalTitle = (rawTitle && typeof rawTitle === 'string' && rawTitle.trim().length > 0 && rawTitle !== 'undefined' && rawTitle !== 'null')
    ? rawTitle.trim()
    : prettyFileName;

  return {
    contentHtml: html,
    metadata: {
      ...data,
      description: data.description || '',
      order: data.order ?? 999,
      tags: (() => {
        const t = data.tags ?? data.tag;
        if (Array.isArray(t)) return t;
        if (typeof t === 'string') return t.split(',').map((i: string) => i.trim());
        return [];
      })(),
      title: finalTitle, // 确保最终标题覆盖 data 中的空值或旧值
      slug: slug // 确保 slug 也被传递
    } as DocMetadata,
    toc
  };
}

/* ---------------------------------------------
 * getDocEntries
 * --------------------------------------------- */
export function getDocEntries() {
  const entries: { locale: Locale; slug: string }[] = [];

  const docsRoot = DocRepository.getDocsRoot();
  function walk(dir: string) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
      const fullPath = path.join(dir, file);
      if (fs.statSync(fullPath).isDirectory()) {
        walk(fullPath);
      } else if (file.endsWith('.md')) {
        const relative = path.relative(docsRoot, fullPath).replace(/\\/g, '/').replace(/\.md$/, '');
        const [locale, ...slugParts] = relative.split('/');
        if (isLocale(locale)) {
          let slug = slugParts.join('/');
          if (slug.endsWith('/index')) slug = slug.replace(/\/index$/, '');
          if (slug === 'index') slug = '';
          entries.push({ locale, slug });
        }
      }
    }
  }

  if (DocRepository.exists(docsRoot)) walk(docsRoot);
  return entries;
}

/**
 * 递归扫描文档生成树状结构
 */
export async function scanDocs(locale: Locale): Promise<Group[]> {
  const entries = getDocEntries().filter((e) => e.locale === locale);
  const root: SidebarItem[] = [];

  for (const entry of entries) {
    const parts = entry.slug === '' ? [] : entry.slug.split('/');
    const filePath = DocRepository.resolvePath(locale, entry.slug);
    
    if (!filePath) continue;

    const isIndexFile = filePath.endsWith('index.md');
    const normalized = entry.slug === '' ? 'index' : entry.slug;
    
    // 同步：处理 BOM 和修剪空白
    let fileContent = DocRepository.readText(filePath);
    if (fileContent.charCodeAt(0) === 0xFEFF) {
      fileContent = fileContent.slice(1);
    }
    fileContent = fileContent.trim();
    
    let metadata: any = {};
    try {
      const parsed = matter(fileContent);
      metadata = parsed.data || {};

      // 同步：侧边栏扫描也加入健壮性补丁
      if (Object.keys(metadata).length === 0 && fileContent.startsWith('---')) {
        const nextDash = fileContent.indexOf('---', 3);
        if (nextDash !== -1) {
          const yamlFragment = fileContent.slice(3, nextDash);
          const titleMatch = yamlFragment.match(/title:\s*(.*)/);
          if (titleMatch) metadata.title = titleMatch[1].replace(/['"]/g, '').trim();
        }
      }
    } catch (e: any) {
      metadata = {};
    }

    let currentLevel = root;
    let currentPath = '';

    // 递归构建/查找节点
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      currentPath = currentPath ? `${currentPath}/${part}` : part;
      const isLast = i === parts.length - 1;

      // 使用 _path 唯一匹配，避免重复
      let node = currentLevel.find((n) => n._path === currentPath);

      if (!node) {
        node = {
          title: part.replace(/-/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()),
          _path: currentPath,
          order: 999,
          items: []
        };
        currentLevel.push(node);
      }

      // 如果是当前文件对应的节点，更新其元数据
      if (isLast) {
        if (!isIndexFile) {
          // 使用原始 entry.slug 确保点击链接能准确指向物理文件
          node.slug = entry.slug;
        }
        
        // 只有当 Frontmatter 中明确提供了 title 或 order 时才覆盖
        // 这确保了 index.md 和主文件可以互补元数据
        const mTitle = metadata.title;
        if (mTitle && typeof mTitle === 'string' && mTitle.trim().length > 0 && mTitle !== 'undefined' && mTitle !== 'null') {
          node.title = mTitle.trim();
        }

        if (metadata.order !== undefined) node.order = metadata.order;
      } else {
        // 如果不是最后一层，继续向深层走
        if (!node.items) node.items = [];
        currentLevel = node.items;
      }
    }
  }

  // 递归排序
  const sortRecursive = (items: SidebarItem[]) => {
    // 优先按 order 排序，order 相同按标题字母排序
    items.sort((a, b) => (a.order - b.order) || a.title.localeCompare(b.title));
    
    for (const item of items) {
      if (item.items && item.items.length > 0) {
        // 【重要】Microsoft Learn 风格：
        // 如果一个节点拥有子项目，那么它在侧边栏应该仅作为一个“分类标签”存在
        // 强制移除 slug，确保点击它时只会触发 UI 的折叠/展开，而不会跳转
        delete item.slug;
        
        sortRecursive(item.items);
      } else {
        // 清理空的 items 数组
        if (item.items) {
          delete item.items; // 清理空的 items
        }
      }
    }
  };

  sortRecursive(root);
  return root;
}

/** 内存缓存，避免生产环境下频繁扫描磁盘 */
let sidebarCache: Record<string, Group[]> = {};
let flatDocsCache: Record<string, any[]> = {};

/** 手动清空文档相关的缓存（包括侧边栏和用于标签页的扁平化文档列表） */
export function clearDocCache() {
  sidebarCache = {};
  flatDocsCache = {};
}

/**
 * 获取指定语言下所有文档的扁平化列表（带元数据）
 */
export async function getFlatDocs(locale: Locale) {
  if (!dev && flatDocsCache[locale]) return flatDocsCache[locale];

  const entries = getDocEntries().filter((e) => e.locale === locale);
  const docs = entries.map((entry) => {
    const filePath = DocRepository.resolvePath(locale, entry.slug);
    if (!filePath) return null;

    let fileContent = DocRepository.readText(filePath);
    if (fileContent.charCodeAt(0) === 0xfeff) fileContent = fileContent.slice(1);
    
    const { data } = matter(fileContent.trim());
    
    return {
      slug: entry.slug,
      title: data.title || entry.slug,
      description: data.description || '',
      published: data.published || '',
      updated: data.updated || '',
      tags: Array.isArray(data.tags) ? data.tags : (typeof data.tags === 'string' ? data.tags.split(',').map(t => t.trim()) : [])
    };
  }).filter(Boolean);

  flatDocsCache[locale] = docs;
  return docs;
}

/* ---------------------------------------------
 * getSidebar(locale) → 同步返回 Group[]
 * （★ Header / Sidebar 可以直接 each）
 * --------------------------------------------- */
export async function getSidebar(locale: Locale): Promise<Group[]> {
  if (dev || process.env.BIWA_DISABLE_CACHE === 'true') {
    // 开发环境或显式禁用缓存时，支持实时预览磁盘文件变化
    return await scanDocs(locale);
  }
  
  if (!sidebarCache[locale]) {
    sidebarCache[locale] = await scanDocs(locale);
  }
  return sidebarCache[locale];
}
