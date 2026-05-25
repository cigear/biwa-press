import type { ParamMatcher } from '@sveltejs/kit';
import { site } from '$lib/config/site';

/**
 * 只有当路径段在 site.locales 中定义时，才匹配该路由
 */
export const match: ParamMatcher = (param) => {
    return site.locales.includes(param as any);
};