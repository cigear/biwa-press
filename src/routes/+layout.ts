import { locale, waitLocale } from 'svelte-i18n';
import type { LayoutLoad } from './$types';
import type { Locale } from '$lib/config/locales';

// 根据构建环境变量决定渲染行为
const mode = (typeof process !== 'undefined' ? process.env.BIWA_RENDER_MODE : 'ssg') || 'ssg';

// SSG 模式下开启预渲染
export const prerender = mode === 'ssg';
// CSR 模式下禁用服务器端渲染
export const ssr = mode !== 'csr';
export const csr = true;

export const load: LayoutLoad = async ({ data }) => {
	const { locale: lang } = data;

	// 设置当前语言并等待对应的字典文件加载完成
	locale.set(lang);
	await waitLocale(lang);
	return data;
};
