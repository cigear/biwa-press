import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { site } from '$lib/config/site';

/** 
 * 捕获根路径集合请求（如 /moments）并重定向到带语言环境的路径（如 /en/moments）
 * 使用 +server.ts 以获得更高的匹配优先级
 */
export const GET: RequestHandler = ({ request, params }) => {
    const collection = params.collection;
    console.log(`>>> [Redirect Endpoint] Found collection: ${collection}`);

    const acceptLanguage = request.headers.get('accept-language');
    let locale = site.defaultLocale;

    if (acceptLanguage) {
        // 解析 Accept-Language，匹配 site.locales 中支持的语言
        const candidate = acceptLanguage
            .split(',')
            .map((lang) => lang.split(';')[0].trim().split('-')[0].toLowerCase())
            .find((code) => site.locales.includes(code));

        if (candidate) {
            locale = candidate;
        }
    }

    const target = `/${locale}/${collection}`;
    console.log(`>>> [Redirect Endpoint] Redirecting to: ${target}`);

    // 使用 307 临时重定向
    throw redirect(307, target);
};