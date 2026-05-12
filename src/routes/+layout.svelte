<script lang="ts">
  import '../app.css';
  import '../lib/i18n'; // 确保初始化逻辑执行
  import { locale, waitLocale } from 'svelte-i18n';

  let { children } = $props();

  // Svelte 5: 使用 $effect 监听 locale 变化并同步更新 HTML 的 lang 属性
  // 这能确保 app.css 中的 html:lang(zh) 和 html:lang(ja) 选择器生效
  $effect(() => {
    document.documentElement.lang = $locale || 'en';
  });
</script>

{#await waitLocale()}
  <div class="fixed inset-0 bg-white"></div>
{:then}
  {@render children()}
{/await}
