<script module lang="ts">
  export type TocItem = {
    depth: number;
    text?: string;
    title?: string;
    value?: string;
    slug: string;
  };
</script>

<script lang="ts">
  import { onDestroy } from 'svelte';

  const props = $props<{
    items: TocItem[];
    minDepth: number;
    maxDepth: number;
  }>();

  const minDepth = $derived(props.minDepth ?? 2);
  const maxDepth = $derived(props.maxDepth ?? 3);

  let activeSlug = $state<string | null>(null);
  let observer: IntersectionObserver | null = null;

  const items = $derived(props.items ?? []);
  const filtered = $derived(
    items.filter((h: TocItem) => h.depth >= minDepth && h.depth <= maxDepth)
  );

  function handleClick(slug: string) {
    const el = document.getElementById(slug);
    if (!el) return;
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    activeSlug = slug;
  }

  // 当过滤后的列表改变时（通常是由于页面切换），重新初始化观察器
  $effect(() => {
    if (typeof window === 'undefined') return;
    if (observer) observer.disconnect();

    const headings = filtered
      .map((h: TocItem) => document.getElementById(h.slug)) // h 已经正确类型化
      .filter((el: HTMLElement | null): el is HTMLElement => !!el); // 明确指定 el 的类型

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

    headings.forEach((el: HTMLElement) => observer!.observe(el));

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
            {item.text ?? item.title ?? item.value ?? 'Untitled'}
          </button>
        </li>
      {/each}
    </ul>
  </nav>
{/if}

<style>
  .biwa-toc {
    position: sticky;
    top: 100px; /* Header(56px) + Breadcrumb(~36px) + 间隙 */
    max-height: calc(100vh - 100px);
    overflow: hidden auto;
    scrollbar-width: thin;
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
    margin: 0 0 0 2px;
    border-left: 1px solid #e5e7eb; /* 轨道线 (zinc-200) */
  }

  .biwa-toc__item {
    margin: 0;
    position: relative;
  }

  .biwa-toc__item button {
    background: none;
    border: none;
    font: inherit;
    color: inherit;
    text-align: left;
    box-sizing: border-box;
    cursor: pointer;
    display: block;
    padding: 0.4rem 1rem;
    border-radius: 0.25rem;
    width: 100%;
    overflow-wrap: break-word;
    transition: background-color 0.15s, color 0.15s;
  }

  .biwa-toc__item.depth-3 button {
    padding-left: 2rem;
    font-size: 0.9em;
  }

  .biwa-toc__item button:hover {
    color: #111827;
    background-color: #f3f4f6;
  }

  /* 当前位置的粗线指示器 */
  .biwa-toc__item.is-active::before {
    content: "";
    position: absolute;
    left: -1px; /* 覆盖在 1px 的轨道线上 */
    top: 0;
    bottom: 0;
    width: 2px; /* 粗线宽度 */
    background-color: #111827; /* 改为黑色 */
    z-index: 1;
  }

  .biwa-toc__item.is-active button {
    color: #111827; /* 改为黑色 */
    font-weight: 600;
    background-color: transparent; /* 移除背景色，突出左侧竖线 */
  }
</style>
