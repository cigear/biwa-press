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

<Header {locale} groups={[]} {currentPath} collection="blogs" />

<div class="mx-auto max-w-4xl px-4 py-10 min-h-screen bg-background text-foreground">
  <article class="doc-content">
    <h1 class="text-4xl font-bold mb-4">{metadata.title}</h1>
    <div class="flex gap-4 text-sm text-muted-foreground mb-8">
      <span>{metadata.published}</span>
      <span>{metadata.author || 'Admin'}</span>
    </div>

    {@render children()}
  </article>

  <!-- 博客通常不需要左侧边栏，但可能需要侧边目录 -->
  <DocToc items={toc} minDepth={2} maxDepth={3} />
</div>

<Footer />