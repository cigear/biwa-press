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

### 刷新文档缓存

Biwa Press 在生产模式下（SSR）会缓存侧边栏结构和搜索索引以确保极致的响应速度。如果你通过 SFTP 或其他方式在 VPS 上更新了 Markdown 文件，可以通过以下 `curl` 命令强制刷新缓存，而无需重启 Node.js 进程：

```bash
# 请将 <YOUR_TOKEN> 替换为环境变量 REVALIDATE_TOKEN 的值
# 将 <YOUR_DOMAIN> 替换为你的实际域名或 IP (例如：your-domain.com 或 192.168.1.100:3000)
curl -X POST \
     -H "Authorization: Bearer <YOUR_TOKEN>" \
     https://<YOUR_DOMAIN>/api/refresh-cache
```

#### 配置说明
1. **安全性**：该接口受 `REVALIDATE_TOKEN` 保护。请确保在 VPS 的环境变量（如 `.env` 文件、pm2 配置文件或系统环境变量）中设置了一个强密码。
2. **本地测试**：
   ```bash
   curl -X POST -H "Authorization: Bearer your-secret-token" http://localhost:5173/api/refresh-cache
   ```
3. **生效范围**：此操作将重新扫描文档目录以更新侧边栏（Sidebar）目录树，并重新构建搜索索引（Search Index）。

# Biwa Press 媒体使用指南

本项目支持在 Markdown 中通过标准语法或自定义扩展语法来使用图片和视频。

## 图片 (Images)

使用标准 Markdown 语法。请将图片文件放置在 `static/` 目录下（例如 `static/images/`）。

```markdown
![图片描述](/images/your-image.jpg)
```

## 视频 (Videos)

Biwa Press 支持增强的视频嵌入语法，允许你控制尺寸、比例、封面图以及开启懒加载。

### 语法格式
`::类型标题{width=宽度}{ratio=比例}{poster=封面路径}{lazy}`

### 1. 本地视频
```markdown
::video[演示视频](/videos/1.mp4){width=300}{ratio=9:16}{poster=/videos/1.png}{lazy}
```

### 2. YouTube 视频
```markdown
::youtube[视频标题](YouTube_Video_ID){width=600}{ratio=16:9}{lazy}
```

### 3. Bilibili 视频
```markdown
::bilibili[视频标题](Bilibili_BV_ID){width=600}{ratio=16:9}{lazy}
```

### 参数详细说明
- **类型**: 可选值为 `video` (本地文件), `youtube`, `bilibili`。
- **{width=...}**: (可选) 设置视频的最大宽度（单位：像素）。
- **{ratio=...}**: (可选) 设置宽高比，支持 `16:9`、`9:16`、`4:3` 等格式。
- **{poster=...}**: (可选) 设置视频封面。强烈建议为本地视频设置封面，以解决 iOS 设备上的首帧白屏问题。
- **{lazy}**: (可选) 开启懒加载模式。视频将在滚动到页面可见区域时才开始加载并自动静音播放。
```

