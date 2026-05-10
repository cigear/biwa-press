<script lang="ts">
  import type { Locale } from '$lib/config/locales';
  import { getSidebar, type Group } from '$lib/docs';
  import SidebarList from './SidebarList.svelte';

  let { locale }: { locale: Locale } = $props();

  let sidebar = $state<Group[]>([]);

  // ★★★ 正确写法：$effect 内部调用 async 函数 ★★★
  $effect(() => {
    loadSidebar();
  });

  async function loadSidebar() {
    sidebar = await getSidebar(locale);
  }
</script>

<aside class="hidden border-r border-zinc-200 py-8 pr-8 lg:block">
  <SidebarList items={sidebar} {locale} />
</aside>
