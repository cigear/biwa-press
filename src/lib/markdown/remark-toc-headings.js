// @ts-check

import { visit } from 'unist-util-visit';
import { toString } from 'mdast-util-to-string';
import GithubSlugger from 'github-slugger';

/**
 * @typedef {import('mdast').Heading} Heading
 */

/**
 * @typedef {Object} TocItem
 * @property {number} depth
 * @property {string} title
 * @property {string} slug
 */

/**
 * @typedef {Object} RemarkTocOptions
 * @property {number} [minDepth]
 * @property {number} [maxDepth]
 */

/**
 * @type {import('unified').Plugin<[RemarkTocOptions?]>}
 */
export function remarkTocHeadings(options = {}) {
  const { minDepth = 2, maxDepth = 3 } = options;
  const slugger = new GithubSlugger();

  return (tree, file) => {
    /** @type {TocItem[]} */
    const toc = [];

    visit(tree, 'heading', /** @param {Heading} node */ (node) => {
      const depth = node.depth;
      if (depth < minDepth || depth > maxDepth) return;

      const text = toString(node).trim();
      if (!text) return;

      const slug = slugger.slug(text);

      toc.push({ depth, title: text, slug });

      // ★★★ 强制扩展 node.data 类型（避免 TS 报错） ★★★
      /** @type {any} */
      const data = node.data || (node.data = {});
      data.hProperties ||= {};
      data.id = slug;
      data.hProperties.id = slug;
    });

    // ★★★ 关键修复：file.data 是 unknown，需要断言为 any ★★★
    /** @type {any} */
    const data = file.data;
    data.fm ||= {};
    data.fm.toc = toc;
  };
}
