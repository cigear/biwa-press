<script lang="ts">
  import type { Locale } from '$lib/config/locales';
  import { getSidebar } from '$lib/config/sidebar';

  let { locale }: { locale: Locale } = $props();

  // Svelte 5 响应式变量必须用 $state
  let sidebar = $state<{
    title: string;
    items: { title: string; href: string }[];
  }[]>([]);

  // ★★★ 正确写法：$effect 内部调用 async 函数 ★★★
  $effect(() => {
    loadSidebar();
  });

  async function loadSidebar() {
    sidebar = await getSidebar(locale);
  }
</script>

<aside class="hidden border-r border-zinc-200 py-8 pr-8 lg:block">
  {#each sidebar as group}
    <section class="mb-8">
      <h2 class="mb-3 text-sm font-semibold text-zinc-950">{group.title}</h2>
      <div class="grid gap-2">
        {#each group.items as item}
          <a class="text-sm text-zinc-600 transition hover:text-zinc-950" href={item.href}>
            {item.title}
          </a>
        {/each}
      </div>
    </section>
  {/each}
</aside>
