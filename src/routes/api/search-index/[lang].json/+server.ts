import { json, type RequestHandler } from '@sveltejs/kit';
import { getFullIndex } from '$lib/search';
import { isLocale, type Locale } from '$lib/config/locales';

// 关键：允许 SvelteKit 在 build 时将其预渲染为静态 JSON 文件
export const prerender = true;

export const GET: RequestHandler = async ({ params }) => {
  const lang = params.lang;

  if (!lang || !isLocale(lang)) {
    return json({ error: 'Invalid locale' }, { status: 400 });
  }

  return json(await getFullIndex(lang as Locale));
};