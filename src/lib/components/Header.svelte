<script lang="ts">
  import { getLocaleConfig, locales, type Locale } from "$lib/config/locales";
  import type { Group } from "$lib/docs"; 
  import { site } from "$lib/config/site";
  import SearchDialog from "./SearchDialog.svelte";
  import ThemeToggle from "./ThemeToggle.svelte";
  import Drawer from "./Drawer.svelte";
  import { Languages, ChevronDown, Check } from "@lucide/svelte";
  import { fly } from "svelte/transition";
  import { page } from "$app/state"; // 使用 Svelte 5 的 state page 替代 store
  import { goto } from "$app/navigation"; // 导入导航函数

  let {
    locale,
    groups: initialGroups = [],
    currentPath,
    collection // Make collection property optional
  }: { locale: Locale, groups?: Group[], currentPath: string, collection?: string } = $props();

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
  class="sticky top-0 z-30 border-b border-border bg-background text-foreground"
>
  <div class="mx-auto flex h-14 max-w-7xl items-center justify-between px-4">
    <div class="flex items-center gap-4">
      <button
        class="lg:hidden text-foreground"
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
        href={`/${locale}/`}
        class="text-sm font-semibold text-foreground"
      >
        {site.title}
      </a>
    </div>

    <div class="flex items-center gap-3 sm:gap-4">
      <!-- 主题切换按钮 -->
      <ThemeToggle />

      <!-- 语言切换 -->
      <div class="relative z-56"> <!-- 添加 z-index，确保其堆叠上下文高于遮罩层 -->
        <button
          onclick={() => (isLangOpen = !isLangOpen)}
          class="relative z-61 flex cursor-pointer items-center gap-1 rounded-full border border-border bg-background px-3 py-1 text-sm text-muted-foreground transition-colors hover:text-foreground active:scale-95 sm:px-4 sm:py-1.5"
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
            class="absolute right-0 z-20 mt-2 w-40 overflow-hidden rounded-lg border border-border bg-background py-1 shadow-xl"
          > {#each Object.values(locales) as item}
              {@const targetHref = getLocalizedHref(item.code)}
              <a
                href={targetHref}
                data-sveltekit-preload-data="off"
                class="flex w-full items-center justify-between px-4 py-3 text-sm transition-colors {item.code ===
                locale
                  ? 'bg-secondary font-bold text-foreground'
                  : 'text-muted-foreground hover:bg-secondary hover:text-foreground'}"
                onclick={() => (isLangOpen = false)}
              >
                {item.label}
                {#if item.code === locale}
                  <Check size={14} class="text-foreground" />
                {/if}
              </a>
            {/each}
          </div>
        {/if}
      </div>

      <SearchDialog {locale} {currentPath} onSelect={() => (open = false)} />

      <a
        href="https://github.com/cigear"
        target="_blank"
        rel="noopener noreferrer"
        class="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-background text-muted-foreground transition-all hover:bg-secondary hover:text-foreground dark:bg-foreground dark:text-background dark:border-transparent dark:hover:opacity-90"
        aria-label="GitHub"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="currentColor"
        >
          <path d="M12 1.27c-5.93 0-10.73 4.8-10.73 10.73 0 4.75 3.08 8.77 7.35 10.2.54.1.73-.23.73-.52 0-.25-.01-.93-.01-1.83-2.98.65-3.61-1.44-3.61-1.44-.49-1.24-1.19-1.57-1.19-1.57-.97-.66.07-.65.07-.65 1.07.08 1.64 1.1 1.64 1.1.96 1.64 2.51 1.17 3.12.89.1-.69.37-1.17.68-1.44-2.38-.27-4.88-1.19-4.88-5.3 0-1.17.42-2.13 1.11-2.88-.11-.27-.48-1.36.1-2.84 0 0 .9-.29 2.94 1.1a10.16 10.16 0 0 1 5.37 0c2.04-1.39 2.94-1.1 2.94-1.1.59 1.48.22 2.57.11 2.84.69.75 1.11 1.71 1.11 2.88 0 4.12-2.51 5.02-4.9 5.29.38.33.72.98.72 1.97 0 1.43-.01 2.58-.01 2.93 0 .29.19.63.74.52 4.27-1.43 7.34-5.45 7.34-10.2 0-5.93-4.8-10.73-10.73-10.73z" />
        </svg>
      </a>
    </div>
  </div>
</header>

<Drawer bind:open {locale} {groups} {currentPath} {collection} />
