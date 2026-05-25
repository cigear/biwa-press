import fs from 'node:fs';
import path from 'node:path';
import type { Locale } from '$lib/config/locales';

/* ------------------------------------------------------------------
 * [Infrastructure Layer] - DocRepository (存储适配器)
 * 封装底层文件系统操作，解耦 fs 依赖
 * ------------------------------------------------------------------ */
export const DocRepository = {
  getDocsRoot: (collection: string = 'docs') => {
    const docsPath = path.resolve(process.cwd(), collection);
    if (!fs.existsSync(docsPath) && process.env.NODE_ENV === 'production') {
      console.error(`[DocRepository] Docs root not found at: ${docsPath}`);
    }
    return docsPath;
  },
  
  exists: (p: string) => fs.existsSync(p),
  
  readText: (p: string) => fs.readFileSync(p, 'utf-8'),
  
  readDir: (p: string) => fs.readdirSync(p),
  
  isDir: (p: string) => fs.statSync(p).isDirectory(),

  /** 解析文档的物理路径 */
  resolvePath(collection: string, locale: Locale, slug: string = ''): string | null {
    const root = this.getDocsRoot(collection || 'docs');
    const normalized = (slug || '') === '' ? 'index' : slug;
    if (!locale) return null;
    const possible = [
      path.join(root, locale, `${normalized}.md`),
      ...(normalized !== 'index' ? [path.join(root, locale, normalized, 'index.md')] : [])
    ];
    return possible.find(p => this.exists(p)) || null;
  }
};