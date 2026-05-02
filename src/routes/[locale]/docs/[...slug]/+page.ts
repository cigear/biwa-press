import { error } from '@sveltejs/kit';
import { getDocEntries, loadDoc } from '$lib/docs';
import { isLocale } from '$lib/config/locales';

export const prerender = true;

export async function load({ params }) {
  const locale = params.locale;

  if (!isLocale(locale)) {
    error(404, `Unknown locale: ${locale}`);
  }

  const slug = params.slug ?? '';
  return {
    locale,
    ...(await loadDoc(locale, slug))
  };
}

export function entries() {
  return getDocEntries().map((entry) => ({
    locale: entry.locale,
    slug: entry.slug
  }));
}
