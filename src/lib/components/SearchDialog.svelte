<script lang="ts">
  import { Dialog } from 'bits-ui';
  import { getLocaleConfig, type Locale } from '$lib/config/locales';
  import type { SearchEntry } from '$lib/types';
  import { Search } from '@lucide/svelte';

  let open = $state(false);
  let query = $state('');
  let results = $state<SearchEntry[]>([]);
  let isLoading = $state(false);

  let { locale, onSelect }: { locale: Locale; onSelect?: () => void } = $props();
  const text = $derived(getLocaleConfig(locale));

  // 辅助函数：如果标题看起来像 slug (含横杠且无空格)，则进行美化处理
  function formatTitle(title: string) {
    if (!title) return '';
    // 如果标题包含中文字符，或者已经包含空格，或者不包含横杠，说明它已经是处理过的标题
    const hasChinese = /[\u4e00-\u9fa5]/.test(title);
    if (hasChinese || title.includes(' ') || !title.includes('-')) return title;
    
    return title.replace(/-/g, ' ')
                .replace(/\b\w/g, (l) => l.toUpperCase());
  }

  // 使用 $effect 处理异步搜索和防抖
  $effect(() => {
    const q = query.trim();
    if (q.length < 1) {
      results = [];
      return;
    }

    const controller = new AbortController();
    const timer = setTimeout(async () => {
      isLoading = true;
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(q)}&lang=${locale}`, {
          signal: controller.signal
        });
        if (res.ok) {
          results = await res.json();
        }
      } catch (e: any) {
        if (e.name !== 'AbortError') console.error('Search error:', e);
      } finally {
        isLoading = false;
      }
    }, 300); // 300ms 防抖，避免频繁请求

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  });
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
      {:else if results.length === 0 && !isLoading}
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
              <span class="block text-sm font-medium text-zinc-950">{formatTitle(result.title)}</span>
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
