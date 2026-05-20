import { locale, waitLocale, dictionary } from 'svelte-i18n';
import { locales, type Locale } from '$lib/config/locales';
import type { LayoutLoad } from './$types';
import type { Group } from '$lib/docs'; // 假设 Group 类型在这里定义或导入

/**
 * 渲染模式控制 (SSG, SSR, CSR)
 * 通过环境变量 VITE_BIWA_RENDER_MODE 进行切换:
 * - 'ssg': 默认模式。ssr=true, prerender=true。生成静态 HTML，SEO 最好。
 * - 'ssr': 动态模式。ssr=true, prerender=false。每次请求实时渲染。
 * - 'csr': SPA 模式。ssr=false, prerender=false。仅客户端渲染。
 */
// SvelteKit 在构建时需要静态分析这些导出项。
// 使用 import.meta.env 配合 Vite 的预处理。
// 如果不设环境变量，默认 ssr = true, prerender = true (SSG模式)
export const ssr = import.meta.env.VITE_BIWA_RENDER_MODE !== 'csr';
export const prerender = import.meta.env.VITE_BIWA_RENDER_MODE === 'ssg' || import.meta.env.VITE_BIWA_RENDER_MODE === undefined;

let i18nInitialized = false;

interface LayoutLoadOutput {
  locale: Locale;
  path: string;
  // 添加其他可能来自 +layout.server.ts 的属性
  sidebar?: Group[]; // 假设 sidebar 是在 layout.server.ts 中加载的
  // 添加 layout load 函数可能返回的任何其他数据
}

export const load: LayoutLoad<LayoutLoadOutput> = async ({ data, params, url }) => {
  // 核心优化：直接设置全量字典，并使用守卫变量确保仅在应用启动时初始化一次
  if (!i18nInitialized) {
    dictionary.set(locales as any);
    i18nInitialized = true;
  }

  // 从 URL 参数 [locale] 中提取语言并同步给 svelte-i18n
  const lang = params.locale as Locale;
  locale.set(lang);
  await waitLocale();

  // 🌟 核心修复：合并从 +layout.server.ts 传来的数据 (包含 sidebar)
  // 这样子页面才能通过 data.sidebar 获取到侧边栏数据
  const layoutData = (data || {}) as { sidebar?: Group[] }; // 将 data 转换为预期类型（如果存在）
  return { ...layoutData, locale: lang, path: url.pathname };
};