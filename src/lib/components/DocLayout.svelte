<script lang="ts">
  import { page } from '$app/state';
  import type { Locale } from '$lib/config/locales';
  import type { Group } from '$lib/docs';
  import Header from './Header.svelte';
  import Sidebar from './Sidebar.svelte';
  import DocToc from './DocToc.svelte';
  import { ChevronRight, ChevronLeft } from '@lucide/svelte';
  import { t, locale as i18nLocale } from 'svelte-i18n';
  import mermaid from 'mermaid';

  let { 
    locale, 
    metadata, 
    children, 
    toc = [],
    groups: initialGroups = []
  }: { 
    locale: Locale; 
    metadata: Record<string, any>; 
    children: import('svelte').Snippet; 
    toc?: { depth: number; text: string; slug: string }[];
    groups?: Group[];
  } = $props();

  // 关键：当 locale 属性改变时，同步更新 svelte-i18n 的全局状态
  $effect(() => {
    if (locale) i18nLocale.set(locale);
  });

  let fetchedGroups = $state<Group[] | null>(null);
  let groups = $derived(fetchedGroups ?? initialGroups);

  const breadcrumbs = $derived.by(() => {
    const currentPath = page.url.pathname;
    if (!currentPath.includes("/docs/")) return [];

    const list: { title: string; href?: string }[] = [];

    // 辅助函数：递归寻找分组下的第一个有效页面链接
    function getFirstHref(item: Group): string | undefined {
      if (item.slug) return `/${locale}/docs/${item.slug}`;
      if (item.items) {
        for (const sub of item.items) {
          const h = getFirstHref(sub);
          if (h) return h;
        }
      }
      return undefined;
    }

    function find(items: Group[]): boolean {
      for (const item of items) {
        const itemHref = item.slug ? `/${locale}/docs/${item.slug}` : undefined;

        if (itemHref === currentPath) {
          list.push({ title: item.title, href: itemHref });
          return true;
        }

        if (item.items && find(item.items)) {
          // 如果父节点没有 slug，则链接到它下面的第一个有效页面
          list.unshift({ title: item.title, href: itemHref || getFirstHref(item) });
          return true;
        }
      }
      return false;
    }

    find(groups);
    return list;
  });

  // 计算文档的上一页和下一页导航
  const pagination = $derived.by(() => {
    const currentPath = page.url.pathname;
    const flat: { title: string; href: string }[] = [];

    function flatten(items: Group[]) {
      for (const item of items) {
        if (item.slug) {
          flat.push({ title: item.title, href: `/${locale}/docs/${item.slug}` });
        }
        if (item.items) flatten(item.items);
      }
    }

    flatten(groups);
    const index = flat.findIndex((i) => i.href === currentPath);
    return {
      prev: index > 0 ? flat[index - 1] : null,
      next: index !== -1 && index < flat.length - 1 ? flat[index + 1] : null
    };
  });

  // 自动为代码块添加复制按钮
  $effect(() => {
    // 依赖页面路径，确保切换页面时重新扫描
    const path = page.url.pathname;
    const pres = document.querySelectorAll('.doc-content pre');

    pres.forEach((pre) => {
      if (pre.querySelector('.copy-btn')) return;

      const btn = document.createElement('button');
      btn.className = 'copy-btn';
      btn.title = 'Copy code';
      // 使用 Lucide 风格的 SVG 图标
      btn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>`;

      btn.onclick = async (e) => {
        e.preventDefault();
        // 提取代码：优先寻找 code 标签，否则取 pre 内容
        const codeElement = pre.querySelector('code');
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
          btn.classList.add('text-green-500');
          setTimeout(() => {
            btn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>`;
            btn.classList.remove('text-green-500');
          }, 2000);
        } catch (err) {
          console.error('Failed to copy!', err);
        }
      };

      pre.appendChild(btn);
    });
  });

  // 渲染 Mermaid 图表
  $effect(() => {
    // 依赖页面路径变化
    const path = page.url.pathname;
    
    // 查找所有的 mermaid 代码块
    // mdsvex 通常生成的结构是 pre.language-mermaid > code.language-mermaid
    const mermaidBlocks = document.querySelectorAll('pre code.language-mermaid');

    if (mermaidBlocks.length > 0) {
      mermaid.initialize({
        startOnLoad: false,
        theme: 'default',
        fontFamily: 'var(--font-base)',
        securityLevel: 'loose'
      });

      mermaidBlocks.forEach((block) => {
        const pre = block.parentElement;
        if (pre) {
          pre.classList.add('mermaid');
          // 将原始代码内容提取到 pre 标签中，这是 mermaid.run 期待的结构
          pre.textContent = block.textContent;
          // 移除复原按钮（如果有）
          pre.querySelector('.copy-btn')?.remove();
        }
      });

      mermaid.run({
        querySelector: '.mermaid'
      });
    }
  });
</script>

<Header {locale} {groups} />

<div class="mx-auto grid min-h-[calc(100vh-3.5rem)] max-w-7xl grid-cols-1 px-4 lg:grid-cols-[260px_1fr_200px] lg:gap-10">
  <Sidebar {locale} sidebar={groups} />

  <div class="flex flex-col min-w-0">
    <!-- 面包屑导航：在所有屏幕显示 -->
    {#if breadcrumbs.length > 0}
      <nav class="sticky top-14 z-20 flex flex-wrap items-center gap-1.5 border-b border-zinc-100 bg-white py-2 text-sm text-zinc-500">
        {#each breadcrumbs as crumb, i}
          {#if i > 0}
            <ChevronRight size={14} class="text-zinc-300" />
          {/if}
          {#if crumb.href && i < breadcrumbs.length - 1}
            <a href={crumb.href} class="transition-colors hover:text-zinc-950">
              {crumb.title}
            </a>
          {:else}
            <span
              class={i === breadcrumbs.length - 1
                ? "font-medium text-zinc-950"
                : ""}
            >
              {crumb.title}
            </span>
          {/if}
        {/each}
      </nav>
    {/if}

    <main class="doc-content flex-1 pb-10 pt-4 lg:pb-12 lg:pt-6">
      {@render children()}

      <!-- 底部翻页导航 -->
      <nav class="mt-16 flex items-start justify-between gap-4 border-t border-zinc-100 pt-8">
        {#if pagination.prev}
          <a
            href={pagination.prev.href}
            class="group flex flex-1 flex-col gap-1 min-w-0 transition-colors"
          >
            <span class="text-xs font-medium text-zinc-400">{$t('previous', { default: 'Previous' })}</span>
            <span class="flex items-center gap-1 text-base font-semibold text-zinc-600 transition-colors group-hover:text-zinc-950">
              <ChevronLeft size={18} class="shrink-0 transition-transform group-hover:-translate-x-1" />
              {pagination.prev.title}
            </span>
          </a>
        {/if}

        {#if pagination.next}
          <a
            href={pagination.next.href}
            class="group flex flex-1 flex-col items-end gap-1 min-w-0 transition-colors ms-auto"
          >
            <span class="text-xs font-medium text-zinc-400">{$t('next', { default: 'Next' })}</span>
            <span class="flex items-center gap-1 text-base font-semibold text-zinc-600 transition-colors group-hover:text-zinc-950">
              {pagination.next.title}
              <ChevronRight size={18} class="shrink-0 transition-transform group-hover:translate-x-1" />
            </span>
          </a>
        {/if}
      </nav>
    </main>

    <!-- 页面底部信息 -->
    <footer class="mt-16 border-t border-zinc-100 py-8 text-sm text-zinc-500">
      <div class="flex flex-col items-center justify-between gap-2 sm:flex-row">
        <span class="text-zinc-400">Version 0.1.0</span>
        <span>Powered by <a href="https://github.com/biwa-press" class="font-medium text-zinc-950 hover:underline">Biwa Press</a></span>
      </div>
    </footer>
  </div>

  <aside class="lg:block">
    <DocToc items={toc} minDepth={2} maxDepth={3} />
  </aside>
</div>
