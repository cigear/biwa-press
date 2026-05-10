import type { Locale } from './locales';

const labels = {
  en: {
    github: 'github',
  },
  zh: {
    github: 'github',
  },
  ja: {
    github: 'github',
  }
} satisfies Record<Locale, Record<string, string>>;

export function getNav(locale: Locale) {
  return [
    { title: labels[locale].github, href: `https://github/cigear` },
  ];
}
