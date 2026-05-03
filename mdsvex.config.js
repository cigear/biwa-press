import { defineMDSveXConfig as defineConfig } from 'mdsvex';
import { remarkTocHeadings } from './src/lib/markdown/remark-toc-headings.js';

const config = defineConfig({
  extensions: ['.md', '.svx'],
  remarkPlugins: [
    [remarkTocHeadings, { minDepth: 2, maxDepth: 3 }]
  ]
});

export default config;
