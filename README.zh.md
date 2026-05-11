# Biwa Press (中文)

一个受 VitePress 启发的文档框架起手模板，基于 SvelteKit、Tailwind CSS 4、Bits UI、mdsvex 以及灵活的渲染模式。

## 特性

- ⚡️ **Svelte 5 & SvelteKit**: 现代、响应式且高效。
- 🎨 **Tailwind CSS 4**: 最新的实用优先 CSS 框架。
- 📝 **mdsvex**: 在 Markdown 中直接使用 Svelte 组件。
- 🔍 **内置搜索**: 高效的客户端搜索功能。
- 🌐 **多语言支持**: 内置国际化支持（中、英、日）。
- 🛠️ **灵活渲染**: 完美支持 SSG、SSR 和 CSR 模式。

## 开发环境

```bash
npm install
npm run dev
```

## 构建与部署

Biwa Press 通过环境变量支持多种渲染模式：

### 1. SSG (静态网站生成) - 推荐
在 `build/ssg/` 目录下生成完整的静态文件。非常适合部署在 GitHub Pages、Netlify 或 Vercel。
```bash
npm run build:ssg
npm run preview:ssg
npm run package:ssg
```

### 2. SSR (服务端渲染)
在 `build/ssr/` 目录下构建一个 Node.js 服务端应用。如果你需要动态的服务端逻辑，请使用此模式。
```bash
npm run build:ssr
npm run preview:ssr
npm run package:ssr
```

### 3. CSR (客户端渲染 / SPA)
在 `build/csr/` 目录下生成一个带有 `index.html` 回退机制的单页应用。
```bash
npm run build:csr
npm run preview:csr
npm run package:csr
```