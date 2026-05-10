<script lang="ts">
  import type { Group } from '$lib/docs';
  import { page } from '$app/state';
  import { goto } from '$app/navigation';
  import SidebarList from './SidebarList.svelte';
  import { ChevronRight } from '@lucide/svelte';

  let {
    items,
    locale,
    depth = 0,
    expandedGroups: passedGroups
  }: { items: Group[], locale: string, depth?: number, expandedGroups?: Record<string, boolean> } = $props();

  // Initialize local state. In Svelte 5, $state() must be a top-level variable declaration.
  const internalState = $state<Record<string, boolean>>({});

  // 使用 $derived 来追踪 passedGroups 属性的变化，确保递归树共享状态
  const expandedGroups = $derived(passedGroups ?? internalState);

  // 获取当前激活的路径，用于高亮显示
  let currentPath = $derived(page.url.pathname);

  function handleGroupClick(item: Group) {
    // 直接修改原始状态对象（Proxy）
    const target = passedGroups ?? internalState;
    target[item.title] = !target[item.title];
  }

  // 自动展开包含当前激活页面的分组
  $effect(() => {
    if (depth !== 0 || items.length === 0) return;

    function checkActive(list: Group[]): boolean {
      const path = page.url.pathname;
      const target = passedGroups ?? internalState;
      let isActive = false;
      for (const item of list) {
        const href = item.slug ? `/${locale}/docs/${item.slug}` : undefined;
        if (href === path) isActive = true;
        if (item.items && checkActive(item.items)) {
          target[item.title] = true;
          isActive = true;
        }
      }
      return isActive;
    }
    checkActive(items);
  });
</script>

<ul class={depth === 0 ? "space-y-2" : "mt-1 space-y-1 border-l border-zinc-100 ml-2 pl-4"}>
  {#each items as item}
    {@const hasChildren = item.items && item.items.length > 0}
    <li class="relative">
      <div class="flex items-center justify-between gap-2">
        {#if item.slug}
          {@const href = `/${locale}/docs/${item.slug}`}
          <a
            {href}
            class="flex-1 py-1.5 text-sm transition-colors {currentPath === href 
              ? 'font-bold text-zinc-950 bg-zinc-100 rounded-md px-2 -mx-2' 
              : 'text-zinc-600 hover:text-zinc-950 hover:bg-zinc-50 rounded-md px-2 -mx-2'}"
          >
            {item.title}
          </a>
        {:else if hasChildren}
          <button
            class="flex-1 text-left py-1.5 text-xs font-bold uppercase tracking-wider text-zinc-400 hover:text-zinc-600 transition-colors"
            onclick={() => handleGroupClick(item)}
          >
            {item.title}
          </button>
        {:else}
          <h3 class="py-1.5 text-xs font-bold uppercase tracking-wider text-zinc-400">
            {item.title}
          </h3>
        {/if}

        {#if hasChildren}
          <button
            class="p-1 text-zinc-400 hover:text-zinc-950 transition-colors shrink-0"
            onclick={() => handleGroupClick(item)}
            aria-label="Toggle group"
          >
            <ChevronRight
              size={14}
              class="transition-transform duration-200 {expandedGroups[item.title] ? 'rotate-90' : 'rotate-0'}"
            />
          </button>
        {/if}
      </div>

      {#if hasChildren && expandedGroups[item.title]}
        <!-- 递归调用自身，且根据展开状态判断是否显示 -->
        <SidebarList items={item.items ?? []} {locale} depth={depth + 1} expandedGroups={passedGroups ?? internalState} />
      {/if}
    </li>
  {/each}
</ul>