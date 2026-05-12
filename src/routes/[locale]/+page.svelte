<script lang="ts">
  import Header from '$lib/components/Header.svelte';
  import { defaultLocale, getLocaleConfig, locales, type Locale } from '$lib/config/locales';
  import { site } from '$lib/config/site';
  import type { PageData } from './$types';
  
  let { data } = $props<{ data: PageData }>();

  // 移除 $state 切换逻辑，直接从路由数据中派生当前语言
  // 这样当访问 /en 时，currentViewLocale 始终为 'en'
  const currentViewLocale = $derived(data.locale as Locale);
  
  // 使用 $derived 确保页面文字配置随 currentViewLocale 自动更新
  const text = $derived(getLocaleConfig(currentViewLocale));
</script>

<svelte:head>
  <title>{site.title}</title>
  <meta name="description" content={site.description} />
</svelte:head>

<div class="flex min-h-screen flex-col bg-white text-zinc-950">
  <Header locale={currentViewLocale} groups={data.sidebar} />

  <main class="mx-auto w-full max-w-5xl flex-1 px-6 py-24">
    <p class="text-sm font-medium text-brand">{text.eyebrow}</p>
    <h1 class="mt-4 max-w-3xl text-5xl font-semibold leading-tight tracking-normal">
      {text.headline}
    </h1>
    <p class="mt-5 max-w-2xl text-lg leading-8 text-zinc-600">
      {text.intro}
    </p>
    <div class="mt-8 flex flex-wrap gap-3">
      <a
        class="rounded-md bg-zinc-950 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-800"
        href={`/${currentViewLocale}/docs/guide/getting-started`}
      >
        {text.getStarted}
      </a>
      <a
        class="rounded-md border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50"
        href={`/${currentViewLocale}/docs/guide/configuration`}
      >
        {text.configuration}
      </a>
    </div>
  </main>

  <footer class="mx-auto max-w-5xl px-6 py-12 border-t border-zinc-100 text-sm text-zinc-500">
    <div class="flex flex-col items-center justify-between gap-2 sm:flex-row">
      <span class="text-zinc-400">Version 0.1.0</span>
      <span>Powered by <a href="https://github.com/biwa-press" class="font-medium text-zinc-950 hover:underline">Biwa Press</a></span>
    </div>
  </footer>
</div>
