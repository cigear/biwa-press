import { error } from '@sveltejs/kit';
import { isLocale, type Locale } from '$lib/config/locales';
import type { DocMetadata } from '$lib/docs/metadata';
import type { SidebarItem, Group } from '$lib/docs';
import fs from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';
import { marked } from 'marked';
import { createHighlighter } from 'shiki';
import { transformerMetaHighlight } from '@shikijs/transformers';
import GithubSlugger from 'github-slugger';
import { dev } from '$app/environment';

// 由于该文件现在仅在服务器运行，不再需要 browser 检查
function getDocsRoot() {
  return path.resolve(process.cwd(), 'docs');
}

/** Shiki 高亮器单例，用于在运行时解析 Markdown 代码块 */
let highlighter: any;

/* ---------------------------------------------
 * loadDoc
 * --------------------------------------------- */
export async function loadDoc(locale: Locale, slug: string) {
  const normalized = slug === '' ? 'index' : slug;
  const docsRoot = getDocsRoot();
  
  // 尝试匹配文件路径
  const possiblePaths = [
    path.join(docsRoot, locale, `${normalized}.md`),
    path.join(docsRoot, locale, normalized, 'index.md')
  ];

  let filePath = '';
  for (const p of possiblePaths) {
    if (fs.existsSync(p)) {
      filePath = p;
      break;
    }
  }

  if (!filePath) {
    throw error(404, `Document not found: ${locale}/${slug}`);
  }

  const fileContent = fs.readFileSync(filePath, 'utf-8');
  
  let data: any = {};
  let content = fileContent;

  try {
    const parsed = matter(fileContent);
    data = parsed.data;
    content = parsed.content;
  } catch (e: any) {
    console.warn(`[Biwa Press] Malformed frontmatter in ${filePath}. Use quotes for values containing colons. Error: ${e.reason || e.message}`);
    // 发生错误时，data 保持为空，content 为原始文件内容
  }
  
  // 确保 Shiki 已初始化
  if (!highlighter) {
    highlighter = await createHighlighter({
      themes: ['github-dark'],
      langs: ['javascript', 'typescript', 'bash', 'css', 'html', 'json', 'svelte', 'text', 'markdown']
    });
  }

  const slugger = new GithubSlugger();
  const toc: { depth: number; text: string; slug: string }[] = [];

  // 配置自定义渲染器以生成标题 ID 并同步提取 TOC 数据
  const renderer = new marked.Renderer();
  renderer.heading = (...args: any[]) => {
    // 兼容处理：判断第一个参数是 Token 对象还是原始字符串
    const isToken = typeof args[0] === 'object' && args[0] !== null;
    const text = isToken ? args[0].text : args[0];
    const depth = isToken ? args[0].depth : args[1];
    const raw = isToken ? args[0].raw : args[2];

    const id = slugger.slug(raw || text || '');
    toc.push({
      depth,
      text: raw || text || '',
      slug: id
    });
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

  // 将 Markdown 转换为 HTML
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

  const docsRoot = getDocsRoot();
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

  if (fs.existsSync(docsRoot)) walk(docsRoot);
  return entries;
}

/**
 * 递归扫描文档生成树状结构
 */
export async function scanDocs(locale: Locale): Promise<Group[]> {
  const entries = getDocEntries().filter((e) => e.locale === locale);
  const root: SidebarItem[] = [];
  const docsRoot = getDocsRoot();

  for (const entry of entries) {
    const parts = entry.slug === '' ? [] : entry.slug.split('/');

    // 运行时直接读取文件元数据以支持 SFTP 动态更新
    const normalized = entry.slug === '' ? 'index' : entry.slug;
    const possiblePaths = [
      path.join(docsRoot, locale, `${normalized}.md`),
      path.join(docsRoot, locale, normalized, 'index.md')
    ];

    let filePath = possiblePaths.find(p => fs.existsSync(p));
    if (!filePath) continue;

    const fileContent = fs.readFileSync(filePath, 'utf-8');
    
    let metadata: any = {};
    try {
      metadata = matter(fileContent).data;
    } catch (e: any) {
      // 侧边栏扫描时静默跳过错误
      // 使用 normalized 作为回退标题，并进行格式化
      metadata = { title: normalized.replace(/-/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()) };
      console.warn(`[Biwa Press] Malformed frontmatter in ${filePath}. Using derived title: "${metadata.title}". Error: ${e.reason || e.message}`);
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
        node.slug = currentPath;
        node.title = metadata.title ?? node.title;
        node.order = metadata.order ?? 999;
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
      if (item.items) {
        if (item.items.length === 0) {
          delete item.items; // 清理空的 items
        } else {
          sortRecursive(item.items);
        }
      }
    }
  };

  sortRecursive(root);
  return root;
}

/* ---------------------------------------------
 * getSidebar(locale) → 同步返回 Group[]
 * （★ Header / Sidebar 可以直接 each）
 * --------------------------------------------- */
export async function getSidebar(locale: Locale): Promise<Group[]> {
  // 在开发环境或 SSR 模式下，不使用缓存以支持上传即生效
  // 如果文档非常多（上千篇），可以考虑增加一个简单的 TTL 缓存
  if (dev) {
    return await scanDocs(locale);
  }
  return await scanDocs(locale);
}
