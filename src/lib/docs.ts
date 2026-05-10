import { error } from '@sveltejs/kit';
import type { Component } from 'svelte';
import { isLocale, type Locale } from '$lib/config/locales';
import { LOCALES } from '$lib/locales';
import type { MdsvexModule, DocMetadata } from '$lib/docs/metadata';
import { getDocMetadata } from '$lib/docs/metadata';

// 扫描所有 Markdown 文件
const modules = import.meta.glob<MdsvexModule>('../../docs/**/*.md');

/* --------------------------------------------- 
 * 递归的 Sidebar 节点类型
 * --------------------------------------------- */
export type SidebarItem = {
  title: string;
  slug?: string;
  _path: string; // 内部用于唯一匹配路径
  order: number;
  items?: SidebarItem[];
};

export type Group = SidebarItem;

/* ---------------------------------------------
 * loadDoc
 * --------------------------------------------- */
export async function loadDoc(locale: Locale, slug: string) {
  const normalized = slug === '' ? 'index' : slug;

  let path = `../../docs/${locale}/${normalized}.md`;
  let loader = modules[path];

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

/* ---------------------------------------------
 * getDocEntries
 * --------------------------------------------- */
export function getDocEntries() {
  return Object.keys(modules)
    .map((path) => {
      const withoutPrefix = path.replace('../../docs/', '').replace(/\.md$/, '');
      const [locale, ...slugParts] = withoutPrefix.split('/');

      if (!isLocale(locale)) return null;

      let slug = slugParts.join('/');

      if (slug.endsWith('/index')) slug = slug.replace(/\/index$/, '');
      if (slug === 'index') slug = '';

      return { locale, slug };
    })
    .filter((e): e is { locale: Locale; slug: string } => e !== null);
}

/**
 * 递归扫描文档生成树状结构
 */
export async function scanDocs(locale: Locale): Promise<Group[]> {
  const entries = getDocEntries().filter((e) => e.locale === locale);
  const root: SidebarItem[] = [];

  for (const entry of entries) {
    const parts = entry.slug === '' ? [] : entry.slug.split('/');

    // 查找 Loader
    let path = `../../docs/${locale}/${entry.slug || 'index'}.md`;
    let loader = modules[path] || modules[`../../docs/${locale}/${entry.slug}/index.md`];
    if (!loader) continue;

    const mod = await loader();
    const metadata = getDocMetadata(mod);

    let currentLevel = root;
    let currentPath = '';

    // 递归构建/查找节点
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      currentPath = currentPath ? `${currentPath}/${part}` : part;
      const isLast = i === parts.length - 1;

      // 使用 _path 唯一匹配，避免重复
      let node = currentLevel.find((n) => n._path === currentPath);

      if (!node) {
        node = {
          title: part.replace(/-/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()),
          _path: currentPath,
          order: 999,
          items: []
        };
        currentLevel.push(node);
      }

      // 如果是当前文件对应的节点，更新其元数据
      if (isLast) {
        node.slug = currentPath;
        node.title = metadata.title ?? node.title;
        node.order = metadata.order ?? 999;
      } else {
        // 如果不是最后一层，继续向深层走
        if (!node.items) node.items = [];
        currentLevel = node.items;
      }
    }
  }

  // 递归排序
  const sortRecursive = (items: SidebarItem[]) => {
    // 优先按 order 排序，order 相同按标题字母排序
    items.sort((a, b) => (a.order - b.order) || a.title.localeCompare(b.title));
    for (const item of items) {
      if (item.items) {
        if (item.items.length === 0) {
          delete item.items; // 清理空的 items
        } else {
          sortRecursive(item.items);
        }
      }
    }
  };

  sortRecursive(root);
  return root;
}

/* ---------------------------------------------
 * getSidebar(locale) → 同步返回 Group[]
 * （★ Header / Sidebar 可以直接 each）
 * --------------------------------------------- */
const sidebarCache = new Map<Locale, Group[]>();

export async function getSidebar(locale: Locale): Promise<Group[]> {
  if (!sidebarCache.has(locale)) {
    sidebarCache.set(locale, await scanDocs(locale));
  }
  return sidebarCache.get(locale)!;
}
