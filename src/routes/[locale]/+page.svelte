<script lang="ts">
  import Header from '$lib/components/Header.svelte';
  import StartPage from '$lib/components/StartPage.svelte';
  import { defaultLocale, getLocaleConfig, locales, type Locale } from '$lib/config/locales';
  import { site } from '$lib/config/site';
  import type { PageData } from './$types';
  
  let { data } = $props<{ data: PageData }>();

  // 移除 $state 切换逻辑，直接从路由数据中派生当前语言
  // 这样当访问 /en 时，currentViewLocale 始终为 'en'
  const currentViewLocale = $derived(data.locale as Locale);
</script>

<svelte:head>
  <title>{site.title}</title>
  <meta name="description" content={site.description} />
</svelte:head>

<div class="flex min-h-screen flex-col bg-white text-zinc-950">
  <Header locale={currentViewLocale} groups={data.sidebar} />
  
  <!-- 渲染从服务器加载的 Markdown 内容 -->
  <StartPage contentHtml={data.contentHtml} />

  <footer class="mx-auto max-w-5xl px-6 py-12 border-t border-zinc-100 text-sm text-zinc-500">
    <div class="flex flex-col items-center justify-between gap-2 sm:flex-row">
      <span class="text-zinc-400">© {new Date().getFullYear()} {site.title} · v0.1.0</span>
      <span>Powered by <a href="https://github.com/cigear/biwa-press" class="font-medium text-zinc-950 hover:underline">Biwa Press</a></span>
    </div>
  </footer>
</div>
