import tailwindcss from '@tailwindcss/vite';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import serveStatic from 'serve-static';
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

export default defineConfig({
  plugins: [
    tailwindcss(), 
    sveltekit(),
    {
      name: 'serve-root-assets',
      // 开发和构建启动钩子
      buildStart() {
        const assets = ['images', 'videos', 'audios'];
        // 确保 static 目录存在
        if (!fs.existsSync('static')) {
          fs.mkdirSync('static', { recursive: true });
        }

        for (const asset of assets) {
          const srcPath = path.resolve(asset);
          const destPath = path.resolve('static', asset);
          
          // 如果根目录存在该文件夹，且 static 下还没有建立链接
          if (fs.existsSync(srcPath) && !fs.existsSync(destPath)) {
            // 在 Windows 上使用 'junction' 类型创建目录链接，无需管理员权限
            const type = process.platform === 'win32' ? 'junction' : 'dir';
            fs.symlinkSync(srcPath, destPath, type);
            console.log(`[Biwa Press] Linked ${srcPath} to ${destPath}`);
          }
        }
      },
      configureServer(server) {
        ['images', 'videos', 'audios'].forEach(dir => {
          server.middlewares.use(`/${dir}`, serveStatic(`./${dir}`));
        });
      }
    }
  ],
  server: {
    fs: {
      allow: ['.', './docs', './images', './videos', './audios']
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
