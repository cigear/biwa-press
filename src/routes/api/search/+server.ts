import { json, type RequestHandler } from '@sveltejs/kit';
import { searchDocs } from '$lib/search';
import { isLocale, type Locale } from '$lib/config/locales';

export const GET: RequestHandler = async ({ url }) => {
  const query = url.searchParams.get('q') ?? '';
  const lang = url.searchParams.get('lang') ?? '';

  if (!lang || !isLocale(lang)) {
    return json({ error: 'Missing or invalid locale' }, { status: 400 });
  }

  const results = searchDocs(lang as Locale, query);

  return json(results);
};