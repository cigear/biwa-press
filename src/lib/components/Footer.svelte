<script lang="ts">
  const year = new Date().getFullYear();
</script>

<footer class="border-t border-border py-8 text-sm text-muted-foreground">
  <div class="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 px-4 sm:flex-row">
    <div class="flex flex-col items-center gap-2 sm:flex-row sm:gap-4">
      <span>&copy; {year} Biwa Press. All rights reserved.</span>
      <span class="text-zinc-400">Version 0.1.0</span>
    </div>
    <span>Powered by <a href="https://github.com/biwa-press" class="font-medium text-foreground hover:underline">Biwa Press</a></span>
  </div>
</footer>