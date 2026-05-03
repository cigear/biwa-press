import { error } from '@sveltejs/kit';
import type { Component } from 'svelte';
import { isLocale, type Locale } from '$lib/config/locales';
import { LOCALES } from '$lib/locales';
import type { MdsvexModule, DocMetadata } from '$lib/docs/metadata';
import { getDocMetadata } from '$lib/docs/metadata';

// 扫描所有 Markdown 文件
const modules = import.meta.glob<MdsvexModule>('../../docs/**/*.md');

/**
 * 加载单个文档（组件 + metadata + toc）
 * 支持：
 *   /guide.md
 *   /guide/index.md
 */
export async function loadDoc(locale: Locale, slug: string) {
  const normalized = slug === '' ? 'index' : slug;

  // 1) 尝试 docs/{locale}/{slug}.md
  let path = `../../docs/${locale}/${normalized}.md`;
  let loader = modules[path];

  // 2) 尝试 docs/{locale}/{slug}/index.md
  if (!loader) {
    path = `../../docs/${locale}/${normalized}/index.md`;
    loader = modules[path];
  }

  if (!loader) {
    error(404, `Document not found: ${locale}/${slug}`);
  }

  const mod = await loader();
  const metadata = getDocMetadata(mod);

  return {
    component: mod.default as Component,
    metadata,
    toc: metadata.toc ?? []
  };
}

/**
 * 获取所有文档条目（用于 Sidebar / Nav 自动生成）
 */
export function getDocEntries() {
  return Object.keys(modules)
    .map((path) => {
      const withoutPrefix = path.replace('../../docs/', '').replace(/\.md$/, '');
      const [locale, ...slugParts] = withoutPrefix.split('/');

      if (!isLocale(locale)) return null;

      let slug = slugParts.join('/');

      // guide/index → guide
      if (slug.endsWith('/index')) {
        slug = slug.replace(/\/index$/, '');
      }

      // 根 index.md → ""
      if (slug === 'index') slug = '';

      return { locale, slug };
    })
    .filter((entry): entry is { locale: Locale; slug: string } => entry !== null);
}

/**
 * 扫描所有文档（Sidebar 自动生成）
 * 支持目录 index.md
 */
export async function scanDocs(locale: Locale) {
  const entries = getDocEntries().filter((e) => e.locale === locale);

  const groups: Record<
    string,
    {
      dir: string;
      title: string;
      order: number;
      items: { slug: string; title: string; order: number }[];
    }
  > = {};

  for (const entry of entries) {
    const slug = entry.slug;
    const parts = slug.split('/');

    let dir = parts[0];
    if (!dir) dir = 'home';

    const fileSlug = slug;

    // ★★★ 支持目录 index.md（与 loadDoc 完全一致）★★★
    let path = `../../docs/${locale}/${slug || 'index'}.md`;
    let loader = modules[path];

    if (!loader) {
      path = `../../docs/${locale}/${slug}/index.md`;
      loader = modules[path];
    }

    if (!loader) continue;

    const mod = await loader();
    const metadata = getDocMetadata(mod);

    const localeData = LOCALES[locale];

    const groupTitle =
      dir === 'home'
        ? localeData.home ?? 'Home'
        : localeData[dir as keyof typeof localeData] ??
          dir.charAt(0).toUpperCase() + dir.slice(1);

    if (!groups[dir]) {
      groups[dir] = {
        dir,
        title: groupTitle,
        order: 999,
        items: []
      };
    }

    // title 处理
    const localizedTitle =
      (metadata[`title_${locale}` as keyof DocMetadata] as string | undefined) ??
      metadata.title ??
      fileSlug
        .split('/')
        .pop()!
        .replace(/-/g, ' ')
        .replace(/\b\w/g, (c) => c.toUpperCase());

    // ★★★ 数字排序：01.xxx.md → order = 1 ★★★
    let numericOrder = 999;
    const fileName = fileSlug.split('/').pop()!;
    const match = fileName.match(/^(\d+)[.-]/);
    if (match) numericOrder = parseInt(match[1], 10);

    groups[dir].items.push({
      slug: fileSlug,
      title: localizedTitle,
      order: metadata.order ?? numericOrder
    });
  }

  // ★★★ 读取每个 group 的 index.md 的 order（VitePress 同款）★★★
  for (const group of Object.values(groups)) {
    const indexItem = group.items.find((item) => item.slug === group.dir);
    group.order = indexItem?.order ?? 999;
  }

  // ★★★ 组内排序：index.md（slug === group.dir）永远排最前 ★★★
  for (const group of Object.values(groups)) {
    group.items.sort((a, b) => {
      // 首页（group/index.md）
      if (a.slug === group.dir && b.slug !== group.dir) return -1;
      if (a.slug !== group.dir && b.slug === group.dir) return 1;

      // 其他按 order 排序
      return a.order - b.order;
    });
  }

  // ★★★ 分组排序：按 group.order（不按中文标题）★★★
  const sortedGroups = Object.values(groups).sort((a, b) => {
    if (a.dir === 'home') return -1;
    if (b.dir === 'home') return 1;
    return a.order - b.order;
  });

  return sortedGroups;
}

/**
 * 自动 Nav（顶级目录）
 * 不加载文件，完全同步
 */
export function getNav(locale: Locale) {
  const entries = getDocEntries().filter((e) => e.locale === locale);

  const groups = [...new Set(entries.map((e) => e.slug.split('/')[0]))];

  groups.sort((a, b) => a.localeCompare(b));

  return groups.map((group) => ({
    title: group,
    href: `/${locale}/docs/${group}`
  }));
}
