# Biwa Press

A VitePress-like documentation framework starter powered by SvelteKit, Tailwind CSS 4, Bits UI, mdsvex, and static generation.

## Features

- ⚡️ **Svelte 5 & SvelteKit**: Modern, reactive, and fast.
- 🎨 **Tailwind CSS 4**: The latest utility-first CSS framework.
- 📝 **mdsvex**: Write documentation using Markdown with Svelte components.
- 🔍 **Built-in Search**: Fast client-side search functionality.
- 🌐 **Multi-language Support**: Built-in i18n support (EN, ZH, JA).
- 🛠️ **Flexible Rendering**: Supports SSG, SSR, and CSR modes.

## Development

```bash
npm install
npm run dev
```

## Build and Deployment

Biwa Press supports multiple rendering modes via environment variables:

### 1. SSG (Static Site Generation) - Recommended
Generates a full static site in the `build/ssg/` directory. Perfect for deployment on GitHub Pages, Netlify, or Vercel.
```bash
npm run build:ssg
npm run preview:ssg
npm run package:ssg
```

### 2. SSR (Server-Side Rendering)
Builds a Node.js server application in the `build/ssr/` directory. Use this mode if you need dynamic server-side logic.
```bash
npm run build:ssr
npm run preview:ssr
npm run package:ssr
```

### 3. CSR (Client-Side Rendering / SPA)
Generates a Single Page Application (SPA) in the `build/csr/` directory with an `index.html` fallback.
```bash
npm run build:csr
npm run preview:csr
npm run package:csr
```
