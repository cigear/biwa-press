<script module lang="ts">
  // 模块级变量，在页面导航（组件卸载再挂载）期间保持状态
  // 避免 Mermaid 重复初始化同一个主题，防止 DOM 样式膨胀
  let lastInitializedTheme: string | null = null;
  // 持续增长的计数器，确保在 SPA 生命周期内 SVG ID 绝对唯一
  let mermaidCounter = 0;
</script>

<script lang="ts">
  import { page } from "$app/state";
  import type { Locale } from "$lib/config/locales";
  import type { Group } from "$lib/docs";
  import Header from "./Header.svelte";
  import Sidebar from "./Sidebar.svelte";
  import Footer from "./Footer.svelte";
  import Breadcrumb from "./Breadcrumb.svelte";
  import DocToc from "./DocToc.svelte";
  import { ChevronRight, ChevronLeft } from "@lucide/svelte";
  import { t, locale as i18nLocale } from "svelte-i18n";

  let {
    locale,
    metadata,
    children,
    toc = [],
    groups: initialGroups = [],
    currentPath, // 添加 currentPath 属性
    slug, // 添加 slug 属性
    collection: collectionProp // Alias the prop to avoid name collision with the derived state
  }: {
    locale: Locale;
    metadata: Record<string, any>;
    children: import("svelte").Snippet;
    toc?: { depth: number; text: string; slug: string }[];
    groups?: Group[];
    currentPath: string; // 类型定义
    slug?: string; // 类型定义，可以是 undefined
    collection?: string; // Make collection prop optional
  } = $props();

  // 关键：当 locale 属性改变时，同步更新 svelte-i18n 的全局状态
  $effect(() => {
    if (locale) i18nLocale.set(locale);
  });

  let fetchedGroups = $state<Group[] | null>(null);
  let groups = $derived(fetchedGroups ?? initialGroups);

  // 统一的集合识别逻辑
  const collectionType = $derived.by(() => { // Renamed to collectionType to avoid conflict with prop
    if (collectionProp) return collectionProp;
    const pathSegment = currentPath.split('/')[2];
    return pathSegment || 'docs';
  });

  // 检查是否有任何元数据需要显示在页眉中，防止出现空白区域
  const hasMetadataHeader = $derived(
    !!(
      metadata &&
      (metadata.description ||
        metadata.published ||
        metadata.updated ||
        (Array.isArray(metadata.tags) && metadata.tags.length > 0))
    ),
  );

  // 计算文档的上一页和下一页导航
  const pagination = $derived.by(() => {
    // 使用传入的 currentPath 属性
    const flat: { title: string; href: string }[] = [];

    function flatten(items: Group[]) {
      for (const item of items) {
        if (item.slug) {
          const href = item.slug === 'index' 
            ? `/${locale}/${collectionType}` 
            : `/${locale}/${collectionType}/${item.slug}`;
          flat.push({
            title: item.title,
            href
          });
        }
        if (item.items) flatten(item.items);
      }
    }

    flatten(groups);
    const index = flat.findIndex((i) => i.href === currentPath); // 使用传入的 currentPath
    return {
      prev: index > 0 ? flat[index - 1] : null,
      next: index !== -1 && index < flat.length - 1 ? flat[index + 1] : null,
    };
  });

  // 自动为代码块添加复制按钮
  $effect(() => {
    // 依赖页面路径，确保切换页面时重新扫描
    const path = page.url.pathname;
    const pres = document.querySelectorAll(".doc-content pre");

    pres.forEach((pre) => {
      if (pre.querySelector(".copy-btn")) return;

      const btn = document.createElement("button");
      btn.className = "copy-btn";
      btn.title = "Copy code";
      // 使用 Lucide 风格的 SVG 图标
      btn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>`;

      btn.onclick = async (e) => {
        e.preventDefault();
        // 提取代码：优先寻找 code 标签，否则取 pre 内容
        const codeElement = pre.querySelector("code");
        const code = codeElement ? codeElement.textContent : pre.textContent;

        if (!code) return;

        try {
          // 优先使用现代 API
          if (navigator.clipboard && window.isSecureContext) {
            await navigator.clipboard.writeText(code);
          } else {
            // Fallback: Using document.execCommand for non-secure contexts
            // Although deprecated, it remains the only programmatic way to copy in HTTP environments.
            const textArea = document.createElement("textarea");
            textArea.value = code;
            // Ensure the textarea is not visible and doesn't cause layout shifts
            textArea.style.position = "fixed";
            textArea.style.left = "-9999px";
            textArea.style.top = "0";
            document.body.appendChild(textArea);
            textArea.focus();
            textArea.select();
            document.execCommand("copy");
            document.body.removeChild(textArea);
          }

          btn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`;
          btn.classList.add("text-green-500");
          setTimeout(() => {
            btn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>`;
            btn.classList.remove("text-green-500");
          }, 2000);
        } catch (err) {
          console.error("Failed to copy!", err);
        }
      };

      // 将按钮插入到 pre 的最前面，配合 Grid 布局实现右上角悬浮
      pre.prepend(btn);
    });
  });

  // 追踪主题变化以触发 Mermaid 重绘
  let isDarkMode = $state(false);

  $effect(() => {
    const updateTheme = () => {
      isDarkMode = document.documentElement.classList.contains('dark');
    };
    const observer = new MutationObserver(updateTheme);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    updateTheme(); // 初始化状态
    return () => observer.disconnect();
  });

  // 渲染 Mermaid 图表
  $effect(() => {
    let isEffectActive = true;

    // 依赖页面路径变化
    const path = page.url.pathname;
    // 依赖主题变化，确保切换主题时重新渲染
    const _themeTrigger = isDarkMode;

    // 1. 针对旧版浏览器和非安全上下文 (HTTP) 的特性检测与修复
    if (typeof window !== 'undefined') {
      // 核心修复：iOS Safari 在非 HTTPS 环境下不提供 randomUUID，而 Mermaid v11 强依赖它
      if (window.crypto && !window.crypto.randomUUID) {
        // @ts-ignore - 为局域网测试环境注入补丁，防止库崩溃
        window.crypto.randomUUID = () => {
          return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
            const r = (Math.random() * 16) | 0;
            const v = c === 'x' ? r : (r & 0x3) | 0x8;
            return v.toString(16);
          });
        };
      }
    }

    const isSupported = 
      typeof window !== 'undefined' && 
      (!!window.crypto && typeof window.crypto.randomUUID === 'function') &&
      ('ResizeObserver' in window);

    if (!isSupported) {
      console.warn('[Biwa Press] Detected legacy browser, keeping mermaid fallback.');
      // 如果环境不支持，立即显示所有的 fallback 代码块
      document.querySelectorAll('.mermaid-container .mermaid-fallback').forEach(el => {
        el.classList.remove('hidden');
      });
      return;
    }

    // 查找由 mermaidExtension 生成的容器
    const containers = document.querySelectorAll('.mermaid-container');

    if (containers.length > 0) {
      import("mermaid").then((m) => {
        const mermaid = m.default || m;
        if (!isEffectActive) return;

        const targetTheme = isDarkMode ? "dark" : "default";

        // 优化：仅在主题确实改变时才调用 initialize
        // Mermaid 每次初始化都会注入大量样式到 head，通过此检查避免内存和 DOM 资源浪费
        if (lastInitializedTheme !== targetTheme) {
          mermaid.initialize({
            startOnLoad: false,
            theme: targetTheme,
            fontFamily: "var(--font-base)",
            securityLevel: "loose",
            themeVariables: {
              background: 'transparent',
            },
          });
          lastInitializedTheme = targetTheme;
        }

        // 使用串行渲染，避免移动端同时渲染多个图表导致崩溃
        (async () => {
          for (const container of Array.from(containers)) {
            const target = container.querySelector('.mermaid-render-target') as HTMLElement;
            const fallback = container.querySelector('.mermaid-fallback') as HTMLElement;
            const src = container.getAttribute('data-mermaid-src');

            if (target && fallback && src) {
              if (!isEffectActive) break; // 如果页面已切换或重新触发，停止当前渲染

              try {
                const code = decodeURIComponent(src);
                const id = `mermaid-svg-${Date.now()}-${mermaidCounter++}`;
                
                // 执行手动渲染
                const { svg } = await mermaid.render(id, code);
                target.innerHTML = svg;
                
                // 渲染成功后，隐藏 fallback，显示图形
                target.classList.remove('hidden');
                fallback.classList.add('hidden');
              } catch (err) {
                console.error('Mermaid individual render failed:', err);
                // 单个渲染失败时，显示 fallback
                fallback.classList.remove('hidden');
              }
            }
          }
        })();
      }).catch(err => {
        console.error('Failed to load mermaid library:', err);
        // 库加载失败时，显示所有 fallback
        document.querySelectorAll('.mermaid-container .mermaid-fallback').forEach(el => {
          el.classList.remove('hidden');
        });
      });
    }

    return () => {
      isEffectActive = false; // 清理函数：确保旧的异步任务不会覆盖新页面的内容
    };
  });

  // 搜索关键字高亮与自动滚动逻辑
  $effect(() => {
    const searchTerm = page.url.searchParams.get('hl');
    // 依赖路径变化，确保切换页面时重新高亮
    const _trigger = page.url.pathname;

    // 稍作延迟确保 Markdown 内容和 Poetry/Tabs 等组件已完全渲染
    const timer = setTimeout(() => {
      const container = document.querySelector('.doc-content');
      if (!container) return;

      // 1. 清除页面上所有旧的高亮标记
      // 解决在同一页面连续搜索不同关键字时，旧高亮无法自动清除的问题
      container.querySelectorAll('.search-highlight').forEach(el => {
        el.replaceWith(document.createTextNode(el.textContent || ''));
      });
      // 合并被拆分的文本节点，确保后续 TreeWalker 能准确匹配完整词句
      container.normalize();

      if (!searchTerm) return;

      // 使用 TreeWalker 寻找所有文本节点，避开代码块和已有标签
      const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT);
      const nodes: Text[] = [];
      let node;
      while ((node = walker.nextNode())) {
        const parent = node.parentElement;
        if (parent && 
            !['SCRIPT', 'STYLE', 'PRE', 'CODE', 'MARK'].includes(parent.tagName) && 
            !parent.closest('header') && 
            !parent.closest('nav') && 
            !parent.closest('pre') && 
            !parent.closest('code')) {
          nodes.push(node as Text);
        }
      }

      const safeTerm = searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(`(${safeTerm})`, 'gi');

      nodes.forEach(textNode => {
        const val = textNode.textContent || '';
        if (val.match(regex)) {
          const frag = document.createDocumentFragment();
          let lastIdx = 0;
          val.replace(regex, (match, p1, offset) => {
            frag.appendChild(document.createTextNode(val.slice(lastIdx, offset)));
            const mark = document.createElement('mark');
            mark.className = 'search-highlight';
            mark.textContent = match;
            frag.appendChild(mark);
            lastIdx = offset + match.length;
            return match;
          });
          frag.appendChild(document.createTextNode(val.slice(lastIdx)));
          textNode.replaceWith(frag);
        }
      });

      // 自动平滑滚动到第一个匹配项
      const firstMatch = container.querySelector('.search-highlight');
      if (firstMatch) {
        firstMatch.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 300);

    return () => clearTimeout(timer);
  });
</script>

<Header {locale} {groups} {currentPath} collection={collectionType} />

<div
  class="mx-auto grid min-h-[calc(100vh-3.5rem)] max-w-7xl grid-cols-1 px-4 lg:grid-cols-[260px_1fr_200px] lg:gap-10 bg-background text-foreground"
>
  <Sidebar {locale} sidebar={groups} {currentPath} collection={collectionType} />

  <div class="flex flex-col min-w-0">
    <Breadcrumb {locale} {groups} {currentPath} />

    <main class="doc-content flex-1 pb-10 pt-4 lg:pb-12 lg:pt-6">
      {#if hasMetadataHeader}
        <header class="mb-10 flex flex-col gap-4">
          {#if metadata.description}
            <div class="text-3xl font-extrabold text-foreground md:text-4xl">
              {metadata.description}
            </div>
          {/if}

          {#if metadata.published || metadata.updated}
            <div class="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground md:text-sm">
              {#if metadata.published}
                <div class="flex items-center">
                  <span class="font-semibold"
                    >{$t("published", { default: "Published Date" })}:</span
                  >
                  <span class="ml-1">{metadata.published}</span>
                </div>
              {/if}

              {#if metadata.updated}
                <div class="flex items-center">
                  <span class="font-semibold"
                    >{$t("updated", { default: "Updated Date" })}:</span
                  >
                  <span class="ml-1">{metadata.updated}</span>
                </div>
              {/if}
            </div>
          {/if}

          {#if metadata.tags && Array.isArray(metadata.tags) && metadata.tags.length > 0}
            <div class="flex flex-wrap gap-2 text-muted-foreground">
              <span class="mr-1 self-center text-xs"
                >{$t("tags", { default: "Tags" })}:</span
              >
              {#each metadata.tags as tag}
                <a
                href="/{locale}/tags/{tag}{collectionType !== 'docs' ? `?from=${collectionType}` : ''}" 
                  class="inline-flex items-center rounded-md border border-border bg-secondary px-2.5 py-0.5 text-xs font-medium text-foreground transition-colors hover:bg-secondary hover:text-foreground"
                >
                  {tag}
                </a>
              {/each}
            </div>
          {/if}
        </header>
      {/if}

      {@render children()}

      <!-- 底部翻页导航 -->
      <nav
        class="mt-16 flex items-start justify-between gap-4 border-t border-border pt-8"
      >
        {#if pagination.prev}
          <a
            href={pagination.prev.href}
            class="group flex flex-1 flex-col gap-1 min-w-0 transition-colors"
          >
            <span class="text-xs font-medium text-muted-foreground"
              >{$t("previous", { default: "Previous" })}</span
            >
            <span
              class="flex items-center gap-1 text-base font-semibold text-muted-foreground transition-colors group-hover:text-foreground"
            >
              <ChevronLeft
                size={18}
                class="shrink-0 transition-transform group-hover:-translate-x-1"
              />
              {pagination.prev.title}
            </span>
          </a>
        {/if}

        {#if pagination.next}
          <a
            href={pagination.next.href}
            class="group flex flex-1 flex-col items-end gap-1 min-w-0 transition-colors ms-auto"
          >
            <span class="text-xs font-medium text-muted-foreground"
              >{$t("next", { default: "Next" })}</span
            >
            <span
              class="flex items-center gap-1 text-base font-semibold text-muted-foreground transition-colors group-hover:text-foreground"
            >
              {pagination.next.title}
              <ChevronRight
                size={18}
                class="shrink-0 transition-transform group-hover:translate-x-1"
              />
            </span>
          </a>
        {/if}
      </nav>
    </main>
  </div>

  <aside class="lg:block bg-background">
    <DocToc items={toc} minDepth={2} maxDepth={6} />
  </aside>
</div>

<Footer />
