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
  const props = $props<{
    items: TocItem[];
    minDepth: number;
    maxDepth: number;
  }>();

  const minDepth = $derived(props.minDepth ?? 2);
  const maxDepth = $derived(props.maxDepth ?? 3);

  let activeSlug = $state<string | null>(null);

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

    const elements: HTMLElement[] = filtered
      .map((h: TocItem) => document.getElementById(h.slug))
      .filter((el: HTMLElement | null): el is HTMLElement => !!el)
      // 确保按页面物理顺序排序，这是“一步步点亮”的基础
      .sort((a: HTMLElement, b: HTMLElement) => a.offsetTop - b.offsetTop);

    if (elements.length === 0) return;

    let lastScrollTop = window.scrollY;
    let touchStartY = 0;
    let lastStepTime = 0;
    const STEP_COOLDOWN = 150; // 步进冷却时间，防止滚动过快瞬间跳过多个项目
    let ticking = false;
    let observer: IntersectionObserver; // 在这里声明 observer

    // 手动步进函数：用于处理边界情况（触底/顶）
    const manualStep = (direction: 1 | -1) => {
      const now = Date.now();
      if (now - lastStepTime < STEP_COOLDOWN) return;

      const currentIdx = elements.findIndex(el => el.id === activeSlug);
      const newIdx = Math.max(0, Math.min(elements.length - 1, currentIdx + direction));

      if (newIdx !== currentIdx) {
        activeSlug = elements[newIdx].id;
        lastStepTime = now;
      }
    };

    const updateActive = () => {
      const scrollTop = window.scrollY;
      const scrollHeight = document.documentElement.scrollHeight;
      const clientHeight = window.innerHeight;
      const isAtBottom = scrollTop + clientHeight >= scrollHeight - 10;

      const triggerLine = 135; // 基础触发线 (Header + Breadcrumb)

      // 1. 极顶保护
      if (scrollTop < 10) {
        activeSlug = elements[0].id;
        return;
      }

      // 2. 物理扫描：寻找最后一个“越过”触发线的标题
      let bestIdx = 0;
      for (let i = 0; i < elements.length; i++) {
        if (elements[i].getBoundingClientRect().top <= triggerLine) {
          bestIdx = i;
        } else {
          break;
        }
      }

      // 3. 状态更新逻辑
      const currentIdx = elements.findIndex(el => el.id === activeSlug);
      
      // 如果不是在底部，或者发现了更靠后的物理标题，则更新
      if (!isAtBottom || bestIdx > currentIdx) {
        activeSlug = elements[bestIdx].id;
      }
      
      lastScrollTop = scrollTop;
    };

    const scrollHandler = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          updateActive();
          ticking = false;
        });
        ticking = true;
      }
    };

    // 捕获鼠标滚轮事件：处理“触底继续滚”的意图
    const wheelHandler = (e: WheelEvent) => {
      const atBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 10;
      const atTop = window.scrollY < 10;
      if (atBottom && e.deltaY > 0) manualStep(1); // 触底向下
      if (atTop && e.deltaY < 0) manualStep(-1);  // 触顶向上
    };

    // 捕获触摸事件：处理移动端手势
    const touchStart = (e: TouchEvent) => { touchStartY = e.touches[0].clientY; };
    const touchMove = (e: TouchEvent) => {
      const currentY = e.touches[0].clientY;
      const deltaY = touchStartY - currentY; // 正值代表手指向上划，页面向下走
      const atBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 10;
      
      if (atBottom && deltaY > 15) {
        manualStep(1);
        touchStartY = currentY; // 连续滑动支持
      }
    };

    window.addEventListener('scroll', scrollHandler, { passive: true });
    window.addEventListener('wheel', wheelHandler, { passive: true });
    window.addEventListener('touchstart', touchStart, { passive: true });
    window.addEventListener('touchmove', touchMove, { passive: true });
    window.addEventListener('hashchange', updateActive);

    observer = new IntersectionObserver(updateActive, {
      rootMargin: '-135px 0px -70% 0px',
      threshold: [0, 1]
    });
    elements.forEach((el: HTMLElement) => observer.observe(el));

    updateActive(); // 确保在观察器设置后立即更新一次状态

    return () => {
      observer.disconnect();
      window.removeEventListener('scroll', scrollHandler);
      window.removeEventListener('wheel', wheelHandler);
      window.removeEventListener('touchstart', touchStart);
      window.removeEventListener('touchmove', touchMove);
      window.removeEventListener('hashchange', updateActive);
    };
  });
</script>

{#if filtered.length}
  <nav class="biwa-toc">
    <div class="biwa-toc__title">On this page</div>

    <ul class="biwa-toc__list">
      {#each filtered as item}
        <li class="biwa-toc__item depth-{item.depth}" class:is-active={activeSlug === item.slug}>
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
    top: 96px; /* 滚动时：固定在面包屑下方 */
    margin-top: 40px; /* 初始位置：确保不顶着 Header，与面包屑底部留出呼吸空间 */
    max-height: calc(100vh - 120px); 
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
