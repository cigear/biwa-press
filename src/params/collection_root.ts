import type { ParamMatcher } from '@sveltejs/kit';
import { site } from '$lib/config/site';

/**
 * 这个匹配器决定了哪些字符串可以作为有效的 collection 根路径。
 */
export const match: ParamMatcher = (param) => {
    return site.collections.includes(param);
};