<script lang="ts">
  import type { SidebarItem } from '$lib/docs';
  import { page } from '$app/state';
  import SidebarList from './SidebarList.svelte';

  let { items, locale, depth = 0 }: { items: SidebarItem[], locale: string, depth?: number } = $props();

  // 获取当前激活的路径，用于高亮显示
  let currentPath = $derived(page.url.pathname);
</script>

<ul class={depth === 0 ? "space-y-6" : "mt-2 space-y-1 border-l border-zinc-100 ml-2 pl-4"}>
  {#each items as item}
    <li>
      {#if item.slug}
        {@const href = `/${locale}/docs/${item.slug}`}
        <a
          {href}
          class="block text-sm transition-colors {currentPath === href 
            ? 'font-bold text-zinc-950 bg-zinc-100 rounded-md py-1 px-2 -mx-2' 
            : 'text-zinc-600 hover:text-zinc-950 hover:bg-zinc-50 rounded-md py-1 px-2 -mx-2'}"
        >
          {item.title}
        </a>
      {:else}
        <!-- 如果没有 slug，说明是一个目录分组标题 -->
        <h3 class="text-sm font-semibold text-zinc-900">
          {item.title}
        </h3>
      {/if}

      {#if item.items && item.items.length > 0}
        <!-- 递归调用自身 -->
        <SidebarList items={item.items} {locale} depth={depth + 1} />
      {/if}
    </li>
  {/each}
</ul>