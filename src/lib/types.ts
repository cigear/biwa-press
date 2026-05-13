import type { Locale } from './config/locales';

export type SearchEntry = {
  locale: Locale;
  slug: string;
  href: string;
  title: string;
  description: string;
  content: string;
};