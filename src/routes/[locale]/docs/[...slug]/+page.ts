import { error } from '@sveltejs/kit';
import type { PageLoad } from './$types';
import { getDocEntries, loadDoc } from '$lib/docs';
import { isLocale } from '$lib/config/locales';

export const prerender = true;

export const load: PageLoad = async ({ params }) => {
  const locale = params.locale;

  if (!isLocale(locale)) {
    error(404, `Unknown locale: ${locale}`);
  }

  const slug = params.slug ?? '';
  const doc = await loadDoc(locale, slug);

  return {
    locale,
    ...doc,
    toc: doc.metadata?.toc ?? [] 
  };
}

export function entries() {
  return getDocEntries().map((entry) => ({
    locale: entry.locale,
    slug: entry.slug
  }));
}
