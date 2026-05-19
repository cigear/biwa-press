<script lang="ts">
  import { page } from '$app/state';
  import { locale } from 'svelte-i18n';
  import { site } from '$lib/config/site';

  // 🌟 核心修复：必须显式接收 data，保持 SvelteKit 数据链通畅
  let { data, children } = $props();

  $effect(() => {
    if (data?.locale) {
      locale.set(data.locale);
    }
  });

  // SEO 逻辑收敛到 Layout 中，实现“一次配置，全站受益”
  const title = $derived(page.data.metadata?.title || site.title);
  const description = $derived(page.data.metadata?.description || site.description);
  const baseUrl = $derived((site.url && typeof site.url === 'string' && site.url.length > 0) ? site.url : page.url.origin);
  const ogImage = $derived(
    page.data.metadata?.image 
      ? (page.data.metadata.image.startsWith('http') ? page.data.metadata.image : `${baseUrl}${page.data.metadata.image.startsWith('/') ? '' : '/'}${page.data.metadata.image}`)
      : `${baseUrl}/images/og-image.png`
  );
</script>

<!-- 🌟 核心修复：在这里写上 <svelte:head> 承接后端吐出的元数据或设置全局兜底 -->
<svelte:head>
  <title>{title}</title>
  <meta name="description" content={description} />
  <link rel="canonical" href={page.url.href} />
  
  {#if Array.isArray(page.data.metadata?.tags) && page.data.metadata.tags.length > 0}
    <meta name="keywords" content={page.data.metadata.tags.join(', ')} />
  {/if}

  <!-- Open Graph -->
  <meta property="og:type" content={page.url.pathname.includes('/docs/') ? 'article' : 'website'} />
  <meta property="og:site_name" content={site.title} />
  <meta property="og:title" content={title} />
  <meta property="og:description" content={description} />
  <meta property="og:url" content={page.url.href} />
  <meta property="og:image" content={ogImage} />

  <!-- Twitter -->
  <meta name="twitter:card" content="summary_large_image" />
  {#if site.twitterHandle}
    <meta name="twitter:site" content={site.twitterHandle} />
  {/if}
  <meta name="twitter:url" content={page.url.href} />
  <meta name="twitter:title" content={title} />
  <meta name="twitter:description" content={description} />
  <meta name="twitter:image" content={ogImage} />
</svelte:head>

{@render children()}