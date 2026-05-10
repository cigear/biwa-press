<script lang="ts">
  import { Dialog } from 'bits-ui';
  import { getLocaleConfig, type Locale } from '$lib/config/locales';
  import { searchDocs } from '$lib/search';
  import { Search } from '@lucide/svelte';

  let open = $state(false);
  let query = $state('');
  let { locale, onSelect }: { locale: Locale; onSelect?: () => void } = $props();
  const text = $derived(getLocaleConfig(locale));
  const results = $derived(searchDocs(locale, query));
</script>

<Dialog.Root bind:open>
  <Dialog.Trigger
    class="flex items-center justify-center rounded-md border border-zinc-200 p-2 text-zinc-950 transition hover:bg-zinc-50"
    aria-label={text.search}
  >
    <Search size={18} />
  </Dialog.Trigger>

  <Dialog.Portal>
    <Dialog.Overlay class="fixed inset-0 z-40 bg-black/40" />
    <Dialog.Content
      class="fixed left-1/2 top-24 z-50 w-[min(640px,calc(100vw-2rem))] -translate-x-1/2 rounded-lg bg-white p-4 shadow-xl"
    >
      <Dialog.Title class="text-sm font-semibold text-zinc-950">{text.searchTitle}</Dialog.Title>
      <input
        bind:value={query}
        class="mt-4 w-full rounded-md border border-zinc-200 px-3 py-2 text-base sm:text-sm outline-none ring-brand/20 transition focus:border-brand focus:ring-4"
        placeholder={text.searchPlaceholder}
      />

      {#if query.trim().length === 0}
        <p class="mt-3 text-sm text-zinc-500">{text.searchHint}</p>
      {:else if results.length === 0}
        <p class="mt-3 rounded-md border border-zinc-200 px-3 py-3 text-sm text-zinc-500">
          {text.searchNoResults}
        </p>
      {:else}
        <div class="mt-3 grid max-h-90 gap-1 overflow-y-auto">
          {#each results as result}
            <a
              class="rounded-md px-3 py-2 transition hover:bg-zinc-50"
              href={result.href}
              onclick={() => {
                open = false;
                query = '';
                onSelect?.();
              }}
            >
              <span class="block text-sm font-medium text-zinc-950">{result.title}</span>
              {#if result.description}
                <span class="mt-1 block text-sm text-zinc-500">{result.description}</span>
              {/if}
            </a>
          {/each}
        </div>
      {/if}
    </Dialog.Content>
  </Dialog.Portal>
</Dialog.Root>

<style>
  /* 
    1. 使用 scrollbar-gutter: stable 在 HTML 层面预留滚动条位置。
       这样无论滚动条是否显示，内容区域都不会发生水平跳动。
    2. 强制隐藏水平溢出 (overflow-x: hidden)，防止移动端弹窗锁定逻辑误加 padding 导致的“右侧白边”或多余滚动条。
    3. 针对输入框 16px 的调整（text-base）可以防止 iOS 自动放大页面。
  */
  :global(html, body) {
    scrollbar-gutter: stable;
    overflow-x: hidden;
    /* 确保 body 宽度不会因为缩放或锁定逻辑超过屏幕 */
    max-width: 100%;
  }
</style>
