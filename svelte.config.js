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
          
          // 显式预渲染搜索索引 JSON
          // 遍历所有语言，为每种语言的搜索索引 API 添加预渲染条目
          const locales = fs.readdirSync(docsPath).filter(f => fs.statSync(path.join(docsPath, f)).isDirectory());
          locales.forEach(l => entries.push(`/api/search-index/${l}.json`));

          const walk = (dir) => {
            fs.readdirSync(dir).forEach(file => {
              const fullPath = path.join(dir, file);
              const stat = fs.statSync(fullPath);
              if (stat.isDirectory()) {
                walk(fullPath);
              } else if (file.endsWith('.md') || file.endsWith('.svx')) {
                const relative = path.relative(docsPath, fullPath).replace(/\\/g, '/');
                const [locale, ...slugParts] = relative.replace(/\.(md|svx)$/, '').split('/');
                
                // 规范化 slug，移除末尾的 /index
                let slug = slugParts.join('/');
                if (slug.endsWith('/index')) slug = slug.replace(/\/index$/, '');
                if (slug === 'index') slug = '';
                
                entries.push(`/${locale}/docs/${slug}`);
              }
            });
          };
          walk(docsPath);
          return [...new Set(entries)]; // 去重
        })()
      ],
      handleUnseenRoutes: 'warn'
    }
  }
};

export default config;
