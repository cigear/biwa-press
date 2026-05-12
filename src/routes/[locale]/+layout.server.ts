import { locale, waitLocale } from 'svelte-i18n';
import type { LayoutServerLoad } from './$types';
import type { Locale } from '$lib/config/locales';
import { getSidebar } from '$lib/docs.server';

// 根据构建环境变量决定渲染行为
const mode = (typeof process !== 'undefined' ? process.env.BIWA_RENDER_MODE : 'ssg') || 'ssg';

// SSG 模式下开启预渲染
export const prerender = mode === 'ssg';
// CSR 模式下禁用服务器端渲染
export const load: LayoutServerLoad = async ({ params, url }) => {
	const lang = (params.locale as Locale) || 'en';

	// 设置当前语言并等待对应的字典文件加载完成
	locale.set(lang);
	await waitLocale(lang);

	// 预加载侧边栏数据，支持 SSG/SSR 渲染完整的 HTML
	const sidebar = await getSidebar(lang);

	return { locale: lang, sidebar, path: url.pathname };
};
