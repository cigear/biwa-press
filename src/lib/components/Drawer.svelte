<script lang="ts">
  import { site } from "$lib/config/site";
  import type { Locale } from "$lib/config/locales";
  import type { Group } from "$lib/docs";
  import { ChevronRight } from "@lucide/svelte";
  import { fly, fade } from "svelte/transition";
  import { page } from "$app/state";

  let { 
    open = $bindable(false), 
    locale, 
    groups,
    currentPath // Add currentPath to props
  }: { 
    open: boolean; 
    locale: Locale; 
    groups: Group[]; 
    currentPath: string; // Add type definition
  } = $props();

  // currentPath is now passed as a prop, no longer derived internally

  // 追踪侧边栏分组展开状态
  let expandedGroups = $state<Record<string, boolean>>({});

  function handleGroupClick(item: Group) {
    expandedGroups[item.title] = !expandedGroups[item.title];
  }

  // 自动展开包含当前激活页面的分组
  $effect(() => {
    const path = currentPath;
    if (groups.length === 0) return;

    function checkActive(items: Group[], currentPath: string): boolean { // Add currentPath parameter
      let isActive = false;
      for (const item of items) {
        const href = item.slug ? `/${locale}/docs/${item.slug}` : undefined;
        if (href === path) isActive = true;
        if (item.items && checkActive(item.items, currentPath)) { // Pass currentPath in recursive call
          expandedGroups[item.title] = true;
          isActive = true;
        }
      }
      return isActive;
    }
    checkActive(groups, currentPath); // Pass currentPath to initial call
  });
</script>

{#snippet navItem(item: Group, depth: number)}
  {@const hasChildren = item.items && item.items.length > 0}
  <div class="mb-1">
    <div class="flex items-center justify-between gap-2">
      {#if item.slug}
        {@const href = `/${locale}/docs/${item.slug}`}
        <a
          {href}
          class="flex-1 py-1.5 px-2 -mx-2 text-sm transition-colors rounded-md {currentPath === href
            ? 'font-bold text-foreground bg-secondary' 
            : 'text-muted-foreground hover:text-foreground hover:bg-secondary'}"
          onclick={() => (open = false)}
        >
          {item.title}
        </a>
      {:else if hasChildren}
        <button
          class="flex-1 text-left py-1.5 px-2 -mx-2 text-sm font-bold text-muted-foreground hover:text-foreground hover:bg-secondary rounded-md transition-colors"
          onclick={() => handleGroupClick(item)}
        >
          {item.title}
        </button>
      {:else}
        <h3 class="py-1.5 px-2 -mx-2 text-sm font-bold text-muted-foreground">
          {item.title}
        </h3>
      {/if}

      {#if hasChildren}
        <button
          class="p-1 text-muted-foreground hover:text-foreground transition-colors shrink-0"
          onclick={() => handleGroupClick(item)}
          aria-label="Toggle group"
        >
          <ChevronRight
            size={14}
            class="transition-transform duration-200 {expandedGroups[item.title] ? 'rotate-90' : 'rotate-0'}"
          />
        </button>
      {/if}
    </div>

    {#if hasChildren && expandedGroups[item.title]}
      <div class="mt-1 border-l border-border ml-2 pl-4">
        {#each item.items as subItem}
          {@render navItem(subItem, depth + 1)}
        {/each}
      </div>
    {/if}
  </div>
{/snippet}

{#if open}
  <div class="fixed inset-0 z-50 lg:hidden">
    <button 
      transition:fade={{ duration: 200 }}
      class="fixed inset-0 bg-zinc-950/40 cursor-default" 
      onclick={() => (open = false)}
      aria-label="Close menu"
    ></button>
    <div 
      transition:fly={{ x: -300, duration: 300, opacity: 1 }}
      class="fixed left-0 top-0 h-full w-72 border-r border-border bg-background p-6 shadow-2xl overflow-y-auto"
    >
      <div class="flex items-center justify-between mb-4">
        <span class="text-sm font-bold text-foreground">{site.title}</span>
        <button
          class="flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          onclick={() => (open = false)}
          aria-label="Close menu"
        >
          <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {#each groups as group}
        {@render navItem(group, 0)}
      {/each}
    </div>
  </div>
{/if}