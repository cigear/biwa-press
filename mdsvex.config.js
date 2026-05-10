import { defineMDSveXConfig as defineConfig, escapeSvelte } from 'mdsvex';
import { remarkTocHeadings } from './src/lib/markdown/remark-toc-headings.js';
import { createHighlighter } from 'shiki';
import { transformerMetaHighlight } from '@shikijs/transformers';
import rehypeSlug from 'rehype-slug';
import rehypeAutolinkHeadings from 'rehype-autolink-headings';

/**
 * Custom transformer to add line numbers for Shiki
 */
const transformerLineNumbers = () => ({
	name: 'line-numbers',
	line(node, line) {
		node.properties.line = line;
	},
	pre(node) {
		this.addClassToHast(node, 'has-line-numbers');
	}
});

const theme = 'github-dark';
const highlighter = await createHighlighter({
	themes: [theme],
	langs: ['javascript', 'typescript', 'bash', 'css', 'html', 'json', 'svelte', 'text']
});

const config = defineConfig({
  extensions: ['.md', '.svx'],
  remarkPlugins: [
    [remarkTocHeadings, { minDepth: 2, maxDepth: 3 }]
  ],
  rehypePlugins: [
    rehypeSlug,
    [rehypeAutolinkHeadings, { behavior: 'wrap' }]
  ],
  highlight: {
    highlighter: async (code, lang = 'text', meta) => {
      const html = escapeSvelte(highlighter.codeToHtml(code, { 
        lang, 
        theme,
        meta: { __raw: meta }, // 传递原始元数据字符串
        transformers: [
          transformerMetaHighlight(), // 支持 {1, 3-4} 高亮语法
          meta?.includes('showLineNumbers') && transformerLineNumbers(), // 如果包含 showLineNumbers 则显示行号
        ].filter(Boolean)
      }));
      return `{@html \`${html}\`}`;
    }
  }
});

export default config;
