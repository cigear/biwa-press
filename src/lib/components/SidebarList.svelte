<script module lang="ts">
  export type SidebarItem = {
    title: string;
    href?: string;
    children?: SidebarItem[];
  };

  // ★ props はここだけで定義する（script は 1 つだけ）
  export let items: SidebarItem[] = [];
</script>

<ul class="space-y-2">
  {#each items as item}
    <li>
      {#if item.href}
        <a
          href={item.href}
          class="text-sm text-zinc-600 hover:text-zinc-950 transition"
        >
          {item.title}
        </a>
      {:else}
        <div class="text-sm font-semibold text-zinc-950 mb-1">
          {item.title}
        </div>

        {#if item.children && item.children.length}
          <ul class="ml-4 border-l pl-4 space-y-2">
            <!-- ★ Svelte 公式の自己再帰 -->
            <svelte:self items={item.children} />
          </ul>
        {/if}
      {/if}
    </li>
  {/each}
</ul>
