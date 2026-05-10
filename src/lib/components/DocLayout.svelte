<script lang="ts">
  import { page } from '$app/state';
  import type { Locale } from '$lib/config/locales';
  import { getSidebar, type Group } from '$lib/docs';
  import Header from './Header.svelte';
  import Sidebar from './Sidebar.svelte';
  import DocToc from './DocToc.svelte';
  import { ChevronRight, ChevronLeft } from '@lucide/svelte';

  let { 
    locale, 
    metadata, 
    children, 
    toc = [] 
  }: { 
    locale: Locale; 
    metadata: Record<string, any>; 
    children: import('svelte').Snippet; 
    toc?: { depth: number; text: string; slug: string }[] 
  } = $props();

  // PC 端面包屑逻辑
  let groups = $state<Group[]>([]);
  $effect(() => {
    getSidebar(locale).then(res => groups = res);
  });

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

      btn.onclick = async () => {
        const code = pre.querySelector('code')?.innerText || '';
        try {
          await navigator.clipboard.writeText(code);
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
</script>

<svelte:head>
  <title>{metadata?.title ?? 'Docs'}</title>
  <meta name="description" content={metadata?.description ?? ''} />
</svelte:head>

<div class="min-h-screen bg-white text-zinc-950">
  <Header {locale} />

  <div class="mx-auto grid max-w-7xl grid-cols-1 px-4 lg:grid-cols-[260px_1fr_200px] lg:gap-10">
    <Sidebar {locale} />

    <main class="doc-content min-w-0 py-10 lg:py-12">
      <!-- 面包屑导航：在所有屏幕显示 -->
      {#if breadcrumbs.length > 0}
        <nav class="mb-6 flex flex-wrap items-center gap-1.5 text-sm text-zinc-500">
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

      {@render children()}

      <!-- 底部翻页导航 -->
      <nav class="mt-16 flex items-start justify-between gap-4 border-t border-zinc-100 pt-8">
        {#if pagination.prev}
          <a
            href={pagination.prev.href}
            class="group flex flex-1 flex-col gap-1 min-w-0 transition-colors"
          >
            <span class="text-xs font-medium text-zinc-400">Previous</span>
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
            <span class="text-xs font-medium text-zinc-400">Next</span>
            <span class="flex items-center gap-1 text-base font-semibold text-zinc-600 transition-colors group-hover:text-zinc-950">
              {pagination.next.title}
              <ChevronRight size={18} class="shrink-0 transition-transform group-hover:translate-x-1" />
            </span>
          </a>
        {/if}
      </nav>
    </main>

    <aside class="py-12 lg:block">
      <DocToc items={toc} minDepth={2} maxDepth={3} />
    </aside>
  </div>
</div>