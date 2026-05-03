<script lang="ts">
  import type { Component } from 'svelte';
  import type { Locale } from '$lib/config/locales';
  import DocLayout from '$lib/components/DocLayout.svelte';

  let {
    data
  }: {
    data: {
      locale: Locale;
      component: Component;
      metadata: Record<string, any>;
      toc: any[];
    };
  } = $props();

  const Content = $derived(data.component);
</script>

<DocLayout
  locale={data.locale}
  metadata={data.metadata}
  toc={data.toc}
>
  <Content />
</DocLayout>
