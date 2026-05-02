# 字体下载说明

本项目使用本地字体文件来支持多语言显示。

## 步骤

### 1. 下载字体

访问 **https://gwfh.mranftl.com/fonts** 并下载以下字体：

- **Inter** (字重: 400, 500, 600, 700)
- **Noto Sans JP** (字重: 400, 500, 600, 700)  
- **Noto Sans SC** (字重: 400, 500, 600, 700)

### 2. 文件夹结构

将下载的 `.woff2` 文件按以下结构放置：

```
static/fonts/
├── inter/
│   ├── inter-400.woff2
│   ├── inter-500.woff2
│   ├── inter-600.woff2
│   └── inter-700.woff2
├── noto-sans-jp/
│   ├── notosansjp-400.woff2
│   ├── notosansjp-500.woff2
│   ├── notosansjp-600.woff2
│   └── notosansjp-700.woff2
└── noto-sans-sc/
    ├── notosanssc-400.woff2
    ├── notosanssc-500.woff2
    ├── notosanssc-600.woff2
    └── notosanssc-700.woff2
```

### 3. 验证

下载完成后，启动开发服务器：

```bash
npm run dev
```

字体会自动根据语言切换：
- `/en/...` → Inter
- `/ja/...` → Noto Sans JP
- `/zh/...` → Noto Sans SC

## 注意

- 确保文件名与 `src/fonts.css` 中的 `url()` 路径一致
- 所有字体文件必须是 `.woff2` 格式
- 文件夹名称必须完全匹配（小写）
