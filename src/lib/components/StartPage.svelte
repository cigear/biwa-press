<script lang="ts">
  let { contentHtml } = $props<{ contentHtml: string }>();
</script>

<main class="mx-auto w-full max-w-5xl flex-1 px-1 pt-6 pb-24 doc-content prose prose-zinc">
  {@html contentHtml}
</main>