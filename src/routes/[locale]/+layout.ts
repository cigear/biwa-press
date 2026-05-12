import { locale, waitLocale } from 'svelte-i18n';
import type { LayoutLoad } from './$types';

export const load: LayoutLoad = async ({ params }) => {
  // 从 URL 参数 [locale] 中提取语言并同步给 svelte-i18n
  const { locale: lang } = params;
  locale.set(lang);
  await waitLocale();
};