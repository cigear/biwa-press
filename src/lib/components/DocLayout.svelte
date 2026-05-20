<script lang="ts">
  import { page } from "$app/state";
  import type { Locale } from "$lib/config/locales";
  import type { Group } from "$lib/docs";
  import Header from "./Header.svelte";
  import Sidebar from "./Sidebar.svelte";
  import Footer from "./Footer.svelte";
  import Breadcrumb from "./Breadcrumb.svelte";
  import DocToc from "./DocToc.svelte";
  import { ChevronRight, ChevronLeft } from "@lucide/svelte";
  import { t, locale as i18nLocale } from "svelte-i18n";

  let {
    locale,
    metadata,
    children,
    toc = [],
    groups: initialGroups = [],
    currentPath, // 添加 currentPath 属性
    slug, // 添加 slug 属性
  }: {
    locale: Locale;
    metadata: Record<string, any>;
    children: import("svelte").Snippet;
    toc?: { depth: number; text: string; slug: string }[];
    groups?: Group[];
    currentPath: string; // 类型定义
    slug?: string; // 类型定义，可以是 undefined
  } = $props();

  // 关键：当 locale 属性改变时，同步更新 svelte-i18n 的全局状态
  $effect(() => {
    if (locale) i18nLocale.set(locale);
  });

  let fetchedGroups = $state<Group[] | null>(null);
  let groups = $derived(fetchedGroups ?? initialGroups);

  // 检查是否有任何元数据需要显示在页眉中，防止出现空白区域
  const hasMetadataHeader = $derived(
    !!(
      metadata &&
      (metadata.description ||
        metadata.published ||
        metadata.updated ||
        (Array.isArray(metadata.tags) && metadata.tags.length > 0))
    ),
  );

  // 计算文档的上一页和下一页导航
  const pagination = $derived.by(() => {
    // 使用传入的 currentPath 属性
    const flat: { title: string; href: string }[] = [];

    function flatten(items: Group[]) {
      for (const item of items) {
        if (item.slug) {
          flat.push({
            title: item.title,
            href: `/${locale}/docs/${item.slug}`,
          });
        }
        if (item.items) flatten(item.items);
      }
    }

    flatten(groups);
    const index = flat.findIndex((i) => i.href === currentPath); // 使用传入的 currentPath
    return {
      prev: index > 0 ? flat[index - 1] : null,
      next: index !== -1 && index < flat.length - 1 ? flat[index + 1] : null,
    };
  });

  // 自动为代码块添加复制按钮
  $effect(() => {
    // 依赖页面路径，确保切换页面时重新扫描
    const path = page.url.pathname;
    const pres = document.querySelectorAll(".doc-content pre");

    pres.forEach((pre) => {
      if (pre.querySelector(".copy-btn")) return;

      const btn = document.createElement("button");
      btn.className = "copy-btn";
      btn.title = "Copy code";
      // 使用 Lucide 风格的 SVG 图标
      btn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>`;

      btn.onclick = async (e) => {
        e.preventDefault();
        // 提取代码：优先寻找 code 标签，否则取 pre 内容
        const codeElement = pre.querySelector("code");
        const code = codeElement ? codeElement.textContent : pre.textContent;

        if (!code) return;

        try {
          // 优先使用现代 API
          if (navigator.clipboard && window.isSecureContext) {
            await navigator.clipboard.writeText(code);
          } else {
            // Fallback: Using document.execCommand for non-secure contexts
            // Although deprecated, it remains the only programmatic way to copy in HTTP environments.
            const textArea = document.createElement("textarea");
            textArea.value = code;
            // Ensure the textarea is not visible and doesn't cause layout shifts
            textArea.style.position = "fixed";
            textArea.style.left = "-9999px";
            textArea.style.top = "0";
            document.body.appendChild(textArea);
            textArea.focus();
            textArea.select();
            document.execCommand("copy");
            document.body.removeChild(textArea);
          }

          btn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`;
          btn.classList.add("text-green-500");
          setTimeout(() => {
            btn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>`;
            btn.classList.remove("text-green-500");
          }, 2000);
        } catch (err) {
          console.error("Failed to copy!", err);
        }
      };

      // 将按钮插入到 pre 的最前面，配合 Grid 布局实现右上角悬浮
      pre.prepend(btn);
    });
  });

  let mermaidInitialized = false;

  // 渲染 Mermaid 图表
  $effect(() => {
    // 依赖页面路径变化
    const path = page.url.pathname;

    // 查找所有的 mermaid 代码块
    // mdsvex 通常生成的结构是 pre.language-mermaid > code.language-mermaid
    const mermaidBlocks = document.querySelectorAll(
      "pre code.language-mermaid",
    );

    if (mermaidBlocks.length > 0) {
      import("mermaid").then((m) => {
        const mermaid = m.default || m;
        if (!mermaidInitialized) {
          mermaid.initialize({
            startOnLoad: false,
            theme: "default",
            fontFamily: "var(--font-base)",
            securityLevel: "loose",
          });
          mermaidInitialized = true;
        }

        mermaidBlocks.forEach((block) => {
          const pre = block.parentElement;
          if (pre) {
            pre.classList.add("mermaid");
            // 将原始代码内容提取到 pre 标签中，这是 mermaid.run 期待的结构
            pre.textContent = block.textContent;
            // 移除复原按钮（如果有）
            pre.querySelector(".copy-btn")?.remove();
          }
        });

        mermaid.run({
          querySelector: ".mermaid",
        });
      });
    }
  });
</script>

<Header {locale} {groups} {currentPath} />

<div
  class="mx-auto grid min-h-[calc(100vh-3.5rem)] max-w-7xl grid-cols-1 px-4 lg:grid-cols-[260px_1fr_200px] lg:gap-10"
>
  <Sidebar {locale} sidebar={groups} {currentPath} />

  <div class="flex flex-col min-w-0">
    <Breadcrumb {locale} {groups} {currentPath} />

    <main class="doc-content flex-1 pb-10 pt-4 lg:pb-12 lg:pt-6">
      {#if hasMetadataHeader}
        <header class="mb-10 flex flex-col gap-4">
          {#if metadata.description}
            <div class="text-3xl font-extrabold text-zinc-900 md:text-4xl">
              {metadata.description}
            </div>
          {/if}

          {#if metadata.published || metadata.updated}
            <div class="flex flex-wrap gap-x-4 gap-y-1 text-xs text-zinc-500 md:text-sm">
              {#if metadata.published}
                <div class="flex items-center">
                  <span class="font-semibold"
                    >{$t("published", { default: "Published Date" })}:</span
                  >
                  <span class="ml-1">{metadata.published}</span>
                </div>
              {/if}

              {#if metadata.updated}
                <div class="flex items-center">
                  <span class="font-semibold"
                    >{$t("updated", { default: "Updated Date" })}:</span
                  >
                  <span class="ml-1">{metadata.updated}</span>
                </div>
              {/if}
            </div>
          {/if}

          {#if metadata.tags && Array.isArray(metadata.tags) && metadata.tags.length > 0}
            <div class="flex flex-wrap gap-2">
              <span class="mr-1 self-center text-xs text-zinc-400"
                >{$t("tags", { default: "Tags" })}:</span
              >
              {#each metadata.tags as tag}
                <span
                  class="inline-flex items-center rounded-md border border-zinc-200 bg-zinc-100 px-2.5 py-0.5 text-xs font-medium text-zinc-800"
                >
                  {tag}
                </span>
              {/each}
            </div>
          {/if}
        </header>
      {/if}

      {@render children()}

      <!-- 底部翻页导航 -->
      <nav
        class="mt-16 flex items-start justify-between gap-4 border-t border-zinc-100 pt-8"
      >
        {#if pagination.prev}
          <a
            href={pagination.prev.href}
            class="group flex flex-1 flex-col gap-1 min-w-0 transition-colors"
          >
            <span class="text-xs font-medium text-zinc-400"
              >{$t("previous", { default: "Previous" })}</span
            >
            <span
              class="flex items-center gap-1 text-base font-semibold text-zinc-600 transition-colors group-hover:text-zinc-950"
            >
              <ChevronLeft
                size={18}
                class="shrink-0 transition-transform group-hover:-translate-x-1"
              />
              {pagination.prev.title}
            </span>
          </a>
        {/if}

        {#if pagination.next}
          <a
            href={pagination.next.href}
            class="group flex flex-1 flex-col items-end gap-1 min-w-0 transition-colors ms-auto"
          >
            <span class="text-xs font-medium text-zinc-400"
              >{$t("next", { default: "Next" })}</span
            >
            <span
              class="flex items-center gap-1 text-base font-semibold text-zinc-600 transition-colors group-hover:text-zinc-950"
            >
              {pagination.next.title}
              <ChevronRight
                size={18}
                class="shrink-0 transition-transform group-hover:translate-x-1"
              />
            </span>
          </a>
        {/if}
      </nav>
    </main>
  </div>

  <aside class="lg:block">
    <DocToc items={toc} minDepth={2} maxDepth={3} />
  </aside>
</div>

<Footer />
