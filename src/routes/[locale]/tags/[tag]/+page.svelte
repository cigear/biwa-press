<script lang="ts">
  import Header from "$lib/components/Header.svelte";
  import Sidebar from "$lib/components/Sidebar.svelte";
  import Footer from "$lib/components/Footer.svelte";
  import { t } from "svelte-i18n";
  import type { Locale } from "$lib/config/locales";
  import type { PageData } from "./$types"; // 导入 PageData 类型

  let { data }: { data: PageData } = $props(); // 明确指定 data 的类型
</script>

<Header locale={data.locale as Locale} groups={data.sidebar ?? []} currentPath={data.path} />

<div class="mx-auto grid min-h-[calc(100vh-3.5rem)] max-w-7xl grid-cols-1 px-4 lg:grid-cols-[260px_1fr] lg:gap-10 bg-background text-foreground">
  <Sidebar locale={data.locale as Locale} sidebar={data.sidebar ?? []} currentPath={data.path} />

  <main class="flex-1 pb-10 pt-4 lg:pb-12 lg:pt-6 min-w-0">
    <div class="mb-10 border-b border-border pb-8">
      <h1 class="text-3xl font-extrabold text-foreground md:text-4xl">
        {$t("tags", { default: "Tag" })}: {data.tag}
      </h1>
      <p class="mt-2 text-sm text-muted-foreground">
        {$t("articlesFound", { values: { count: data.docs.length } })}
      </p>
    </div>

    {#if data.docs.length > 0}
      <div class="space-y-10">
        {#each data.docs as doc}
          <article class="group relative flex flex-col items-start">
            <h2 class="text-xl font-bold text-foreground transition-colors">
              <a href="/{data.locale}/docs/{doc.slug}">
                <!-- 仿 Tailwind UI 的交互背景效果 -->
                <span class="absolute -inset-x-4 -inset-y-6 z-0 scale-95 bg-secondary opacity-0 transition group-hover:scale-100 group-hover:opacity-100 sm:-inset-x-6 sm:rounded-2xl"></span>
                <span class="relative z-10">{doc.title}</span>
              </a>
            </h2>

            <div class="relative z-10 mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
              {#if doc.published}
                <span>{$t("published", { default: "Published" })}: {doc.published}</span>
              {/if}
              {#if doc.updated}
                <span>{$t("updated", { default: "Updated" })}: {doc.updated}</span>
              {/if}
            </div>

            {#if doc.description}
              <p class="relative z-10 mt-2 text-sm text-muted-foreground line-clamp-2">
                {doc.description}
              </p>
            {/if}
          </article>
        {/each}
      </div>
    {:else}
      <div class="rounded-lg border border-dashed border-border p-12 text-center">
        <p class="text-muted-foreground">No articles found with this tag.</p>
      </div>
    {/if}
  </main>
</div>

<Footer />