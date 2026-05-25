import { loadMarkdownFile } from '$lib/docs.server';
import type { PageServerLoad } from './$types';
import type { Locale } from '$lib/config/locales';

export const load: PageServerLoad = async ({ params }) => {
  const locale = params.locale as Locale;
  
  // 利用新的 loadMarkdownFile 函数无条件渲染 docs/{locale}/index.md
  // 这里的 'docs' 是作为整站的首页内容来源
  const doc = await loadMarkdownFile('docs', locale, 'index');
  
  return {
    collection: 'docs', // 明确告知 Layout 此时处于 docs 上下文
    metadata: doc.metadata,
    contentHtml: doc.contentHtml
  };
};