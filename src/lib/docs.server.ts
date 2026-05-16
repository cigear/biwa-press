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

let highlighterPromise: Promise<any> | null = null;

// 注册 marked 扩展 (在服务器端全局注册一次即可)
marked.use({
  extensions: [videoEmbedExtension, timelineExtension, galleryExtension, tabsExtension, collapseExtension, cardExtension, githubExtension, buttonExtension]
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

  const fileContent = DocRepository.readText(filePath);
  
  let data: any = {};
  let content = fileContent;

  try {
    const parsed = matter(fileContent);
    data = parsed.data;
    content = parsed.content;

    if (filePath.endsWith('index.md') && !raw) {
      // 根据要求：index.md 本身不显示内容。
      // 如果访问的是目录 URL（匹配到 index.md），则自动查找目录下 order 最小的第一个有效子文件作为内容显示。
      const dir = path.dirname(filePath);
      const siblings = DocRepository.readDir(dir)
        .filter(f => f.endsWith('.md') && f.toLowerCase() !== 'index.md')
        .map(f => {
          const p = path.join(dir, f);
          const m = matter(DocRepository.readText(p));
          return { content: m.content, order: m.data.order ?? 999 };
        })
        .sort((a, b) => a.order - b.order);

      if (siblings.length > 0) {
        content = siblings[0].content;
      } else {
        content = '';
      }
    }
  } catch (e: any) {
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

    if (lang === 'mermaid') {
      // 如果是 Mermaid 代码块，直接返回原始 HTML，由客户端 Mermaid.js 处理
      return `<pre class="language-mermaid"><code class="language-mermaid">${text || ''}</code></pre>`;
    }

    const [language, ...rest] = (lang || '').split(/\s+/);
    return highlighter.codeToHtml(text || '', {
      lang: language || 'text',
      theme: 'github-dark',
      meta: { __raw: rest.join(' ') },
      transformers: [transformerMetaHighlight()]
    });
  };

  // 将 Markdown 转换为 HTML，并注册自定义扩展
  const html = await marked.parse(content, { renderer });

  return {
    contentHtml: html,
    metadata: {
      title: data.title || normalized,
      description: data.description || '',
      order: data.order ?? 999,
      ...data
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
    const fileContent = DocRepository.readText(filePath);
    
    let metadata: any = {};
    try {
      metadata = matter(fileContent).data;
    } catch (e: any) {
      // 侧边栏扫描时静默跳过错误。
      // 仅使用最后一部分路径作为回退标题，避免出现 "Parent/Child" 这种重复层级的标题
      const lastPart = parts[parts.length - 1] || normalized;
      metadata = { title: lastPart.replace(/-/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()) };
      console.warn(`[Biwa Press] Malformed frontmatter in ${filePath}. Using derived title: "${metadata.title}".`);
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
        if (metadata.title) node.title = metadata.title;
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

/** 手动清空缓存，强制下次请求重新扫描 */
export function clearSidebarCache() {
  sidebarCache = {};
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
