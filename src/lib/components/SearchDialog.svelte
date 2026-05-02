<script lang="ts">
  import { Dialog } from 'bits-ui';
  import { getLocaleConfig, type Locale } from '$lib/config/locales';
  import { searchDocs } from '$lib/search';

  let open = $state(false);
  let query = $state('');
  let { locale }: { locale: Locale } = $props();
  const text = $derived(getLocaleConfig(locale));
  const results = $derived(searchDocs(locale, query));
</script>

<Dialog.Root bind:open>
  <Dialog.Trigger
    class="rounded-md border border-zinc-200 px-3 py-1.5 text-sm text-zinc-600 transition hover:bg-zinc-50 hover:text-zinc-950"
  >
    {text.search}
  </Dialog.Trigger>

  <Dialog.Portal>
    <Dialog.Overlay class="fixed inset-0 z-40 bg-black/40" />
    <Dialog.Content
      class="fixed left-1/2 top-24 z-50 w-[min(640px,calc(100vw-2rem))] -translate-x-1/2 rounded-lg bg-white p-4 shadow-xl"
    >
      <Dialog.Title class="text-sm font-semibold text-zinc-950">{text.searchTitle}</Dialog.Title>
      <input
        bind:value={query}
        class="mt-4 w-full rounded-md border border-zinc-200 px-3 py-2 text-sm outline-none ring-brand/20 transition focus:border-brand focus:ring-4"
        placeholder={text.searchPlaceholder}
      />

      {#if query.trim().length === 0}
        <p class="mt-3 text-sm text-zinc-500">{text.searchHint}</p>
      {:else if results.length === 0}
        <p class="mt-3 rounded-md border border-zinc-200 px-3 py-3 text-sm text-zinc-500">
          {text.searchNoResults}
        </p>
      {:else}
        <div class="mt-3 grid max-h-[360px] gap-1 overflow-y-auto">
          {#each results as result}
            <a
              class="rounded-md px-3 py-2 transition hover:bg-zinc-50"
              href={result.href}
              onclick={() => {
                open = false;
                query = '';
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
