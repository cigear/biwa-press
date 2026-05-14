import { error, redirect } from '@sveltejs/kit';
import { isLocale, type Locale } from '$lib/config/locales';
import type { DocMetadata } from '$lib/docs/metadata';
import type { SidebarItem, Group } from '$lib/docs';
import fs from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';
import { marked, type Tokens } from 'marked';
import { createHighlighter } from 'shiki';
import { transformerMetaHighlight } from '@shikijs/transformers';
import GithubSlugger from 'github-slugger';
import { dev } from '$app/environment';

// 由于该文件现在仅在服务器运行，不再需要 browser 检查
function getDocsRoot() {
  return path.resolve(process.cwd(), 'docs');
}

/** Shiki 高亮器单例，用于在运行时解析 Markdown 代码块 */
let highlighterPromise: Promise<any> | null = null;

// 定义自定义视频 Token 的类型，扩展 Tokens.Generic 以符合 marked 的扩展规范
interface VideoEmbedToken extends Tokens.Generic {
  type: 'videoEmbed';
  videoType: 'video' | 'youtube' | 'bilibili';
  altOrTitle: string;
  urlOrId: string;
  width?: string;
  ratio?: string;
  poster?: string;
  lazy?: boolean; // Add a new property for lazy loading
  tokens: []; // 这种简单的嵌入不需要嵌套解析
}

// 注册 marked 扩展 (在服务器端全局注册一次即可)
marked.use({
  extensions: [
    {
      name: 'videoEmbed',
      level: 'block',
      start(src: string) {
        return src.match(/^::(video|youtube|bilibili)\[/)?.index;
      },
      tokenizer(src: string): VideoEmbedToken | undefined {
        // 更新正则，增加对 {width=xxx}、{ratio=xxx}、{poster=xxx} 和 {lazy} 的可选匹配
        const rule = /^::(video|youtube|bilibili)\[([^\]]+)\]\(([^)]+)\)(?:\{width=(\d+)\})?(?:\{ratio=([\d/:]+)\})?(?:\{poster=([^}]+)\})?(?:\{lazy\})?/;
        const match = rule.exec(src);
        if (match) {
          return {
            type: 'videoEmbed',
            raw: match[0],
            videoType: match[1] as 'video' | 'youtube' | 'bilibili',
            altOrTitle: match[2],
            urlOrId: match[3],
            width: match[4], // 捕获到的宽度数字
            ratio: match[5], // 捕获到的比例 (如 16:9 或 4/3)
            poster: match[6], // 捕获到的封面图路径
            lazy: !!match[7], // 捕获到的 {lazy} 标记
            tokens: []
          };
        }
        return undefined;
      },
      renderer(token: Tokens.Generic) {
        const t = token as VideoEmbedToken;
        
        // 构建动态样式
        let styles = [];
        if (t.width) {
          styles.push(`max-width: ${t.width}px`, `width: 100%`);
        } else {
          styles.push(`width: 100%`);
        }
        
        if (t.ratio) {
          // 将 16:9 转换为 CSS 标准的 16 / 9
          const cssRatio = t.ratio.replace(':', ' / ');
          styles.push(`aspect-ratio: ${cssRatio}`);
        }
        
        const containerStyle = `style="${styles.join('; ')}; overflow: hidden; position: relative;"`;
        const innerStyle = t.ratio ? `style="width: 100%; height: 100%; object-fit: cover; display: block;"` : `style="width: 100%; height: auto; display: block;"`;

        const posterAttr = t.poster ? `poster="${t.poster}"` : '';
        const dataPosterAttr = t.poster ? `data-poster="${t.poster}"` : ''; // For JS to potentially use
        const lazyClass = t.lazy ? 'js-lazy-video' : ''; // Add a class for JavaScript to target

        if (t.videoType === 'video') {
          // iOS 技巧：在 URL 后添加 #t=0.001 强制渲染第一帧，解决白屏问题
          const videoSrc = t.urlOrId.includes('#') ? t.urlOrId : `${t.urlOrId}#t=0.001`;
          const srcAttribute = t.lazy ? `data-src="${videoSrc}"` : `src="${videoSrc}"`;
          // 即使是延迟加载，也应在 HTML 中预设 autoplay muted，以最大化 iOS 自动播放的可能性
          const autoplayMutedAttrs = 'autoplay muted';

          return `<div class="video-embed-container ${lazyClass}" data-video-type="video" ${dataPosterAttr} ${containerStyle}>
                    <video 
                      controls 
                      playsinline 
                      preload="metadata" 
                      ${autoplayMutedAttrs}
                      ${posterAttr}
                      title="${t.altOrTitle}" 
                      ${innerStyle}>
                      <source ${srcAttribute}>
                      您的浏览器不支持视频标签。
                    </video>
                  </div>`;
        } else if (t.videoType === 'youtube') {
          const iframeSrc = `https://www.youtube.com/embed/${t.urlOrId}`;
          // For iframes, we use data-src when lazy, and let JS handle moving it to src and adding autoplay params.
          // 对于 YouTube，直接在 URL 中添加自动播放和静音参数
          const finalIframeSrc = t.lazy ? iframeSrc : `${iframeSrc}?autoplay=1&mute=1`;
          const srcAttribute = t.lazy ? `data-src="${finalIframeSrc}"` : `src="${finalIframeSrc}"`;
          // Note: We remove native loading="lazy" when using data-src and IntersectionObserver for autoplay,
          // as our JS will explicitly control the loading and playback.

          return `<div class="video-embed-container ${lazyClass}" data-video-type="youtube" ${dataPosterAttr} ${containerStyle}>
                    <iframe 
                      ${srcAttribute}
                      title="${t.altOrTitle}" 
                      style="width: 100%; height: 100%; border: 0;"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
                      allowfullscreen>
                    </iframe>
                  </div>`;
        } else if (t.videoType === 'bilibili') {
          const iframeSrc = `//player.bilibili.com/player.html?bvid=${t.urlOrId}&page=1`;
          const srcAttribute = t.lazy ? `data-src="${iframeSrc}"` : `src="${iframeSrc}"`;

          return `<div class="video-embed-container ${lazyClass}" data-video-type="bilibili" ${dataPosterAttr} ${containerStyle}>
                    <iframe 
                      ${srcAttribute}
                      style="width: 100%; height: 100%; border: 0;" 
                      scrolling="no" 
                      framespacing="0" 
                      allowfullscreen="true" 
                      title="${t.altOrTitle}">
                    </iframe>
                  </div>`;
        }
        return false;
      }
    }
  ]
});

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
    // 当请求的文档在目标语言中不存在时（例如切换语言后），自动重定向到该语言的首页
    throw redirect(307, `/${locale}/`);
  }

  const fileContent = fs.readFileSync(filePath, 'utf-8');
  
  let data: any = {};
  let content = fileContent;

  try {
    const parsed = matter(fileContent);
    data = parsed.data;
    content = parsed.content;

    if (filePath.endsWith('index.md')) {
      // 根据要求：index.md 本身不显示内容。
      // 如果访问的是目录 URL（匹配到 index.md），则自动查找目录下 order 最小的第一个有效子文件作为内容显示。
      const dir = path.dirname(filePath);
      const siblings = fs.readdirSync(dir)
        .filter(f => f.endsWith('.md') && f.toLowerCase() !== 'index.md')
        .map(f => {
          const p = path.join(dir, f);
          const m = matter(fs.readFileSync(p, 'utf-8'));
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
    console.warn(`[Biwa Press] Malformed frontmatter in ${filePath}. Use quotes for values containing colons. Error: ${e.reason || e.message}`);
    // 发生错误时，data 保持为空，content 为原始文件内容
  }
  
  // 确保 Shiki 已初始化
  if (!highlighterPromise) {
    highlighterPromise = createHighlighter({
      themes: ['github-dark'],
      langs: ['javascript', 'typescript', 'bash', 'css', 'html', 'json', 'svelte', 'text', 'markdown']
    });
  }
  const highlighter = await highlighterPromise;

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

    const isIndexFile = filePath.endsWith('index.md');
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    
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
