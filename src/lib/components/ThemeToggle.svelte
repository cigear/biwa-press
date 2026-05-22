<script lang="ts">
  import { onMount } from 'svelte';
  import { Sun, Moon } from '@lucide/svelte';
  import { t } from 'svelte-i18n';

  let isDark = $state(false);

  onMount(() => {
    isDark = document.documentElement.classList.contains('dark');
  });

  function toggleTheme() {
    isDark = !isDark;
    if (isDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }
</script>

<button
  onclick={toggleTheme}
  class="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-background text-muted-foreground transition-all hover:bg-secondary hover:text-foreground dark:bg-foreground dark:text-background dark:border-transparent dark:hover:opacity-90"
  title={isDark ? $t('themeLight') : $t('themeDark')}
  aria-label="Toggle theme"
>
  {#if isDark}
    <Sun size={18} strokeWidth={2} />
  {:else}
    <Moon size={18} strokeWidth={2} />
  {/if}
</button>