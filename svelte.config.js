import adapterStatic from '@sveltejs/adapter-static';
import adapterNode from '@sveltejs/adapter-node';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';
import { mdsvex } from 'mdsvex';
import mdsvexConfig from './mdsvex.config.js';
import fs from 'node:fs';
import path from 'node:path';

const mode = process.env.BIWA_RENDER_MODE || 'ssg';
const outDir = process.env.BIWA_OUT_DIR || 'build';

/** @type {import('@sveltejs/kit').Config} */
const config = {
  extensions: ['.svelte', '.svx', '.md'],

  preprocess: [
    vitePreprocess(),
    mdsvex(mdsvexConfig) // ← 正确加载 mdsvex + remark toc 插件
  ],

  kit: {
    // 根据 BIWA_RENDER_MODE 动态切换适配器
    adapter: mode === 'ssr'
      ? adapterNode({ out: outDir })
      : adapterStatic({
          pages: outDir,
          assets: outDir,
          // 在 SSG/CSR 模式下，建议设置 fallback 以支持非预渲染路径或直接访问动态路由
          fallback: mode === 'ssr' ? undefined : '404.html',
          precompress: true,
          strict: true
        }),

    prerender: {
      entries: [
        '*', 
        ...(() => {
          const docsPath = path.resolve('docs');
          if (!fs.existsSync(docsPath)) return [];
          const entries = [];
          const walk = (dir) => {
            fs.readdirSync(dir).forEach(file => {
              const fullPath = path.join(dir, file);
              if (fs.statSync(fullPath).isDirectory()) {
                walk(fullPath);
              } else if (file.endsWith('.md') || file.endsWith('.svx')) {
                const relative = path.relative(docsPath, fullPath).replace(/\\/g, '/');
                const [locale, ...slugParts] = relative.replace(/\.(md|svx)$/, '').split('/');
                entries.push(`/${locale}/docs/${slugParts.join('/')}`);
              }
            });
          };
          walk(docsPath);
          return entries;
        })()
      ],
      handleUnseenRoutes: 'warn'
    }
  }
};

export default config;
