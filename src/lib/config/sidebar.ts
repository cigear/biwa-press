import type { Locale } from './locales';

export function getSidebar(locale: Locale) {
  return [
    {
      title: 'guide',
      items: [
        { title: 'gettingStarted', href: `/${locale}/docs/guide/getting-started` },
        { title: 'configuration', href: `/${locale}/docs/guide/configuration` }
      ]
    },
    {
      title: 'reference',
      items: [{ title: 'cli', href: `/${locale}/docs/reference/cli` }]
    }
  ];
}
