<script lang="ts">
  import { page } from '$app/state';
  import type { Locale } from '$lib/config/locales';
  import type { Group } from '$lib/docs';
  import { site } from '$lib/config/site';
  import DocLayout from '$lib/components/DocLayout.svelte';

  let { data }: { data: { 
    locale: Locale; 
    contentHtml: string; 
    metadata: Record<string, any>; 
    toc: any[]; 
    sidebar: Group[];
    path: string;
  } } = $props();

  const title = $derived(data.metadata?.title || site.title);
  const description = $derived(data.metadata?.description || site.description);
  const url = $derived(page.url.href);
  
  // 确保 site.url 始终是一个有效的字符串。如果未设置，则回退到当前页面的 origin。
  const baseUrl = (site.url && typeof site.url === 'string' && site.url.length > 0) ? site.url : page.url.origin;
  const ogImage = $derived(
    data.metadata?.image 
      ? (data.metadata.image.startsWith('http') ? data.metadata.image : `${baseUrl}${data.metadata.image.startsWith('/') ? '' : '/'}${data.metadata.image}`)
      : `${baseUrl}/images/og-image.png`
  );
</script>

<DocLayout
  locale={data.locale}
  metadata={data.metadata}
  toc={data.toc}
  groups={data.sidebar}
  currentPath={data.path}
  // page.params.slug can be undefined for the root of a [...slug] route
  slug={page.params.slug}
>
  <div class="prose max-w-none prose-zinc 
    prose-headings:scroll-mt-20 
    prose-a:text-zinc-900 prose-a:font-medium hover:prose-a:text-zinc-600
    prose-pre:bg-zinc-950 prose-pre:border prose-pre:border-zinc-800">
    {@html data.contentHtml}
  </div>
</DocLayout>
