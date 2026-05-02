<script lang="ts">
  import type { Locale } from '$lib/config/locales';
  import Header from './Header.svelte';
  import Sidebar from './Sidebar.svelte';

  let { locale, metadata, children }: { locale: Locale; metadata: Record<string, string>; children: import('svelte').Snippet } = $props();
</script>

<svelte:head>
  <title>{metadata?.title ?? 'Docs'}</title>
  <meta name="description" content={metadata?.description ?? ''} />
</svelte:head>

<div class="min-h-screen bg-white text-zinc-950">
  <Header {locale} />

  <div class="mx-auto grid max-w-7xl grid-cols-1 px-4 lg:grid-cols-[260px_1fr] lg:gap-10">
    <Sidebar {locale} />

    <main class="doc-content min-w-0 py-10 lg:py-12">
      {@render children()}
    </main>
  </div>
</div>
