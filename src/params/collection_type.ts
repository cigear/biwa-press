import type { ParamMatcher } from '@sveltejs/kit';
import { site } from '$lib/config/site';

/**
 * 这个匹配器决定了哪些字符串可以作为有效的 collection 类型。
 * 只有当 URL 中的 [collection] 部分属于以下数组时，
 * 对应的路由 (如 src/routes/[locale]/[collection=collection_type]) 才会生效。
 */
export const match: ParamMatcher = (param) => {
    return site.collections.includes(param);
};