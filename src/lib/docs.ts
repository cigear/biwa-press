import { error } from '@sveltejs/kit';
import type { Component } from 'svelte';
import { isLocale, type Locale } from '$lib/config/locales';
import { LOCALES } from '$lib/locales';
import type { MdsvexModule, DocMetadata } from '$lib/docs/metadata';
import { getDocMetadata } from '$lib/docs/metadata';

// 扫描所有 Markdown 文件
const modules = import.meta.glob<MdsvexModule>('../../docs/**/*.md');

/* ---------------------------------------------
 * Group 类型（★ 导出给 Header / Sidebar 使用）
 * --------------------------------------------- */
export type Group = {
  dir: string;
  title: string;
  order: number;
  items: {
    slug: string;
    title: string;
    order: number;
  }[];
};

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

/* ---------------------------------------------
 * scanDocs(locale) → Promise<Group[]>
 * --------------------------------------------- */
export async function scanDocs(locale: Locale): Promise<Group[]> {
  const entries = getDocEntries().filter((e) => e.locale === locale);

  const groups: Record<string, Group> = {};

  for (const entry of entries) {
    const slug = entry.slug;
    const parts = slug.split('/');

    let dir = parts[0];
    if (!dir) dir = 'home';

    const fileSlug = slug;

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

    const localizedTitle =
      (metadata[`title_${locale}` as keyof DocMetadata] as string | undefined) ??
      metadata.title ??
      fileSlug
        .split('/')
        .pop()!
        .replace(/-/g, ' ')
        .replace(/\b\w/g, (c) => c.toUpperCase());

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

  for (const group of Object.values(groups)) {
    const indexItem = group.items.find((item) => item.slug === group.dir);
    group.order = indexItem?.order ?? 999;
  }

  for (const group of Object.values(groups)) {
    group.items.sort((a, b) => {
      if (a.slug === group.dir && b.slug !== group.dir) return -1;
      if (a.slug !== group.dir && b.slug === group.dir) return 1;
      return a.order - b.order;
    });
  }

  return Object.values(groups).sort((a, b) => {
    if (a.dir === 'home') return -1;
    if (b.dir === 'home') return 1;
    return a.order - b.order;
  });
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

/* ---------------------------------------------
 * getNav
 * --------------------------------------------- */
export function getNav(locale: Locale) {
  const entries = getDocEntries().filter((e) => e.locale === locale);

  const groups = [...new Set(entries.map((e) => e.slug.split('/')[0]))];

  groups.sort((a, b) => a.localeCompare(b));

  return groups.map((group) => ({
    title: group,
    href: `/${locale}/docs/${group}`
  }));
}
