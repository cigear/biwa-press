import { error } from '@sveltejs/kit';
import type { Component } from 'svelte';
import { isLocale, type Locale } from '$lib/config/locales';

type MarkdownModule = {
  default: Component;
  metadata?: Record<string, string>;
};

const modules = import.meta.glob<MarkdownModule>('../../docs/**/*.md');

export async function loadDoc(locale: Locale, slug: string) {
  const normalized = slug === '' ? 'index' : slug;
  const path = `../../docs/${locale}/${normalized}.md`;
  const loader = modules[path];

  if (!loader) {
    error(404, `Document not found: ${locale}/${slug}`);
  }

  const mod = await loader();

  return {
    component: mod.default,
    metadata: mod.metadata ?? {}
  };
}

export function getDocEntries() {
  return Object.keys(modules)
    .map((path) => {
      const withoutPrefix = path.replace('../../docs/', '').replace(/\.md$/, '');
      const [locale, ...slugParts] = withoutPrefix.split('/');

      if (!isLocale(locale)) {
        return null;
      }

      const slug = slugParts.join('/').replace(/\/index$/, '');

      return {
        locale,
        slug: slug === 'index' ? '' : slug
      };
    })
    .filter((entry): entry is { locale: Locale; slug: string } => entry !== null);
}
