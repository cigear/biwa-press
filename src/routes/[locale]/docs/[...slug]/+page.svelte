<script lang="ts">
  import type { Locale } from '$lib/config/locales';
  import type { Group } from '$lib/docs';
  import DocLayout from '$lib/components/DocLayout.svelte';

  let { data }: { data: { 
    locale: Locale; 
    contentHtml: string; 
    metadata: Record<string, any>; 
    toc: any[]; 
    sidebar: Group[];
  } } = $props();
</script>

<DocLayout
  locale={data.locale}
  metadata={data.metadata}
  toc={data.toc}
  groups={data.sidebar}
>
  <div class="prose max-w-none prose-zinc 
    prose-headings:scroll-mt-20 
    prose-a:text-zinc-900 prose-a:font-medium hover:prose-a:text-zinc-600
    prose-pre:bg-zinc-950 prose-pre:border prose-pre:border-zinc-800">
    {@html data.contentHtml}
  </div>
</DocLayout>
