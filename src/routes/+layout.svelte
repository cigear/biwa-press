<script lang="ts">
  import '../app.css';
  import '../lib/i18n';
  import { page } from '$app/stores';

  let { children } = $props();

  $effect(() => {
    const locale = $page.params.locale || 'en';
    document.documentElement.lang = locale;
  });
  
</script>

{@render children()}
