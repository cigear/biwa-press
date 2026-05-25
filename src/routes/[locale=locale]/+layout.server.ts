import { locale, waitLocale } from 'svelte-i18n';
import type { LayoutServerLoad } from './$types';
import type { Locale } from '$lib/config/locales';
import { getSidebar } from '$lib/docs.server';
import { site } from '$lib/config/site'; // 导入 site 配置

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

	let collection: string;

	// 路径段 0 是空的，1 是语言，2 才是集合名称
	const pathSegments = url.pathname.split('/').filter(Boolean); // 过滤掉空字符串
	if (pathSegments.length > 1 && site.collections.includes(pathSegments[1])) {
		collection = pathSegments[1];
	} else {
		let fromParam = null;
		try {
			// 🌟 核心修复：在 SSG 预渲染阶段，访问 searchParams 会抛出异常
			fromParam = url.searchParams.get('from');
		} catch (e) {
			// 忽略预渲染期间的错误，对于非集合页面（如标签页）默认使用 'docs'
		}
		collection = fromParam || 'docs';
	}

	// 预加载侧边栏数据，支持 SSG/SSR 渲染完整的 HTML
	const sidebar = await getSidebar(collection, lang);

	return { locale: lang, sidebar, path: url.pathname, collection };
};
