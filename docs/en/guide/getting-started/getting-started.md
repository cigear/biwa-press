---
title: Overview
description: Create and run your first Biwa Press docs site.
order: 1
---

# Getting Started

> 引用したい文章はこちらに記述します。
> 複数行になる場合は、改行ごとに `>` を記載する必要があります。
>> 引用したい文章はこちらに記述します。

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

Build a static site:

```bash
npm run build
```

The static output is written to `build/`.

## Image
```
![我的描述](/images/img_0001.jpg)
```
![我的描述](/images/img_0001.jpg)


## Video
```
::video[演示视频](/videos/1.mp4){width=300}{ratio=9:16}{poster=/videos/1.png}{lazy}
```
## Audio
::audio[/audios/1.mp3]

## Timeline
:::timeline
- **2023/10/26**
  - VitePress 1.0.0-rc.1 released.
- **2023/07/14**
  - VitePress 1.0.0-beta.7 released.
:::

## Gallery
:::gallery
- ![1](/images/img_0001.jpg)
- ![2](/images/img_0001.jpg)
- ![3](/images/img_0001.jpg)
- ![4](/images/img_0001.jpg)
- ![5](/images/img_0001.jpg)
- ![6](/images/img_0001.jpg)
- ...
:::

## Tabs
:::tabs
== Tab Title 1
Content for tab 1...
== Tab Title 2
Content for tab 2...
:::

## Collapse
:::details 点击查看代码示例
这里是折叠的内容，支持 **Markdown**。
- 列表项 1
- 列表项 2
:::

## Card
:::card 核心特性
- **快速部署**: 基于 SvelteKit 极速渲染
- **Markdown 优先**: 强大的扩展能力
- **自适应设计**: 完美适配各种屏幕
:::

:::card
这是一个没有标题的普通卡片，内容直接显示。
:::


:::card 带有标题的卡片
# 这是一个 H1 标题
## 这是一个 H2 标题
### 这是一个 H3 标题

这是卡片内的普通文本内容。
:::

## github
::github[markedjs/marked]
::github[sveltejs/kit]

### github sub