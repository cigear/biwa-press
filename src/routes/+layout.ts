import { locale, waitLocale } from 'svelte-i18n';
import type { LayoutLoad } from './$types';

export const prerender = true;

export const load: LayoutLoad = async ({ params }) => {
	const lang = params.locale || 'en';
	
	// 设置当前语言并等待对应的字典文件加载完成
	locale.set(lang);
	await waitLocale(lang);

	return { lang };
};
