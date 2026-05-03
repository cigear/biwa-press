<script module lang="ts">
  export type TocItem = {
    depth: number;
    title: string;
    slug: string;
  };
</script>

<script lang="ts">
  import { onMount, onDestroy } from 'svelte';

  const props = $props<{
    items: TocItem[];
    minDepth: number;
    maxDepth: number;
  }>();

  let items = $state<TocItem[]>([]);

  $effect(() => {
    items = props.items ?? [];
  });

  const minDepth = $derived(props.minDepth ?? 2);
  const maxDepth = $derived(props.maxDepth ?? 3);

  let activeSlug = $state<string | null>(null);

  let observer: IntersectionObserver | null = null;

  const filtered = $derived(
    items.filter((h) => h.depth >= minDepth && h.depth <= maxDepth)
  );

  function handleClick(slug: string) {
    const el = document.getElementById(slug);
    if (!el) return;
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    activeSlug = slug;
  }

  onMount(() => {
    const headings = filtered
      .map((h) => document.getElementById(h.slug))
      .filter((el): el is HTMLElement => !!el);

    if (!headings.length) return;

    observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort(
            (a, b) =>
              (a.target as HTMLElement).offsetTop -
              (b.target as HTMLElement).offsetTop
          );

        if (visible[0]) {
          activeSlug = visible[0].target.id;
        }
      },
      {
        root: null,
        rootMargin: '0px 0px -60% 0px',
        threshold: 0.1
      }
    );

    headings.forEach((el) => observer!.observe(el));

    return () => observer?.disconnect();
  });

  onDestroy(() => {
    observer?.disconnect();
  });
</script>

{#if filtered.length}
  <nav class="biwa-toc">
    <div class="biwa-toc__title">On this page</div>

    <ul class="biwa-toc__list">
      {#each filtered as item}
        <li
          class={`biwa-toc__item depth-${item.depth} ${
            activeSlug === item.slug ? 'is-active' : ''
          }`}
        >
          <button type="button" onclick={() => handleClick(item.slug)}>
            {item.title}
          </button>
        </li>
      {/each}
    </ul>
  </nav>
{/if}

<style>
  .biwa-toc {
    position: sticky;
    top: 80px;
    max-height: calc(100vh - 80px);
    overflow-y: auto;
    padding-left: 0.5rem;
    font-size: 0.875rem;
    color: #6b7280;
  }

  .biwa-toc__title {
    font-weight: 600;
    margin-bottom: 0.75rem;
    color: #374151;
  }

  .biwa-toc__list {
    list-style: none;
    padding: 0;
    margin: 0;
  }

  .biwa-toc__item {
    margin: 0.125rem 0;
  }

  .biwa-toc__item button {
    all: unset;
    cursor: pointer;
    display: block;
    padding: 0.125rem 0.25rem;
    border-radius: 0.25rem;
    transition: background-color 0.15s, color 0.15s;
  }

  .biwa-toc__item.depth-2 button {
    padding-left: 0;
  }

  .biwa-toc__item.depth-3 button {
    padding-left: 0.75rem;
    font-size: 0.8em;
  }

  .biwa-toc__item button:hover {
    background-color: rgba(148, 163, 184, 0.12);
  }

  .biwa-toc__item.is-active button {
    color: #2563eb;
    background-color: rgba(37, 99, 235, 0.08);
  }
</style>
