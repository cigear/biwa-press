import { loadDoc, loadMarkdownFile } from '$lib/docs.server';
import type { PageServerLoad } from './$types';
import type { Locale } from '$lib/config/locales';
import { redirect } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ params }) => {
	const locale = params.locale as Locale;
	const { collection, slug } = params;

	// 🌟 核心修复：清理冗余路径。如果访问的是 /index 或 /index.md，直接跳转到集合根路径
	if (slug === 'index' || slug === 'index.md') {
		throw redirect(307, `/${locale}/${collection}`);
	}

	let doc;

	if (!slug) {
		// 🌟 核心修复：仅在集合根路径时，使用 loadMarkdownFile 确保渲染 index.md 的完整内容
		doc = await loadMarkdownFile(collection, locale, 'index');
	} else {
		// 正常的文档路径继续使用 loadDoc 处理
		doc = await loadDoc(collection, locale, slug);
	}
 
	return {
		locale,
		collection,
		...doc
	};
};