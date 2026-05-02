<script lang="ts">
  import type { Locale } from '$lib/config/locales';
  import { getSidebar } from '$lib/config/sidebar';
  import { t } from 'svelte-i18n';
  
  let { locale }: { locale: Locale } = $props();
  const sidebar = $derived(getSidebar(locale));
  
</script>

<aside class="hidden border-r border-zinc-200 py-8 pr-8 lg:block">
  {#each sidebar as group}
    <section class="mb-8">
      <h2 class="mb-3 text-sm font-semibold text-zinc-950">{$t(group.title)}</h2>
      <div class="grid gap-2">
        {#each group.items as item}
          <a class="text-sm text-zinc-600 transition hover:text-zinc-950" href={item.href}>
            {$t(item.title)}
          </a>
        {/each}
      </div>
    </section>
  {/each}
</aside>
