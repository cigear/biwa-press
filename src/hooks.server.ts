import type { Handle } from '@sveltejs/kit';

export const handle: Handle = async ({ event, resolve }) => {
	// 从路由参数 [locale] 中获取语言
	const locale = event.params.locale || 'en';

	return resolve(event, {
		transformPageChunk: ({ html }) => {
			// 强制替换 %lang% 占位符
			return html.replace('%lang%', locale);
		}
	});
};