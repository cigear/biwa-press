<script lang="ts">
  import { getLocaleConfig, locales, type Locale } from "$lib/config/locales";
  import { getSidebar, type Group } from "$lib/docs"; // ★ 导入 Group 类型 + getSidebar
  import { site } from "$lib/config/site";
  import SearchDialog from "./SearchDialog.svelte";
  import { Languages, ChevronDown, Check, ChevronRight } from "@lucide/svelte"; // 导入 Lucide 图标
  import { fly, fade } from "svelte/transition";
  import { page } from "$app/stores"; // 导入 page 存储
  import { goto } from "$app/navigation"; // 导入导航函数

  // ★ 关键：用 props 常量 + 泛型，导出组件 props 类型
  const props = $props<{ locale: Locale }>();
  const locale = $derived(props.locale);

  const currentPath = $derived($page.url.pathname); // 获取当前页面路径

  // 顶部导航（同步）
  const currentLocale = $derived(getLocaleConfig(locale));

  let groups: Group[] = $state([]);

  // 响应式加载：当 locale 变化时，自动重新获取侧边栏数据
  $effect(() => {
    getSidebar(locale).then(res => groups = res);
  });

  let open = $state(false);
  let isLangOpen = $state(false);

  // 追踪侧边栏分组展开状态
  let expandedGroups = $state<Record<string, boolean>>({});

  function handleGroupClick(item: Group) {
    expandedGroups[item.title] = !expandedGroups[item.title];
  }

  // 自动展开包含当前激活页面的分组
  $effect(() => {
    const path = currentPath;
    if (groups.length === 0) return;

    function checkActive(items: Group[]): boolean {
      let isActive = false;
      for (const item of items) {
        const href = item.slug ? `/${locale}/docs/${item.slug}` : undefined;
        if (href === path) isActive = true;
        if (item.items && checkActive(item.items)) {
          expandedGroups[item.title] = true;
          isActive = true;
        }
      }
      return isActive;
    }
    checkActive(groups);
  });

  // 递归渲染函数
  // svelte 5 snippet 用于递归
</script>

{#snippet navItem(item: Group, depth: number)}
  {@const hasChildren = item.items && item.items.length > 0}
  <div class="mb-1" style="margin-left: {depth > 0 ? '0.75rem' : '0'}">
    <div class="flex items-center justify-between gap-2">
      {#if item.slug}
        {@const href = `/${locale}/docs/${item.slug}`}
        <a
          {href}
          class="flex-1 py-1.5 text-sm transition-colors {currentPath === href
            ? 'font-bold text-zinc-950 bg-zinc-100 rounded-md px-2 -mx-2' // Active styles
            : 'text-zinc-600 hover:text-zinc-950'}"
          onclick={() => (open = false)}
        >
          {item.title}
        </a>
      {:else if hasChildren}
        <button
          class="flex-1 text-left py-1.5 text-xs font-bold uppercase tracking-wider text-zinc-400 hover:text-zinc-600 transition-colors"
          onclick={() => handleGroupClick(item)}
        >
          {item.title}
        </button>
      {:else}
        <h3 class="py-1.5 text-xs font-bold uppercase tracking-wider text-zinc-400">
          {item.title}
        </h3>
      {/if}

      {#if hasChildren}
        <button
          class="p-1 text-zinc-400 hover:text-zinc-950 transition-colors shrink-0"
          onclick={() => handleGroupClick(item)}
          aria-label="Toggle group"
        >
          <ChevronRight
            size={14}
            class="transition-transform duration-200 {expandedGroups[item.title] ? 'rotate-90' : 'rotate-0'}"
          />
        </button>
      {/if}
    </div>

    {#if hasChildren && expandedGroups[item.title]}
      <div class="mt-1 border-l border-zinc-100 pl-3">
        {#each item.items as subItem}
          {@render navItem(subItem, depth + 1)}
        {/each}
      </div>
    {/if}
  </div>
{/snippet}

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
      <div class="relative">
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
          <div
            transition:fly={{ y: 8, duration: 150 }}
            class="absolute right-0 z-60 mt-2 w-40 overflow-hidden rounded-lg border border-zinc-100 bg-white py-1 shadow-xl"
          >
            {#each Object.values(locales) as item}
              <a
                href={`/${item.code}/docs/guide/getting-started`}
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
          <!-- 点击外部关闭菜单的遮罩层 -->
          <button
            class="fixed inset-0 z-55 cursor-default bg-transparent"
            onclick={() => (isLangOpen = false)}
            aria-label="Close language menu"
          ></button>
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

{#if open}
  <div class="fixed inset-0 z-50 lg:hidden">
    <div
      transition:fade={{ duration: 200 }}
      class="fixed inset-0 bg-zinc-950/40"
      onclick={() => (open = false)}
      onkeydown={(e) => {
        if (e.key === "Escape" || e.key === "Enter") {
          open = false;
        }
      }}
      role="button"
      tabindex="0"
      aria-label="Close menu overlay"
    ></div>

    <div 
      transition:fly={{ x: -300, duration: 300, opacity: 1 }}
      class="fixed left-0 top-0 h-full w-72 border-r border-zinc-100 bg-white p-6 shadow-2xl"
    >
      <div class="flex items-center justify-between">
        <span class="text-sm font-bold text-zinc-900">{site.title}</span>
        <button
          class="flex h-9 w-9 items-center justify-center rounded-full text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-950"
          onclick={() => (open = false)}
          aria-label="Close menu"
        >
          <svg
            class="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>

      <!-- ★ 递归渲染 Sidebar groups（移动端） -->
      <div class="mt-4">
        {#each groups as group}
          {@render navItem(group, 0)}
        {/each}
      </div>
    </div>
  </div>
{/if}
