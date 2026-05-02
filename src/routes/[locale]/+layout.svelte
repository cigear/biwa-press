<script lang="ts">
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  import { locale } from 'svelte-i18n';
  import { page } from '$app/stores';

  let { children } = $props();

  // Make the usage more explicit for TypeScript
  const setLocale = locale.set;

</script>

{@render children()}