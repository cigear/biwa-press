<script lang="ts">
  import type { Locale } from '$lib/config/locales';
  import Header from './Header.svelte';
  import Sidebar from './Sidebar.svelte';
  import DocToc from './DocToc.svelte';

  // ★★★ props 只能在顶层声明一次 ★★★
  const props = $props<{
    locale: Locale;
    metadata: Record<string, any>;
    toc: any[];
    children: import('svelte').Snippet;
  }>();

  // ★★★ 这些 props 不会变化，不需要 state ★★★
  const locale = $derived(props.locale);
  const metadata = $derived(props.metadata);
  const children = $derived(props.children);

  // ★★★ toc 会变化（路由切换），必须用 state ★★★
  // ★★★ 初始化必须是静态值，否则报错 ★★★
  let toc = $state<any[]>([]);

  // ★★★ props.toc → toc（动态同步）★★★
  $effect(() => {
    toc = props.toc ?? [];
  });
</script>

<svelte:head>
  <title>{metadata?.title ?? 'Docs'}</title>
  <meta name="description" content={metadata?.description ?? ''} />
</svelte:head>

<div class="min-h-screen bg-white text-zinc-950">
  <Header {locale} />

  <div class="mx-auto grid max-w-7xl grid-cols-1 px-4 lg:grid-cols-[260px_1fr_260px] lg:gap-10">
    
    <!-- 左侧 Sidebar -->
    <Sidebar {locale} />

    <!-- 中间内容 -->
    <main class="doc-content min-w-0 py-10 lg:py-12">
      {@render children()}
    </main>

    <!-- 右侧 TOC -->
    <aside class="hidden lg:block pt-10 lg:pt-12">
      <DocToc items={toc} minDepth={2} maxDepth={3} />
    </aside>
  </div>
</div>
