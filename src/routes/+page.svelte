<script lang="ts">
  import Header from '$lib/components/Header.svelte';
  import { defaultLocale, getLocaleConfig, locales, type Locale } from '$lib/config/locales';
  import { site } from '$lib/config/site';
  

  // 使用 $state 包装，使其在检测到浏览器语言后可以更新
  let currentViewLocale = $state<Locale>(defaultLocale);
  
  // 使用 $derived 确保页面文字配置随 currentViewLocale 自动更新
  const text = $derived(getLocaleConfig(currentViewLocale));

  // Svelte 5: $effect 会在组件挂载到客户端后执行
  $effect(() => {
    // navigator.language 通常返回 "zh-CN" 或 "en-US"
    const browserLang = navigator.language.split('-')[0] as Locale;
    
    // 如果浏览器首选语言在我们的支持列表中，则自动切换状态
    if (locales[browserLang]) {
      currentViewLocale = browserLang;
    }
  });
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
