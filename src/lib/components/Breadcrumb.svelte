<script lang="ts">
  import { page } from '$app/state';
  import type { Locale } from '$lib/config/locales';
  import type { Group } from '$lib/docs';
  import { ChevronRight } from '@lucide/svelte';

  let { locale, groups, currentPath }: { locale: Locale, groups: Group[], currentPath: string } = $props();

  const breadcrumbs = $derived.by(() => {
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
</script>

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
        <span class={i === breadcrumbs.length - 1 ? "font-medium text-zinc-950" : ""}>
          {crumb.title}
        </span>
      {/if}
    {/each}
  </nav>
{/if}