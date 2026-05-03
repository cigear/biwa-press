<script lang="ts">
  import SidebarList from './SidebarList.svelte';

  export type SidebarItem = {
    slug: string;
    title: string;
    href?: string;
    children?: SidebarItem[];
  };

  // ★ runes 模式：props 必须放进 state，否则只捕获初始值
  let { items, pathname } = $props() as {
    items: SidebarItem[];
    pathname: string;
  };

  // ★ 关键修复：把 pathname 放进 $state
  let path = $state(() => pathname);

  function isActive(item: SidebarItem): boolean {
    return !!item.href && path() === item.href;
  }

  function isActiveOrParent(item: SidebarItem): boolean {
    if (item.href && path().startsWith(item.href)) return true;
    if (!item.children) return false;
    return item.children.some(isActiveOrParent);
  }
</script>

<ul class="space-y-2">
  {#each items as item}
    {#if item.href}
      <li>
        <a
          href={item.href}
          class={`block text-sm px-2 py-1 rounded ${
            isActive(item)
              ? 'bg-zinc-200 text-zinc-900 font-semibold'
              : 'text-zinc-600 hover:text-zinc-900'
          }`}
        >
          {item.title}
        </a>
      </li>
    {:else}
      {#if isActiveOrParent(item)}
        <li>
          <div class="text-sm font-semibold text-zinc-900 px-2 py-1">
            {item.title}
          </div>
          <ul class="ml-4 border-l pl-4 space-y-2">
            <SidebarList items={item.children!} pathname={path()} />
          </ul>
        </li>
      {:else}
        <li>
          <div class="text-sm text-zinc-600 px-2 py-1">
            {item.title}
          </div>
        </li>
      {/if}
    {/if}
  {/each}
</ul>
