import { loadMarkdownFile } from '$lib/docs.server';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params }) => {
  const { locale } = params;
  
  // 利用新的 loadMarkdownFile 函数无条件渲染 guide/index.md
  const doc = await loadMarkdownFile(locale as any, 'index');
  
  return {
    metadata: doc.metadata,
    contentHtml: doc.contentHtml
  };
};