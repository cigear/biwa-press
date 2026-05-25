import { redirect } from '@sveltejs/kit';
import { site } from '$lib/config/site';
import type { PageServerLoad } from './$types';

/** 访问根路径时，根据浏览器语言偏好自动跳转，site.defaultLocale 作为兜底 */
export const load: PageServerLoad = ({ request }) => {
	const acceptLanguage = request.headers.get('accept-language');
	let locale = site.defaultLocale;

	if (acceptLanguage) {
		// 解析 Accept-Language 请求头 (例如: "zh-CN,zh;q=0.9,en;q=0.8,ja;q=0.7")
		// 提取语言代码并转换为小写，然后匹配 site.locales 中支持的语言
		const candidate = acceptLanguage
			.split(',')
			.map((lang) => lang.split(';')[0].trim().split('-')[0].toLowerCase())
			.find((code) => site.locales.includes(code));

		if (candidate) {
			locale = candidate;
		}
	}

	throw redirect(307, `/${locale}/`);
};