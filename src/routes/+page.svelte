<script lang="ts">
  import Header from '$lib/components/Header.svelte';
  import { defaultLocale, getLocaleConfig, locales, type Locale } from '$lib/config/locales';
  import { site } from '$lib/config/site';
  

  // 使用默认语言或从 URL 逻辑获取的语言
  const currentViewLocale = defaultLocale;
  const text = getLocaleConfig(currentViewLocale);
</script>

<svelte:head>
  <title>{site.title}</title>
  <meta name="description" content={site.description} />
</svelte:head>

<div class="min-h-screen bg-white text-zinc-950">
  <!-- 3. 将响应式语言传递给 Header -->
  <Header locale={currentViewLocale} />

  <main class="mx-auto max-w-5xl px-6 py-24">
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
</div>
