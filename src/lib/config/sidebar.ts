import type { Locale } from '$lib/config/locales';
import { scanDocs } from '$lib/docs';

export async function getSidebar(locale: Locale) {
  const groups = await scanDocs(locale);

  return groups.map((group) => ({
    title: group.title, // 已经是 Title Case
    items: (group.items ?? []).map((item) => ({
      title: item.title,
      href: `/${locale}/docs/${item.slug ?? ''}`
    }))
  }));
}
