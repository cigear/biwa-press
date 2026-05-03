import adapter from '@sveltejs/adapter-static';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';
import { mdsvex } from 'mdsvex';
import mdsvexConfig from './mdsvex.config.js';

/** @type {import('@sveltejs/kit').Config} */
const config = {
  extensions: ['.svelte', '.svx', '.md'],

  preprocess: [
    vitePreprocess(),
    mdsvex(mdsvexConfig) // ← 正确加载 mdsvex + remark toc 插件
  ],

  kit: {
    adapter: adapter({
      pages: 'build',
      assets: 'build',
      fallback: undefined,
      precompress: true,
      strict: true
    }),

    prerender: {
      entries: ['*']
    }
  }
};

export default config;
