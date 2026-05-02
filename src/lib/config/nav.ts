import type { Locale } from './locales';

const labels = {
  en: {
    guide: 'Guide',
    reference: 'Reference'
  },
  zh: {
    guide: '指南',
    reference: '参考'
  },
  ja: {
    guide: 'ガイド',
    reference: 'リファレンス'
  }
} satisfies Record<Locale, Record<string, string>>;

export function getNav(locale: Locale) {
  return [
    { title: labels[locale].guide, href: `/${locale}/docs/guide/getting-started` },
    { title: labels[locale].reference, href: `/${locale}/docs/reference/cli` }
  ];
}
