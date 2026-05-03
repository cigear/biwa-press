<script lang="ts">
  import { getLocaleConfig, locales, type Locale } from "$lib/config/locales";
  import { getNav } from "$lib/config/nav";
  import { getSidebar, type Group } from "$lib/docs"; // ★ 导入 Group 类型 + getSidebar
  import { site } from "$lib/config/site";
  import SearchDialog from "./SearchDialog.svelte";
  import { t } from "svelte-i18n";

    // ★ 关键：用 props 常量 + 泛型，导出组件 props 类型
  const props = $props<{ locale: Locale }>();
  const locale = $derived(props.locale);

  // 顶部导航（同步）
  const nav = $derived(getNav(locale));
  const currentLocale = $derived(getLocaleConfig(locale));

  let groups: Group[] = $state([]);

  $effect(() => {
    loadSidebar();
  });

  async function loadSidebar() {
    groups = await getSidebar(locale);
  }
  let open = $state(false);
</script>

<header
  class="sticky top-0 z-30 border-b border-zinc-200 bg-white/90 backdrop-blur"
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

    <div class="flex items-center gap-4">
      <nav class="hidden items-center gap-4 md:flex">
        {#each nav as item}
          <a
            class="text-sm text-zinc-600 transition hover:text-zinc-950"
            href={item.href}
          >
            {item.title}
          </a>
        {/each}
      </nav>

      <div class="flex items-center gap-2">
        <span class="text-sm text-zinc-500">{currentLocale.shortLabel}</span>
        <select
          class="rounded-md border border-zinc-200 bg-white px-2 py-1.5 text-sm text-zinc-700 outline-none transition hover:bg-zinc-50"
          aria-label="Language"
          onchange={(event) => {
            const nextLocale = event.currentTarget.value;
            location.href = `/${nextLocale}/docs/guide/getting-started`;
          }}
          value={locale}
        >
          {#each Object.values(locales) as item}
            <option value={item.code}>{item.label}</option>
          {/each}
        </select>
      </div>

      <SearchDialog {locale} />
    </div>
  </div>
</header>

{#if open}
  <div class="fixed inset-0 z-40 lg:hidden">
    <div
      class="fixed inset-0 bg-black/50"
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

    <div class="fixed left-0 top-0 h-full w-64 bg-white p-4 shadow-lg">
      <button
        class="mb-4"
        onclick={() => (open = false)}
        aria-label="Close menu"
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
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      </button>

      <nav class="space-y-4">
        {#each nav as item}
          <a
            class="block text-sm text-zinc-600 transition hover:text-zinc-950"
            href={item.href}
            onclick={() => (open = false)}
          >
            {item.title}
          </a>
        {/each}
      </nav>

      <!-- ★ Sidebar groups（移动端） -->
      <div class="mt-8">
        {#each groups as group}
          <h3 class="mb-2 text-sm font-semibold">{$t(group.title)}</h3>
          <ul class="space-y-2">
            {#each group.items as item}
              <li>
                <a
                  href={`/${locale}/docs/${item.slug}`}
                  class="text-sm text-zinc-600"
                  onclick={() => (open = false)}
                >
                  {$t(item.title)}
                </a>
              </li>
            {/each}
          </ul>
        {/each}
      </div>
    </div>
  </div>
{/if}
