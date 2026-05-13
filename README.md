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

### Refreshing Document Cache

Biwa Press caches sidebar structures and search indexes in production (SSR) mode for optimal response speed. If you update Markdown files on your VPS via SFTP or other means, you can force a cache refresh using the following `curl` command without restarting the Node.js process:

```bash
# Replace <YOUR_TOKEN> with the value of your REVALIDATE_TOKEN environment variable.
# Replace <YOUR_DOMAIN> with your actual domain or IP (e.g., your-domain.com or 192.168.1.100:3000).
curl -X POST \
     -H "Authorization: Bearer <YOUR_TOKEN>" \
     https://<YOUR_DOMAIN>/api/refresh-cache
```

#### Configuration Notes
1. **Security**: This API is protected by `REVALIDATE_TOKEN`. Ensure you set a strong password for this environment variable on your VPS (e.g., in a `.env` file, pm2 configuration, or system environment variables).
2. **Local Testing**:
   ```bash
   curl -X POST -H "Authorization: Bearer your-secret-token" http://localhost:5173/api/refresh-cache
   ```
3. **Scope**: This operation will re-scan the document directories to update the sidebar (Sidebar) directory tree and rebuild the search index (Search Index).
```
