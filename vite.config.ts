import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [sveltekit()],
  server: {
    fs: {
      allow: ['.', './docs']
    }
  },
  ssr: {
    // 这会告诉 Vite 不要将 lucide-svelte 视为外部 CommonJS 依赖
    // 而是像处理源代码一样处理它，从而解决 SSR 下的命名导出解析问题
    noExternal: ['@lucide/svelte', 'lucide-svelte']
  },
  define: {
    __VUE_OPTIONS_API__: 'true',
    __VUE_PROD_DEVTOOLS__: 'false',
    __VUE_PROD_HYDRATION_MISMATCH_DETAILS__: 'false'
  }
});
