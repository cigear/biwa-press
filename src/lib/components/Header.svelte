<script lang="ts">
  import { getLocaleConfig, locales, type Locale } from "$lib/config/locales";
  import type { Group } from "$lib/docs"; 
  import { site } from "$lib/config/site";
  import SearchDialog from "./SearchDialog.svelte";
  import Drawer from "./Drawer.svelte";
  import { Languages, ChevronDown, Check } from "@lucide/svelte";
  import { fly } from "svelte/transition";
  import { page } from "$app/state"; // 使用 Svelte 5 的 state page 替代 store
  import { goto } from "$app/navigation"; // 导入导航函数

  let { locale, groups: initialGroups = [] }: { locale: Locale, groups?: Group[] } = $props();

  const currentPath = $derived(page.url.pathname); // 获取当前页面路径

  // 顶部导航（同步）
  const currentLocale = $derived(getLocaleConfig(locale));

  let fetchedGroups = $state<Group[] | null>(null);
  let groups = $derived(fetchedGroups ?? initialGroups);

  let open = $state(false);
  let isLangOpen = $state(false);

  /**
   * 根据当前 URL 和目标语言生成新的本地化 URL
   * @param targetLocale 目标语言 (e.g., 'en', 'ja', 'zh')
   * @returns 包含新语言的完整 URL 路径
   */
  function getLocalizedHref(targetLocale: Locale): string {
    const pathParts = currentPath.split('/');
    // pathParts[0] is an empty string
    // pathParts[1] should be the current locale (e.g., 'en', 'ja', 'zh')

    if (pathParts.length > 1 && locales[pathParts[1] as Locale]) {
      pathParts[1] = targetLocale;
      return pathParts.join('/');
    }
    // Fallback for paths like '/' or if locale is not in the first segment
    return `/${targetLocale}/`;
  }
</script>

<header
  class="sticky top-0 z-30 border-b border-zinc-200 bg-white"
>
  <div class="mx-auto flex h-14 max-w-7xl items-center justify-between px-4">
    <div class="flex items-center gap-4">
      <button
        class="lg:hidden"
        onclick={() => (open = !open)}
        aria-label="Toggle menu"
      >
        <svg
          class="h-6 w-6"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M4 6h16M4 12h16M4 18h16"
          />
        </svg>
      </button>
      <a
        href={`/${locale}/docs/guide/getting-started`}
        class="text-sm font-semibold text-zinc-950"
      >
        {site.title}
      </a>
    </div>

    <div class="flex items-center gap-3 sm:gap-4">
      <!-- 语言切换 -->
      <div class="relative z-[56]"> <!-- 添加 z-index，确保其堆叠上下文高于遮罩层 -->
        <button
          onclick={() => (isLangOpen = !isLangOpen)}
          class="relative z-61 flex cursor-pointer items-center gap-1 rounded-full border border-zinc-200 bg-white px-3 py-1 text-sm text-zinc-500 transition-colors hover:text-zinc-950 active:scale-95 sm:px-4 sm:py-1.5"
        >
          <Languages size={16} />
          <span class="hidden sm:inline">{currentLocale.label}</span>
          <span class="sm:hidden">{currentLocale.shortLabel}</span>
          <ChevronDown
            size={14}
            class="ml-1 transition-transform duration-200 {isLangOpen
              ? 'rotate-180'
              : ''}"
          />
        </button>

        {#if isLangOpen}
          <button class="fixed inset-0 z-10 cursor-default bg-transparent"
            onclick={() => (isLangOpen = false)}
            aria-label="Close language menu"
          ></button>

          <div
            transition:fly={{ y: 8, duration: 150 }}
            class="absolute right-0 z-20 mt-2 w-40 overflow-hidden rounded-lg border border-zinc-100 bg-white py-1 shadow-xl"
          > {#each Object.values(locales) as item}
              {@const targetHref = getLocalizedHref(item.code)}
              <a
                href={targetHref}
                data-sveltekit-preload-data="off"
                class="flex w-full items-center justify-between px-4 py-3 text-sm transition-colors {item.code ===
                locale
                  ? 'bg-zinc-50 font-bold text-zinc-950'
                  : 'text-zinc-600 hover:bg-zinc-50'}"
                onclick={() => (isLangOpen = false)}
              >
                {item.label}
                {#if item.code === locale}
                  <Check size={14} class="text-zinc-950" />
                {/if}
              </a>
            {/each}
          </div>
        {/if}
      </div>

      <SearchDialog {locale} onSelect={() => (open = false)} />

      <a
        href="https://github.com/cigear"
        target="_blank"
        rel="noopener noreferrer"
        class="text-zinc-950 transition-colors hover:opacity-70"
        aria-label="GitHub"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
          <path d="M9 18c-4.51 2-5-2-7-2" />
        </svg>
      </a>
    </div>
  </div>
</header>

<Drawer bind:open {locale} {groups} />
