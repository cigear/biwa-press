<script lang="ts">
  import type { Locale } from '$lib/config/locales';
  import type { Group } from '$lib/docs';
  import SidebarList from './SidebarList.svelte';

  let { locale, sidebar: initialSidebar = [], currentPath }: { locale: Locale, sidebar?: Group[], currentPath: string } = $props();

  let fetchedSidebar = $state<Group[] | null>(null);
  let sidebar = $derived(fetchedSidebar ?? initialSidebar);
</script>

<aside class="sticky top-14 hidden h-[calc(100vh-3.5rem)] overflow-y-auto border-r border-zinc-100 py-8 pr-8 lg:block">
  <SidebarList items={sidebar} {locale} {currentPath} />
</aside>
