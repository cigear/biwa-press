import tailwindcss from '@tailwindcss/vite';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [tailwindcss(), sveltekit()],
  server: {
    fs: {
      allow: ['.', './docs']
    }
  },
  build: {
    // 移除 manualChunks。
    // 之前的配置强行将 node_modules 聚合，导致分片过大（1MB+）。
    // 移除后，Vite 会根据引用关系自动进行更优的拆分。
    chunkSizeWarningLimit: 1000
  },
  ssr: {
    // 这会告诉 Vite 不要将 lucide-svelte 视为外部 CommonJS 依赖
    // 而是像处理源代码一样处理它，从而解决 SSR 下的命名导出解析问题
    noExternal: ['@lucide/svelte', 'lucide-svelte']
  }
});
