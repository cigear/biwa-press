<script lang="ts">
  import Header from "./Header.svelte";
  import Footer from "./Footer.svelte";
  import DocToc from "./DocToc.svelte";
  import type { Locale } from "$lib/config/locales";

  let {
    locale,
    metadata,
    children,
    toc = [],
    currentPath,
  }: {
    locale: Locale;
    metadata: Record<string, any>;
    children: import("svelte").Snippet;
    toc?: any[];
    currentPath: string;
  } = $props();
</script>

<Header {locale} groups={[]} {currentPath} collection="News" />

<div class="mx-auto max-w-5xl px-4 py-10 min-h-screen bg-background text-foreground">
  <header class="mb-8 border-b border-border pb-8">
    <div class="mb-4">
      <span class="inline-block bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
        News
      </span>
    </div>
    <h1 class="text-4xl md:text-5xl font-black mb-4 tracking-tight leading-tight">
      {metadata.title}
    </h1>
    <div class="flex items-center gap-4 text-sm text-muted-foreground">
      <time datetime={metadata.published}>{metadata.published}</time>
      {#if metadata.author}
        <span class="w-1 h-1 bg-muted-foreground rounded-full"></span>
        <span>{metadata.author}</span>
      {/if}
    </div>
  </header>

  <div class="grid grid-cols-1 lg:grid-cols-[1fr_250px] gap-12">
    <article class="doc-content prose prose-zinc dark:prose-invert max-w-none">
      {@render children()}
    </article>

    <aside class="hidden lg:block">
      <DocToc items={toc} minDepth={2} maxDepth={3} />
    </aside>
  </div>
</div>

<Footer />