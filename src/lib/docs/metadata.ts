// src/lib/docs/metadata.ts
export type TocItem = {
  depth: number;
  title: string;
  slug: string;
};

export type DocMetadata = {
  title?: string;
  title_ja?: string;
  title_zh?: string;
  description?: string;
  order?: number;
  group?: string;
  toc?: TocItem[];
  [key: string]: unknown;
};

export type MdsvexModule = {
  default: unknown;
  metadata?: DocMetadata;
  [key: string]: unknown;
};

/**
 * 从 mdsvex 动态 import 的模块中，安全地取出 metadata。
 */
export function getDocMetadata(mod: MdsvexModule): DocMetadata {
  const metadata = (mod.metadata ?? {}) as DocMetadata;

  // 确保 toc 至少是空数组
  if (!Array.isArray(metadata.toc)) {
    metadata.toc = [];
  }

  return metadata;
}
